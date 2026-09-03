import fs from 'node:fs';
import path from 'node:path';
import { targetRoot, publicRootPages } from './target-root.mjs';

const root = targetRoot();
const production = process.env.WINSTON_PRODUCTION === '1';
const residentsPath = path.join(root, 'assets/data/habitantes.json');
const residents = fs.existsSync(residentsPath) ? JSON.parse(fs.readFileSync(residentsPath,'utf8')) : [];
const pages = [...publicRootPages(root), ...residents.map(r => `animales/${r.slug}/index.html`)];
const cleanText = value => String(value || '').replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
const esc = value => String(value || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function get(html, re) { return html.match(re)?.[1]?.trim() || ''; }
function upsertMeta(html, matcher, tag) {
  if (matcher.test(html)) return html.replace(matcher, tag);
  return html.replace('</head>', `${tag}</head>`);
}

let changed = 0;
for (const rel of pages) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file,'utf8');
  let html = before;
  const title = cleanText(get(html, /<title>([\s\S]*?)<\/title>/i));
  const description = get(html, /<meta name="description" content="([^"]+)"\/>/i);
  const canonical = get(html, /<link rel="canonical" href="([^"]+)"\/>/i);
  const h1 = cleanText(get(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)) || title || 'Santuario Winston';
  let image = get(html, /<meta property="og:image" content="([^"]+)"\/>/i);
  if (!image) image = 'https://santuariowinston.org/assets/media/optimized/logos/logo-wisnton-sinfondo.webp';
  html = upsertMeta(html, /<meta property="og:type"[^>]*\/>/i, `<meta property="og:type" content="${rel.startsWith('animales/') ? 'article' : 'website'}"/>`);
  html = upsertMeta(html, /<meta property="og:title"[^>]*\/>/i, `<meta property="og:title" content="${esc(title)}"/>`);
  html = upsertMeta(html, /<meta property="og:description"[^>]*\/>/i, `<meta property="og:description" content="${esc(description)}"/>`);
  html = upsertMeta(html, /<meta property="og:url"[^>]*\/>/i, `<meta property="og:url" content="${esc(canonical)}"/>`);
  html = upsertMeta(html, /<meta property="og:image"[^>]*\/>/i, `<meta property="og:image" content="${esc(image)}"/>`);
  html = upsertMeta(html, /<meta property="og:image:alt"[^>]*\/>/i, `<meta property="og:image:alt" content="${esc(h1)}"/>`);
  html = upsertMeta(html, /<meta name="twitter:card"[^>]*\/>/i, '<meta name="twitter:card" content="summary_large_image"/>');
  html = upsertMeta(html, /<meta name="twitter:title"[^>]*\/>/i, `<meta name="twitter:title" content="${esc(title)}"/>`);
  html = upsertMeta(html, /<meta name="twitter:description"[^>]*\/>/i, `<meta name="twitter:description" content="${esc(description)}"/>`);
  html = upsertMeta(html, /<meta name="twitter:image"[^>]*\/>/i, `<meta name="twitter:image" content="${esc(image)}"/>`);
  if (production) html = html.replace(/<meta name="robots" content="noindex,nofollow"\/>/i, '<meta name="robots" content="index,follow"/>');
  if (html !== before) { fs.writeFileSync(file, html, 'utf8'); changed++; }
}
console.log(`SEO técnico aplicado en ${changed} páginas (${production ? 'producción' : 'staging'}).`);
