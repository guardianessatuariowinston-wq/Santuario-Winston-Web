import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const sha = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
const rows = () => JSON.parse(read('assets/data/habitantes.json'));

const protectedAdmin = JSON.parse(read('tests/admin-baseline.json'));
for (const [rel, expected] of Object.entries(protectedAdmin)) {
  test(`admin baseline unchanged: ${rel}`, () => assert.equal(sha(rel), expected));
}

test('resident canonical data contains exactly 70 unique entries', () => {
  assert.ok(exists('assets/data/habitantes.json'));
  const data = rows();
  assert.equal(data.length, 70);
  assert.equal(new Set(data.map(x => x.slug)).size, 70);
});

test('resident JSON preserves required source fields', () => {
  const source = read('habitantes.html');
  for (const row of rows()) {
    assert.ok(row.name.trim());
    assert.match(row.image, /^assets\/media\/optimized\/animales\//);
    assert.ok(row.excerpt.trim().length > 10);
    assert.ok(Array.isArray(row.story) && row.story.length >= 1);
    assert.equal(row.source, 'habitantes.html');
    assert.ok(source.includes(row.name));
  }
});

test('all resident static pages exist and contain correct public metadata', () => {
  for (const row of rows()) {
    const rel = `animales/${row.slug}/index.html`;
    assert.ok(exists(rel), rel);
    const html = read(rel);
    assert.ok(html.includes(`<h1>${row.name}</h1>`), `${row.name} heading`);
    assert.ok(html.includes(`https://santuariowinston.com/animales/${row.slug}/`));
    assert.ok(html.includes('property="og:title"'));
    assert.ok(html.includes('application/ld+json'));
    assert.ok(!/winston-storage:\/\//i.test(html));
    assert.ok(!/winston-storage:\/\//i.test(html));
    assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|service_role\s*[:=]|passportNumber\s*[:=]/i.test(html));
  }
});

test('directory exposes progressive enhancer and individual story CTAs', () => {
  const html = read('habitantes.html');
  assert.ok(html.includes('assets/js/habitantes-directory.js'));
  assert.ok(html.includes('data-residents-directory'));
  assert.ok(html.includes('Conoce su historia'));
});

test('Guardianes page exists with approved protagonists and no shop claims', () => {
  assert.ok(exists('guardianes.html'));
  const html = read('guardianes.html');
  for (const name of ['Winston','Pegaso','Epona','Declan','Dolo']) assert.ok(html.includes(name));
  assert.ok(html.includes('habitantes.html'));
  assert.ok(!/Printful|Shopify|producto disponible|comprar camiseta/i.test(html));
});

test('public navigation exposes Descubre and Guardianes', () => {
  const pages = ['index.html','habitantes.html','como-ayudar.html','voluntariado.html','actividades.html','sobre-nosotros.html','contacto.html'];
  for (const page of pages) {
    const html = read(page);
    assert.ok(html.includes('Descubre'), page);
    assert.ok(html.includes('guardianes.html'), page);
  }
});

test('public footer exposes Guardianes in Descubre', () => {
  for (const page of ['index.html','habitantes.html','como-ayudar.html','voluntariado.html','actividades.html','sobre-nosotros.html','contacto.html']) {
    const html = read(page);
    assert.match(html, /<p class="footer-title">Descubre<\/p><a href="habitantes\.html">Los habitantes<\/a><a href="guardianes\.html">Los Guardianes<\/a>/, page);
  }
});

test('help hub exposes all approved collaboration pathways', () => {
  const html = read('como-ayudar.html');
  for (const href of ['hazte-socio.html','apadrina.html','teaming.html','donar.html','adopciones-solidarias.html','voluntariado.html','en-busca-del-paraiso.html']) assert.ok(html.includes(href), href);
});

test('mobile UX stylesheet contains safe-area and fluid typography protections', () => {
  const css = read('assets/css/winston-enhancements.css');
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /clamp\(/);
  assert.match(css, /\.floating-actions/);
});

test('staging is noindex and sitemap excludes admin while including residents', () => {
  assert.match(read('robots.txt'), /Disallow:\s*\//);
  const sitemap = read('sitemap.xml');
  assert.ok(!sitemap.includes('administracion'));
  for (const row of rows()) assert.ok(sitemap.includes(`/animales/${row.slug}/`), row.slug);
});


test('every local HTML href/src target resolves', () => {
  const htmlFiles = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).replaceAll('\\','/');
      if (entry.isDirectory()) {
        if (!['.git','docs','tests','scripts'].includes(entry.name)) walk(full);
      } else if (entry.name.endsWith('.html')) htmlFiles.push(rel);
    }
  };
  walk(root);
  const missing = [];
  for (const rel of htmlFiles) {
    const html = read(rel);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      let target = match[1].split('#')[0].split('?')[0];
      if (!target || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(target)) continue;
      if (target.endsWith('/')) target += 'index.html';
      const resolved = path.normalize(path.join(path.dirname(rel), target));
      if (!fs.existsSync(path.join(root, resolved))) missing.push(`${rel} -> ${match[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('public package preserves all original media files', () => {
  const mediaRoot = path.join(root, 'assets/media');
  let count = 0;
  const walk = dir => { for (const e of fs.readdirSync(dir,{withFileTypes:true})) e.isDirectory() ? walk(path.join(dir,e.name)) : count++; };
  walk(mediaRoot);
  assert.equal(count, 119);
  assert.equal(fs.readdirSync(path.join(mediaRoot,'optimized/animales')).filter(x => x.endsWith('.webp')).length, 70);
});

test('all resident pages preserve their complete story text', () => {
  for (const row of rows()) {
    const html = read(`animales/${row.slug}/index.html`);
    for (const paragraph of row.story) {
      const sample = paragraph.slice(0, Math.min(80, paragraph.length));
      const escaped = sample.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
      assert.ok(html.includes(escaped), `${row.name}: ${sample}`);
    }
  }
});

test('no private storage schemes or service-role credentials are exposed publicly', () => {
  const publicFiles = ['guardianes.html','habitantes.html', ...rows().map(r => `animales/${r.slug}/index.html`)];
  for (const rel of publicFiles) {
    const content = read(rel);
    assert.ok(!content.includes('winston-storage://'), rel);
    assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|service_role\s*[:=]/i.test(content), rel);
  }
});

test('all root public pages have staging noindex', () => {
  const roots = fs.readdirSync(root).filter(x => x.endsWith('.html') && x !== 'administracion.html');
  for (const rel of roots) assert.match(read(rel), /<meta name="robots" content="noindex,nofollow"\/>/i, rel);
});

test('Android app is outside this public package', () => {
  assert.equal(exists('capacitor-mobile'), false);
});
