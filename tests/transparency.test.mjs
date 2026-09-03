import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const sha = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
const adminBaseline = JSON.parse(read('tests/admin-baseline.json'));
const related = ['sobre-nosotros.html','como-ayudar.html','donar.html','en-busca-del-paraiso.html'];


test('transparency hub exists with approved metadata and staging protection', () => {
  assert.ok(exists('transparencia.html'));
  const html = read('transparencia.html');
  assert.ok(html.includes('<h1>Transparencia y confianza</h1>'));
  assert.ok(html.includes('<link rel="canonical" href="https://santuariowinston.org/transparencia.html"/>'));
  assert.match(html, /<meta name="robots" content="noindex,nofollow"\/>/i);
  assert.ok(html.includes('property="og:title"'));
});

test('transparency hub contains every approved public section', () => {
  const html = read('transparencia.html');
  for (const id of ['quienes-somos','que-hacemos','uso-ayudas','campanas','documentacion','colaborar','preguntas','contacto-transparencia']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  for (const label of ['Quiénes somos','Qué hacemos','Cómo se utilizan las ayudas','Campañas y necesidades','Documentación pública','Formas de colaborar','Preguntas frecuentes']) {
    assert.ok(html.includes(label), label);
  }
});

test('transparency hub publishes no unconfirmed legal/economic figures or fake documents', () => {
  const html = read('transparencia.html');
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || '';
  assert.doesNotMatch(main, /\b(?:CIF|NIF|registro\s+\d|600\.000|46\s+caballos|\d+[,.]?\d*\s*%|gastos veterinarios|cuentas anuales\s+20\d{2})\b/i);
  assert.doesNotMatch(main, /\.pdf["']/i);
  assert.ok(main.includes('Todavía no hay documentos públicos incorporados en esta sección.'));
});

test('public document path is reserved without publishing sample documents', () => {
  assert.ok(exists('documentos/transparencia/.gitkeep'));
  const files = fs.readdirSync(path.join(root, 'documentos/transparencia'));
  assert.deepEqual(files, ['.gitkeep']);
});

test('transparency FAQ uses accessible native disclosure controls', () => {
  const html = read('transparencia.html');
  assert.ok((html.match(/<details/g) || []).length >= 5);
  assert.ok((html.match(/<summary>/g) || []).length >= 5);
  assert.ok(html.includes('contacto.html'));
});

test('related institutional and collaboration pages link contextually to transparency', () => {
  for (const page of related) {
    const html = read(page);
    assert.ok(html.includes('transparency-context'), page);
    assert.ok(html.includes('href="transparencia.html"'), page);
  }
});

test('public navigation and footer expose transparency discreetly', () => {
  for (const page of ['index.html','habitantes.html','guardianes.html','tienda.html','sobre-nosotros.html','como-ayudar.html','contacto.html','transparencia.html']) {
    const html = read(page);
    assert.ok(html.includes('href="transparencia.html"'), page);
  }
  const home = read('index.html');
  assert.ok(home.includes('<a href="transparencia.html">Transparencia</a>'));
  assert.doesNotMatch(home, /class="header-donate"[^>]*transparencia/i);
});

test('transparency is included in sitemap while admin remains excluded and staging remains blocked', () => {
  const sitemap = read('sitemap.xml');
  assert.ok(sitemap.includes('https://santuariowinston.org/transparencia.html'));
  assert.ok(!sitemap.includes('administracion'));
  assert.match(read('robots.txt'), /Disallow:\s*\//);
});

test('transparency styles provide responsive and focus-visible behavior', () => {
  const css = read('assets/css/winston-enhancements.css');
  for (const selector of ['.transparency-hero','.transparency-principles','.transparency-docs','.transparency-faq','.transparency-context']) assert.ok(css.includes(selector), selector);
  assert.ok(css.includes('@media (max-width: 760px)'));
  assert.ok(css.includes(':focus-visible'));
});

test('administration remains byte-identical to approved baseline', () => {
  for (const [rel, expected] of Object.entries(adminBaseline)) assert.equal(sha(rel), expected, rel);
});
