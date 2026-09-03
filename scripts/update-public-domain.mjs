import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const from = 'https://santuariowinston.com';
const to = 'https://santuariowinston.org';
const files = fs.readdirSync(root).filter(name => name.endsWith('.html') && name !== 'administracion.html').map(name => path.join(root, name));
const animals = path.join(root, 'animales');
if (fs.existsSync(animals)) {
  for (const slug of fs.readdirSync(animals)) {
    const file = path.join(animals, slug, 'index.html');
    if (fs.existsSync(file)) files.push(file);
  }
}
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replaceAll(from, to);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed++;
  }
}
console.log(`Dominio público preparado para .org en ${changed} páginas.`);
