import fs from 'node:fs';
import path from 'node:path';
import { targetRoot } from './target-root.mjs';

const root = targetRoot();
const dataDir = path.join(root, 'assets/data');
const articlesFile = path.join(dataDir, 'articles.json');
const redirectsFile = path.join(dataDir, 'content-redirects.json');
const endpoint = process.env.WINSTON_CONTENT_EXPORT_URL || 'https://fooymzhvkmpejiafuyvq.supabase.co/functions/v1/winston-content-public';
const requireRemote = process.env.WINSTON_REQUIRE_REMOTE_CONTENT === '1';
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(articlesFile)) fs.writeFileSync(articlesFile, '[]\n', 'utf8');
if (!fs.existsSync(redirectsFile)) fs.writeFileSync(redirectsFile, '[]\n', 'utf8');

try {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: controller.signal });
  clearTimeout(timeout);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload?.articles) || !Array.isArray(payload?.redirects)) throw new Error('Formato de contenido no válido');
  fs.writeFileSync(articlesFile, `${JSON.stringify(payload.articles, null, 2)}\n`, 'utf8');
  fs.writeFileSync(redirectsFile, `${JSON.stringify(payload.redirects, null, 2)}\n`, 'utf8');
  console.log(`Contenido público sincronizado: ${payload.articles.length} artículos, ${payload.redirects.length} redirecciones.`);
} catch (error) {
  if (requireRemote) throw error;
  const local = JSON.parse(fs.readFileSync(articlesFile, 'utf8'));
  console.warn(`Contenido remoto no disponible; se conserva snapshot local (${Array.isArray(local) ? local.length : 0} artículos).`);
}
