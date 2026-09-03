import path from 'node:path';

export const repoRoot = path.resolve(import.meta.dirname, '..');
export function targetRoot() {
  const configured = process.env.WINSTON_BUILD_ROOT;
  if (!configured) return repoRoot;
  return path.isAbsolute(configured) ? configured : path.resolve(repoRoot, configured);
}
export function publicRootPages(root) {
  return [
    'index.html','habitantes.html','guardianes.html','tienda.html','como-ayudar.html','hazte-socio.html','apadrina.html',
    'teaming.html','donar.html','adopciones-solidarias.html','en-busca-del-paraiso.html','voluntariado.html','testimonios.html',
    'voluntariado-habitual.html','larga-estancia.html','actividades.html','sobre-nosotros.html','transparencia.html','contacto.html',
    'politica-de-privacidad.html'
  ].filter(name => root ? true : true);
}
