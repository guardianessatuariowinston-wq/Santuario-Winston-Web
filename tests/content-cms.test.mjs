import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const migrationBySuffix = suffix => fs.readdirSync(path.join(root, 'supabase/migrations')).find(name => name.endsWith(suffix));

test('content CMS migration creates isolated articles redirects and RLS', () => {
  const migration = migrationBySuffix('_content_cms_phase1.sql');
  assert.ok(migration, 'content CMS migration');
  const sql = read(`supabase/migrations/${migration}`);
  for (const table of ['content_articles','content_redirects','content_audit_log']) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`, 'i'), table);
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `${table} RLS`);
  }
  assert.match(sql, /body_markdown text not null/i);
  assert.match(sql, /related_resident_slugs text\[\]/i);
  assert.match(sql, /status text not null default 'draft'/i);
  assert.match(sql, /create policy "content_articles_public_read"/i);
  assert.match(sql, /status = 'published'/i);
});



test('historical content preserves source provenance before recovery', () => {
  const migration = migrationBySuffix('_content_archive_provenance.sql');
  assert.ok(migration, 'archive provenance migration');
  const sql = read(`supabase/migrations/${migration}`);
  for (const column of ['source_url','original_published_at','original_author_name','review_note']) {
    assert.match(sql, new RegExp(`add column(?: if not exists)? ${column}\\b`, 'i'), column);
  }
  const admin = read('supabase/functions/winston-content-admin/index.ts');
  for (const marker of ['source_url','original_published_at','original_author_name','review_note']) assert.ok(admin.includes(marker), marker);
});


test('initial educational archive is recovered as drafts with provenance', () => {
  const migration = migrationBySuffix('_content_archive_initial_drafts.sql');
  assert.ok(migration, 'initial archive drafts migration');
  const sql = read(`supabase/migrations/${migration}`);
  const slugs = [
    'los-caballos-y-la-claustrofobia',
    'el-lugar-donde-vive-tu-caballo-es-seguro',
    'ya-no-monto-a-caballo',
    'el-caballo-en-invierno',
    'tocar-y-acariciar',
    'observa-y-acercate-a-los-caballos-para-conocerlos',
  ];
  for (const slug of slugs) assert.ok(sql.includes(slug), slug);
  assert.match(sql, /'draft'/i);
  assert.match(sql, /santuariowinston\.wordpress\.com/i);
});
test('content admin and public edge functions are isolated with explicit access rules', () => {
  for (const rel of ['supabase/functions/winston-content-admin/index.ts','supabase/functions/winston-content-public/index.ts']) assert.ok(exists(rel), rel);
  const admin = read('supabase/functions/winston-content-admin/index.ts');
  const pub = read('supabase/functions/winston-content-public/index.ts');
  assert.match(admin, /allowedRoles\s*=\s*new Set\(\["technical",\s*"admin"\]\)/);
  assert.match(admin, /admin\.auth\.getUser\(token\)/);
  for (const action of ['dashboard','articles','article','save_article','delete_article','redirects']) assert.ok(admin.includes(`action === "${action}"`), action);
  assert.match(admin, /WINSTON_DEPLOY_HOOK_URL/);
  assert.ok(!admin.includes('winston_sync_records'), 'content must not be mixed into operational sync records');
  assert.match(pub, /status.*published/s);
  assert.match(pub, /published_at/s);
  assert.ok(!/email|phone|service_role[^\n]*return/i.test(pub), 'public export must not expose private/admin fields or keys');
});

test('administration exposes Content section through a separate API endpoint', () => {
  const html = read('administracion.html');
  const api = read('assets/js/admin-api.js');
  const js = read('assets/js/admin.js');
  assert.ok(html.includes('data-section="content"'));
  assert.match(html, />Contenido</);
  assert.match(api, /CONTENT_ENDPOINT/);
  assert.match(api, /async function callContent\(/);
  assert.match(api, /winston-content-admin/);
  for (const marker of ['renderContent','save_article','delete_article','Api.callContent']) assert.ok(js.includes(marker), marker);
});

test('safe markdown renderer supports editorial formatting without raw HTML execution', async () => {
  const rel = 'scripts/content-markdown.mjs';
  assert.ok(exists(rel), rel);
  const { renderMarkdown } = await import(path.join(root, rel));
  const html = renderMarkdown('## Bienestar\n\nTexto con **énfasis** y [enlace](https://example.org).\n\n- Uno\n- Dos\n\n<script>alert(1)</script>');
  assert.match(html, /<h2>Bienestar<\/h2>/);
  assert.match(html, /<strong>énfasis<\/strong>/);
  assert.match(html, /<a href="https:\/\/example\.org"/);
  assert.match(html, /<ul><li>Uno<\/li><li>Dos<\/li><\/ul>/);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('alert(1)'));
});

test('content builder generates index and article pages from the local public snapshot', () => {
  const script = 'scripts/build-content.mjs';
  assert.ok(exists(script), script);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'winston-content-'));
  fs.mkdirSync(path.join(temp, 'assets/data'), { recursive: true });
  fs.writeFileSync(path.join(temp, 'assets/data/articles.json'), JSON.stringify([
    {
      id: 'article-1', slug: 'como-duermen-los-caballos', kind: 'aprende', title: 'Cómo duermen los caballos',
      excerpt: 'Descanso y seguridad en los caballos.', body_markdown: '## Descanso\n\nUn caballo necesita sentirse seguro.',
      author_name: 'Santuario Winston', published_at: '2026-09-03T12:00:00Z', updated_at: '2026-09-03T12:00:00Z',
      featured_image_path: null, featured_image_alt: null, seo_title: null, seo_description: null, related_resident_slugs: ['zeus']
    }
  ], null, 2));
  fs.writeFileSync(path.join(temp, 'assets/data/habitantes.json'), JSON.stringify([{ slug: 'zeus', name: 'Zeus', image: 'assets/media/optimized/animales/zeus.webp', excerpt: 'Historia de Zeus' }]));
  const result = spawnSync(process.execPath, [script], { cwd: root, env: { ...process.env, WINSTON_BUILD_ROOT: temp }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const index = path.join(temp, 'aprende/index.html');
  const article = path.join(temp, 'aprende/como-duermen-los-caballos/index.html');
  assert.ok(fs.existsSync(index), index);
  assert.ok(fs.existsSync(article), article);
  const html = fs.readFileSync(article, 'utf8');
  assert.match(html, /Cómo duermen los caballos/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /https:\/\/santuariowinston\.org\/aprende\/como-duermen-los-caballos\//);
  assert.match(html, /Conoce a Zeus/);
});

test('public build pipeline syncs content before generating pages and release copies content directories', () => {
  const build = read('scripts/build-public.mjs');
  const release = read('scripts/build-release.mjs');
  assert.ok(build.indexOf("sync-public-content.mjs") < build.indexOf("build-content.mjs"), 'sync must run before content build');
  assert.match(release, /blog/);
  assert.match(release, /aprende/);
  assert.match(release, /historias/);
});

test('sitemap and Cloudflare redirects include generated editorial content', () => {
  const sitemap = read('scripts/build-sitemap.mjs');
  const cloudflare = read('scripts/build-cloudflare-config.mjs');
  assert.match(sitemap, /articles\.json/);
  assert.match(sitemap, /contentPathForArticle/);
  assert.match(cloudflare, /content-redirects\.json/);
});

test('public navigation exposes Blog and Aprende without removing existing sections', () => {
  const shell = read('scripts/public-shell.mjs');
  for (const label of ['Blog','Aprende con Winston']) assert.ok(shell.includes(label), label);
  for (const legacy of ['Habitantes','Cómo ayudar','Voluntariado','Actividades','Tienda','Contacto']) assert.ok(shell.includes(legacy), legacy);
});
