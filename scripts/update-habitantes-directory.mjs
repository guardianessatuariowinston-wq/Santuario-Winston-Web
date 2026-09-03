import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const file = path.join(root, 'habitantes.html');
const rows = JSON.parse(fs.readFileSync(path.join(root,'assets/data/habitantes.json'),'utf8'));
let html = fs.readFileSync(file,'utf8');
let index = 0;
html = html.replace(/<article class="resident-card"[^>]*>([\s\S]*?)<\/article>/g, (full, inner) => {
  const row = rows[index++];
  if (!row) return full;
  if (inner.includes('resident-profile-link')) return full;
  const injected = inner.replace(/<\/div>\s*$/, `<a class="resident-profile-link button button-outline" href="animales/${row.slug}/">Conoce su historia <span aria-hidden="true">→</span></a></div>`);
  return `<article class="resident-card" data-resident-slug="${row.slug}">${injected}</article>`;
});
if (index !== rows.length) throw new Error(`Actualizadas ${index} tarjetas; esperadas ${rows.length}`);
html = html.replace('<section class="resident-section" id="directorio">','<section class="resident-section" id="directorio" data-residents-directory>');
if (!html.includes('assets/js/habitantes-directory.js')) {
  html = html.replace('</head>', '<script defer src="assets/js/habitantes-directory.js"></script></head>');
}
fs.writeFileSync(file, html, 'utf8');
console.log(`Directorio actualizado: ${index} tarjetas enlazadas.`);
