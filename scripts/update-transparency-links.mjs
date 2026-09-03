import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, html) => fs.writeFileSync(path.join(root, file), html, 'utf8');

const blocks = {
  'sobre-nosotros.html': '<section class="transparency-context section-space"><div class="shell"><div><p class="eyebrow">Confianza institucional</p><h2>Conoce también la información pública del Santuario.</h2><p>Hemos creado un espacio específico para reunir de forma clara campañas, documentación disponible y formas de colaboración.</p></div><a class="button button-outline" href="transparencia.html">Ir a Transparencia</a></div></section>',
  'como-ayudar.html': '<section class="transparency-context section-space"><div class="shell"><div><p class="eyebrow">Antes de colaborar</p><h2>Información clara para decidir cómo quieres ayudar.</h2><p>Consulta el Centro de Transparencia para conocer qué información pública está disponible y cómo organizamos las distintas vías de colaboración.</p></div><a class="button button-outline" href="transparencia.html">Ver Transparencia</a></div></section>',
  'donar.html': '<section class="transparency-context section-space"><div class="shell"><div><p class="eyebrow">Confianza</p><h2>La transparencia acompaña también a las donaciones.</h2><p>Centralizamos en un único espacio la documentación pública disponible, las campañas y la explicación general de las necesidades que sostienen las ayudas.</p></div><a class="button button-outline" href="transparencia.html">Consultar Transparencia</a></div></section>',
  'en-busca-del-paraiso.html': '<section class="transparency-context section-space"><div class="shell"><div><p class="eyebrow">Seguimiento de la campaña</p><h2>Un punto común para la información pública.</h2><p>El Centro de Transparencia está preparado para reunir futuras actualizaciones y documentos públicos verificables relacionados con las campañas del Santuario.</p></div><a class="button button-outline" href="transparencia.html">Ir a Transparencia</a></div></section>',
};

for (const [file, block] of Object.entries(blocks)) {
  let html = read(file);
  if (html.includes('transparency-context')) continue;
  const index = html.lastIndexOf('</main>');
  if (index < 0) throw new Error(`No se encontró </main> en ${file}`);
  html = html.slice(0, index) + block + html.slice(index);
  write(file, html);
}
console.log('Enlaces contextuales de Transparencia actualizados.');
