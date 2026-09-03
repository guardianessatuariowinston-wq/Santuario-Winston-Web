import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const production = process.env.WINSTON_PRODUCTION === '1';
const value = production ? 'index,follow' : 'noindex,nofollow';
const rootPages = fs.readdirSync(root).filter(name => name.endsWith('.html') && name !== 'administracion.html');
const animalPages = [];
const animalsDir = path.join(root,'animales');
if (fs.existsSync(animalsDir)) for (const slug of fs.readdirSync(animalsDir)) animalPages.push(path.join('animales',slug,'index.html'));
for (const rel of [...rootPages, ...animalPages]) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file,'utf8');
  if (/<meta name="robots"[^>]*>/i.test(html)) html = html.replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${value}"/>`);
  else html = html.replace('</title>', `</title><meta name="robots" content="${value}"/>`);
  fs.writeFileSync(file,html,'utf8');
}
console.log(`${rootPages.length + animalPages.length} páginas configuradas: ${value}`);
