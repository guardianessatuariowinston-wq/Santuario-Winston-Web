import fs from 'node:fs';
import path from 'node:path';
import { desktopNav, mobileNav } from './public-shell.mjs';

const root = path.resolve(import.meta.dirname, '..');
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html') && name !== 'administracion.html');
const activeFor = (name) => {
  if (name === 'index.html') return 'inicio';
  if (['habitantes.html','guardianes.html','sobre-nosotros.html','transparencia.html'].includes(name)) return 'descubre';
  if (name === 'apadrina.html') return 'padrinos';
  if (['como-ayudar.html','hazte-socio.html','teaming.html','donar.html','adopciones-solidarias.html','en-busca-del-paraiso.html'].includes(name)) return 'ayudar';
  if (['voluntariado.html','testimonios.html','voluntariado-habitual.html','larga-estancia.html'].includes(name)) return 'voluntariado';
  if (name === 'actividades.html') return 'actividades';
  if (name === 'tienda.html') return 'tienda';
  if (name === 'contacto.html') return 'contacto';
  return '';
};

for (const name of pages) {
  const file = path.join(root, name);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = html.replace(/<nav class="desktop-nav" aria-label="Navegación principal">[\s\S]*?<\/nav>/, desktopNav('', activeFor(name)));
  html = html.replace(/<nav aria-label="Navegación móvil">[\s\S]*?<\/nav>/, mobileNav(''));
  if (!/<meta name="robots"/i.test(html)) html = html.replace(/<meta name="description"[^>]*\/>/, match => `${match}<meta name="robots" content="noindex,nofollow"/>`);
  html = html.replace(/(<p class="footer-title">Descubre<\/p><a href="habitantes\.html">Los habitantes<\/a>)(?!<a href="guardianes\.html">)/, '$1<a href="guardianes.html">Los Guardianes</a>');
  html = html.replace('<a href="sobre-nosotros.html">Nuestra historia</a><a href="actividades.html">Puertas abiertas</a>', '<a href="sobre-nosotros.html">Nuestra historia</a><a href="transparencia.html">Transparencia</a><a href="actividades.html">Puertas abiertas</a>');
  html = html.replace('<a href="donar.html">Donativos</a></div><div class="footer-contact">', '<a href="donar.html">Donativos</a><a href="tienda.html">Tienda solidaria</a></div><div class="footer-contact">');
  if (html === before) console.warn(`Sin cambios de shell: ${name}`);
  fs.writeFileSync(file, html, 'utf8');
}
console.log(`Shell público actualizado en ${pages.length} páginas.`);
