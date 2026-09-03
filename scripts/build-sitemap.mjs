import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const residents = JSON.parse(fs.readFileSync(path.join(root,'assets/data/habitantes.json'),'utf8'));
const publicRoots = [
  '', 'habitantes.html','guardianes.html','como-ayudar.html','hazte-socio.html','apadrina.html','teaming.html','donar.html','adopciones-solidarias.html','en-busca-del-paraiso.html','voluntariado.html','testimonios.html','voluntariado-habitual.html','larga-estancia.html','actividades.html','sobre-nosotros.html','contacto.html','politica-de-privacidad.html'
];
const urls = [
  ...publicRoots.map(p => `https://santuariowinston.com/${p}`),
  ...residents.map(r => `https://santuariowinston.com/animales/${r.slug}/`),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'), xml, 'utf8');
const production = process.env.WINSTON_PRODUCTION === '1';
fs.writeFileSync(path.join(root,'robots.txt'), production
  ? 'User-agent: *\nAllow: /\n\nSitemap: https://santuariowinston.com/sitemap.xml\n'
  : 'User-agent: *\nDisallow: /\n', 'utf8');
console.log(`Sitemap generado: ${urls.length} URLs. Modo: ${production ? 'producción' : 'staging noindex'}.`);
