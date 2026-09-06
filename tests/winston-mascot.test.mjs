import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const size = rel => fs.statSync(path.join(root, rel)).size;

test('Winston acts as the guide in Aprende', () => {
  const html = read('aprende/index.html');
  assert.ok(html.includes('data-winston-guide="aprende"'));
  assert.ok(html.includes('../assets/media/mascota/winston-aprende.webp'));
  assert.match(html, /Hola, soy Winston/i);
  assert.match(html, /¿Preparado para descubrir algo nuevo\?/i);
});

test('the content generator preserves the Aprende mascot guide', () => {
  const source = read('scripts/build-content.mjs');
  assert.ok(source.includes('data-winston-guide="aprende"'));
  assert.ok(source.includes('winston-aprende.webp'));
});

test('Winston accompanies the sponsorship flow', () => {
  const html = read('apadrina.html');
  assert.ok(html.includes('data-winston-guide="padrinos"'));
  assert.ok(html.includes('assets/media/mascota/winston-padrinos.webp'));
  assert.match(html, /¿Te ayudo a elegir a quién apadrinar\?/i);
  assert.match(html, /Conocer a los habitantes/i);
});

test('home sponsorship block introduces Winston without replacing existing calls to action', () => {
  const html = read('index.html');
  assert.ok(html.includes('data-winston-guide="home-padrinos"'));
  assert.ok(html.includes('assets/media/mascota/winston-padrinos.webp'));
  assert.match(html, /Conocer a quién puedo apadrinar/i);
  assert.match(html, /Ver habitantes/i);
});

test('mascot assets are optimized and dimensions are declared to avoid layout shift', () => {
  for (const rel of [
    'assets/media/mascota/winston-aprende.webp',
    'assets/media/mascota/winston-padrinos.webp'
  ]) {
    assert.ok(exists(rel), rel);
    assert.ok(size(rel) < 180_000, `${rel} should stay under 180 KB`);
  }
  for (const rel of ['aprende/index.html', 'apadrina.html', 'index.html']) {
    const html = read(rel);
    assert.match(html, /class="winston-guide-image"[^>]*width="\d+"[^>]*height="\d+"/);
  }
});

test('mascot guide has responsive and reduced-motion styles', () => {
  const css = read('assets/css/winston-enhancements.css');
  assert.match(css, /\.winston-guide\s*\{/);
  assert.match(css, /\.winston-guide-image/);
  assert.match(css, /@media\s*\(max-width:\s*700px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('public shell keeps Padrinos as a top-level desktop and mobile destination', () => {
  const shell = read('scripts/public-shell.mjs');
  const updater = read('scripts/update-public-shell.mjs');
  assert.ok(shell.includes("activeClass(active,'padrinos')"), 'desktop shell must expose a dedicated Padrinos active state');
  assert.match(shell, /nav-item[^\n]*padrinos[\s\S]*?apadrina\.html[^\n]*>Padrinos</i);
  assert.match(shell, /drawer-group[^\n]*apadrina\.html[^\n]*>Padrinos<\/a>/i);
  assert.doesNotMatch(shell, /drawer-child[^\n]*apadrina\.html[^\n]*>Apadrina<\/a>/i);
  assert.match(shell, /footer-main[\s\S]*?Hazte socio<\/a><a href="\$\{href\(prefix,'apadrina\.html'\)\}">Padrinos<\/a><a href="\$\{href\(prefix,'donar\.html'\)\}">Donativos/, 'footer must keep Padrinos visible in Participa');
  assert.ok(updater.includes("if (name === 'apadrina.html') return 'padrinos';"), 'apadrina.html must activate the Padrinos top-level item');
});
