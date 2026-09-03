import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const sha = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
const residents = JSON.parse(read('assets/data/habitantes.json'));
const adminBaseline = JSON.parse(read('tests/admin-baseline.json'));

const publicRoots = ['index.html','habitantes.html','guardianes.html','como-ayudar.html','voluntariado.html','actividades.html','sobre-nosotros.html','contacto.html','tienda.html'];

test('storefront exists with confirmed books and preparation-only POD collections', () => {
  const html = read('tienda.html');
  assert.ok(html.includes('Tienda solidaria'));
  assert.ok(html.includes('https://www.amazon.es/dp/B0GX2YP7SR'));
  assert.ok(html.includes('https://amzn.eu/d/05Ol7VgK'));
  for (const label of ['Ropa solidaria','Los Guardianes del Santuario Winston','Accesorios y objetos cotidianos']) assert.ok(html.includes(label));
  assert.ok((html.match(/En preparación/g) || []).length >= 3);
});

test('storefront contains no fake commerce or invented POD prices', () => {
  const html = read('tienda.html');
  assert.doesNotMatch(html, /<form[^>]*(?:checkout|card|tarjeta)|stripe|paypal|añadir al carrito|add to cart/i);
  assert.doesNotMatch(html, /(?:€|EUR)\s*\d|\d+[,.]\d{2}\s*€/i);
  assert.doesNotMatch(html, /Printful|Hostinger/i);
});

test('storefront is linked from desktop mobile footer and resident pages', () => {
  for (const page of publicRoots) assert.ok(read(page).includes('tienda.html'), page);
  for (const resident of residents) assert.ok(read(`animales/${resident.slug}/index.html`).includes('../../tienda.html'), resident.slug);
});

test('Guardianes remains editorial while linking to storefront', () => {
  const html = read('guardianes.html');
  assert.ok(html.includes('storefront-editorial-link'));
  assert.ok(html.includes('Ver libros y futura colección solidaria'));
  assert.doesNotMatch(html, /añadir al carrito|checkout|precio/i);
});

test('Cómo ayudar and Inicio expose a discreet storefront path', () => {
  assert.ok(read('como-ayudar.html').includes('Compra con propósito</small><strong>Tienda solidaria'));
  assert.ok(read('index.html').includes('home-storefront-teaser'));
});

test('sitemap contains storefront and staging remains blocked', () => {
  assert.ok(read('sitemap.xml').includes('/tienda.html'));
  assert.match(read('robots.txt'), /Disallow:\s*\//);
  assert.match(read('tienda.html'), /<meta name="robots" content="noindex,nofollow"\/>/i);
});

test('admin remains byte-identical to approved baseline', () => {
  for (const [rel, expected] of Object.entries(adminBaseline)) assert.equal(sha(rel), expected, rel);
});

test('storefront stylesheet provides responsive and focus protections', () => {
  const css = read('assets/css/winston-enhancements.css');
  for (const selector of ['.storefront-hero','.storefront-steps','.storefront-collection-grid','.storefront-books-grid','.home-storefront-teaser']) assert.ok(css.includes(selector));
  assert.ok(css.includes('@media (max-width: 760px)'));
  assert.ok(css.includes(':focus-visible'));
});

test('root public footers expose Tienda solidaria', () => {
  for (const page of ['index.html','habitantes.html','guardianes.html','como-ayudar.html','voluntariado.html','actividades.html','sobre-nosotros.html','contacto.html']) {
    const html = read(page);
    assert.ok(html.includes('<a href="tienda.html">Tienda solidaria</a>'), page);
  }
});

test('public canonical metadata is prepared for santuariowinston.org', () => {
  const roots = ['index.html','habitantes.html','guardianes.html','tienda.html','como-ayudar.html','voluntariado.html','actividades.html','sobre-nosotros.html','contacto.html'];
  for (const page of roots) {
    const html = read(page);
    assert.match(html, /<link rel="canonical" href="https:\/\/santuariowinston\.org\//i, page);
    assert.doesNotMatch(html, /<link rel="canonical" href="https:\/\/santuariowinston\.com\//i, page);
  }
  for (const resident of residents) assert.ok(read(`animales/${resident.slug}/index.html`).includes(`https://santuariowinston.org/animales/${resident.slug}/`), resident.slug);
});
