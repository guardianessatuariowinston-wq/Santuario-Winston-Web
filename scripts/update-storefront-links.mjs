import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, html) => fs.writeFileSync(path.join(root, file), html, 'utf8');

function updateGuardianes() {
  const file = 'guardianes.html';
  let html = read(file);
  if (!html.includes('storefront-editorial-link')) {
    const target = '<a class="button button-primary" href="https://www.amazon.es/dp/B0GX2YP7SR" target="_blank" rel="noreferrer">Ver la edición Kindle →</a>';
    if (!html.includes(target)) throw new Error('No se encontró el CTA Kindle en guardianes.html');
    html = html.replace(target, `${target}<a class="text-link storefront-editorial-link" href="tienda.html">Ver libros y futura colección solidaria →</a>`);
  }
  write(file, html);
}

function updateHelp() {
  const file = 'como-ayudar.html';
  let html = read(file);
  if (!html.includes('Compra con propósito</small><strong>Tienda solidaria')) {
    const marker = '<div class="help-intent-grid">';
    const start = html.indexOf(marker);
    if (start < 0) throw new Error('No se encontró help-intent-grid en como-ayudar.html');
    const close = html.indexOf('</div></div></section>', start);
    if (close < 0) throw new Error('No se encontró el cierre de help-intent-grid');
    const card = '<a href="tienda.html"><small>Compra con propósito</small><strong>Tienda solidaria</strong><span>Descubre los libros publicados y las colecciones que estamos preparando.</span></a>';
    html = html.slice(0, close) + card + html.slice(close);
  }
  write(file, html);
}

function updateHome() {
  const file = 'index.html';
  let html = read(file);
  if (!html.includes('home-storefront-teaser')) {
    const marker = '</main>';
    const index = html.lastIndexOf(marker);
    if (index < 0) throw new Error('No se encontró </main> en index.html');
    const block = '<section class="home-storefront-teaser section-space"><div class="shell"><div><p class="eyebrow">Otra forma de sumar</p><h2>Una tienda con propósito.</h2><p>Los libros ya publicados y una futura colección solidaria que estamos preparando sin grandes cantidades de stock.</p></div><a class="button button-outline" href="tienda.html">Conocer la tienda</a></div></section>';
    html = html.slice(0, index) + block + html.slice(index);
  }
  write(file, html);
}

updateGuardianes();
updateHelp();
updateHome();
console.log('Integraciones editoriales de Tienda actualizadas.');
