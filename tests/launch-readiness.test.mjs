import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = path.resolve(import.meta.dirname, '..');
const requested = process.env.WINSTON_VERIFY_ROOT || '.';
const target = path.resolve(repo, requested);
const production = path.basename(target) === 'dist' || process.env.WINSTON_PRODUCTION === '1';
const read = rel => fs.readFileSync(path.join(target, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(target, rel));
const shaAt = (base, rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(base, rel))).digest('hex');
const residents = JSON.parse(fs.readFileSync(path.join(repo, 'assets/data/habitantes.json'), 'utf8'));
const articles = JSON.parse(fs.readFileSync(path.join(repo, 'assets/data/articles.json'), 'utf8'));
const publicRoots = [
  'index.html','habitantes.html','guardianes.html','tienda.html','como-ayudar.html','hazte-socio.html','apadrina.html',
  'teaming.html','donar.html','adopciones-solidarias.html','en-busca-del-paraiso.html','voluntariado.html','testimonios.html',
  'voluntariado-habitual.html','larga-estancia.html','actividades.html','sobre-nosotros.html','transparencia.html','contacto.html',
  'politica-de-privacidad.html'
];
const publicPages = [...publicRoots, ...residents.map(r => `animales/${r.slug}/index.html`)];

function count(re, text) { return (text.match(re) || []).length; }
function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  return blocks.map(x => JSON.parse(x));
}
function allFiles(base) {
  const out = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full); else out.push(full);
    }
  };
  walk(base);
  return out;
}

test('launch target exists', () => assert.ok(fs.existsSync(target), target));

test('resident pages and editorial sitemap URLs are preserved', () => {
  assert.equal(residents.length, 70);
  for (const row of residents) assert.ok(exists(`animales/${row.slug}/index.html`), row.slug);
  const sitemap = read('sitemap.xml');
  const editorialIndexes = 3;
  const expectedUrls = publicRoots.length + residents.length + editorialIndexes + articles.length;
  assert.equal(count(/<loc>/g, sitemap), expectedUrls);
  assert.ok(!sitemap.includes('administracion.html'));
  assert.ok(!sitemap.includes('404.html'));
});

test('staging and production indexing are separated', () => {
  const robots = read('robots.txt');
  for (const rel of publicPages) {
    const html = read(rel);
    if (production) assert.match(html, /<meta name="robots" content="index,follow"\/>/i, rel);
    else assert.match(html, /<meta name="robots" content="noindex,nofollow"\/>/i, rel);
  }
  if (production) {
    assert.match(robots, /Allow:\s*\//);
    assert.match(robots, /Sitemap:\s*https:\/\/santuariowinston\.org\/sitemap\.xml/);
  } else {
    assert.match(robots, /Disallow:\s*\//);
  }
  assert.match(read('administracion.html'), /noindex,nofollow/i);
  assert.match(read('404.html'), /noindex,nofollow/i);
});

test('CSS heredado y fuentes rotas are removed from public HTML', () => {
  for (const rel of publicRoots) {
    const html = read(rel);
    assert.ok(!html.includes('data-vinext-fonts'), rel);
    assert.ok(!html.includes('/assets/_vinext_fonts/'), rel);
    assert.match(html, /assets\/css\/winston-base\.css/, rel);
    assert.match(html, /assets\/css\/winston-enhancements\.css/, rel);
    assert.ok(!/<style>\s*:root\s*\{/i.test(html), rel);
  }
});

test('SEO metadata is complete on all legacy public pages', () => {
  for (const rel of publicPages) {
    const html = read(rel);
    assert.equal(count(/<title>/gi, html), 1, `${rel} title`);
    assert.match(html, /<meta name="description" content="[^"]+"\/>/i, `${rel} description`);
    assert.match(html, /<link rel="canonical" href="https:\/\/santuariowinston\.org\//i, `${rel} canonical`);
    assert.match(html, /property="og:title"/i, `${rel} og title`);
    assert.match(html, /property="og:description"/i, `${rel} og description`);
    assert.match(html, /property="og:url"/i, `${rel} og url`);
    assert.match(html, /property="og:image"/i, `${rel} og image`);
    assert.match(html, /property="og:image:alt" content="[^"]+"/i, `${rel} og image alt`);
    assert.match(html, /name="twitter:card" content="summary_large_image"/i, `${rel} twitter card`);
    assert.equal(count(/<h1(?:\s|>)/gi, html), 1, `${rel} h1`);
    assert.match(html, /<html[^>]+lang="es"/i, `${rel} lang`);
  }
});

test('JSON-LD is syntactically valid and contains required launch graph', () => {
  const homeBlocks = extractJsonLd(read('index.html'));
  assert.ok(homeBlocks.length >= 1);
  const home = JSON.stringify(homeBlocks);
  assert.match(home, /"Organization"/);
  assert.match(home, /"WebSite"/);
  for (const row of residents) {
    const blocks = extractJsonLd(read(`animales/${row.slug}/index.html`));
    assert.ok(blocks.length >= 1, row.slug);
    const joined = JSON.stringify(blocks);
    assert.match(joined, /"BreadcrumbList"/, row.slug);
    assert.ok(joined.includes(row.name), row.slug);
  }
});

test('404 and Cloudflare artifacts are present and safe', () => {
  assert.ok(exists('404.html'));
  const html = read('404.html');
  assert.match(html, /Página no encontrada/i);
  for (const link of ['index.html','habitantes.html','como-ayudar.html','contacto.html']) assert.ok(html.includes(link), link);
  assert.match(html, /noindex,nofollow/i);
  assert.ok(exists('_headers'));
  assert.ok(exists('_redirects'));
  assert.match(read('_headers'), /X-Content-Type-Options:\s*nosniff/);
  assert.match(read('_headers'), /Referrer-Policy:\s*strict-origin-when-cross-origin/);
  assert.match(read('_headers'), /\/administracion\.html[\s\S]*Cache-Control:\s*no-store/);
  assert.match(read('_redirects'), /\/index\.html\s+\/\s+301/);
  assert.match(read('_redirects'), /\/animales\/:slug\/index\.html\s+\/animales\/:slug\/\s+301/);
  const redirects = JSON.parse(read('assets/data/legacy-redirects.json'));
  assert.ok(Array.isArray(redirects));
});

test('hero uses optimized video and reduced-motion protection', () => {
  const hero = 'assets/media/optimized/video-intro-hero.mp4';
  const full = 'assets/media/optimized/video-intro-crowdfunding.mp4';
  assert.ok(exists(hero));
  assert.ok(exists(full));
  assert.ok(fs.statSync(path.join(target, hero)).size < fs.statSync(path.join(target, full)).size);
  const home = read('index.html');
  assert.match(home, /video-intro-hero\.mp4/);
  assert.match(home, /video-intro-crowdfunding\.mp4/);
  const campaignVideo = home.match(/<video[^>]+video-intro-crowdfunding\.mp4[^>]*>/i)?.[0] || '';
  assert.match(campaignVideo, /preload="none"/i);
  assert.match(read('assets/css/winston-enhancements.css'), /prefers-reduced-motion:\s*reduce/i);
});

test('accessibility essentials are present', () => {
  const css = read('assets/css/winston-enhancements.css');
  assert.match(css, /:focus-visible/);
  for (const rel of publicPages) {
    const html = read(rel);
    assert.match(html, /class="skip-link"[^>]+href="#contenido"/i, rel);
    assert.match(html, /<main[^>]+id="contenido"/i, rel);
    assert.match(html, /class="menu-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="mobile-navigation"/i, rel);
    assert.match(html, /id="mobile-navigation"[^>]+aria-hidden="true"/i, rel);
  }
  const contact = read('contacto.html');
  assert.match(contact, /id="contact-form-status"[^>]+role="status"[^>]+aria-live="polite"/i);
  for (const name of ['Ula','Bartola','Auka','Zeus','Diva','Argos','Bayron','Junco','Canelo','Wapi','Brandy','Yako']) {
    assert.ok(read('index.html').includes(`alt="${name}"`), name);
  }
});

test('all local HTML href/src and CSS url targets resolve', () => {
  const missing = [];
  for (const rel of [...publicPages, '404.html']) {
    const html = read(rel);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      let ref = match[1].split('#')[0].split('?')[0];
      if (!ref || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
      if (ref.endsWith('/')) ref += 'index.html';
      const resolved = path.normalize(path.join(path.dirname(rel), ref));
      if (!exists(resolved)) missing.push(`${rel} -> ${match[1]}`);
    }
  }
  for (const cssRel of ['assets/css/winston-base.css','assets/css/winston-enhancements.css']) {
    const css = read(cssRel);
    for (const match of css.matchAll(/url\((['"]?)([^)'"?#]+)\1\)/g)) {
      const ref = match[2].trim();
      if (!ref || /^(?:data:|https?:)/i.test(ref)) continue;
      const resolved = path.normalize(path.join(path.dirname(cssRel), ref));
      if (!exists(resolved)) missing.push(`${cssRel} -> ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('public output exposes no private storage scheme, service role, or Android app', () => {
  const bad = [];
  const re = /winston-storage:\/\/|SUPABASE_SERVICE_ROLE_KEY|sb_secret_[A-Za-z0-9_-]+/i;
  const deployable = [...publicPages, '404.html','assets/js/winston.js','assets/js/habitantes-directory.js'];
  for (const rel of deployable) {
    if (!exists(rel)) continue;
    const content = read(rel);
    if (re.test(content)) bad.push(rel);
  }
  assert.deepEqual(bad, []);
  assert.equal(exists('capacitor-mobile'), false);
});

test('administration protected files remain byte-identical', () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(repo, 'tests/admin-baseline.json'), 'utf8'));
  for (const [rel, expected] of Object.entries(baseline)) {
    assert.ok(exists(rel), rel);
    assert.equal(shaAt(target, rel), expected, rel);
  }
});

test('media inventory preserves 119 originals plus one optimized hero video', () => {
  const media = allFiles(path.join(target, 'assets/media'));
  assert.equal(media.length, 120);
  assert.equal(fs.readdirSync(path.join(target, 'assets/media/optimized/animales')).filter(x => x.endsWith('.webp')).length, 70);
});
