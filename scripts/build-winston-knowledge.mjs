import fs from 'node:fs';
import path from 'node:path';
import { targetRoot } from './target-root.mjs';

const root = targetRoot();
const dataDir = path.join(root, 'assets/data');
const residentsFile = path.join(dataDir, 'habitantes.json');
const articlesFile = path.join(dataDir, 'articles.json');
const outputFile = path.join(dataDir, 'winston-chat-knowledge.json');

const PUBLIC_PAGES = [
  ['index.html','Inicio','/'],
  ['sobre-nosotros.html','Nuestra historia','/sobre-nosotros.html'],
  ['guardianes.html','Los Guardianes','/guardianes.html'],
  ['apadrina.html','Padrinos','/apadrina.html'],
  ['como-ayudar.html','Cómo ayudar','/como-ayudar.html'],
  ['voluntariado.html','Voluntariado','/voluntariado.html'],
  ['teaming.html','Teaming','/teaming.html'],
  ['donar.html','Donativos','/donar.html'],
  ['actividades.html','Actividades','/actividades.html'],
  ['contacto.html','Contacto','/contacto.html'],
  ['transparencia.html','Transparencia','/transparencia.html'],
];

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function mainContent(html) {
  const match = String(html || '').match(/<main\b[^>]*\bid=["']contenido["'][^>]*>([\s\S]*?)<\/main>/i);
  return stripHtml(match ? match[1] : '');
}

function residentSource(row) {
  return {
    id: `resident:${row.slug}`,
    type: 'resident',
    title: String(row.name || row.slug || ''),
    url: `/animales/${row.slug}/`,
    text: [row.dateLabel, row.excerpt, ...(Array.isArray(row.story) ? row.story : [])].filter(Boolean).join(' '),
    keywords: [row.name, row.slug, row.species].filter(Boolean).map(String),
  };
}

function pageSource([file, title, url]) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  const text = mainContent(fs.readFileSync(full, 'utf8'));
  if (!text) return null;
  return {
    id: `page:${url === '/' ? 'inicio' : file.replace(/\.html$/i, '')}`,
    type: 'page',
    title,
    url,
    text,
    keywords: [title, file.replace(/\.html$/i, '').replaceAll('-', ' ')],
  };
}

const CONTENT_BASE = { blog: 'blog', aprende: 'aprende', historias: 'historias' };
function articleSource(row) {
  const key = String(row.id || `${row.kind}:${row.slug}`);
  const base = CONTENT_BASE[row.kind] || 'blog';
  return {
    id: `article:${key}`,
    articleId: key,
    type: 'article',
    title: String(row.title || row.slug || ''),
    url: `/${base}/${row.slug}/`,
    text: [row.excerpt, row.body_markdown, row.category, row.author_name].filter(Boolean).join(' '),
    keywords: [row.title, row.slug, row.kind, row.category, ...(Array.isArray(row.related_resident_slugs) ? row.related_resident_slugs : [])].filter(Boolean).map(String),
  };
}

const residents = fs.existsSync(residentsFile) ? JSON.parse(fs.readFileSync(residentsFile, 'utf8')) : [];
const articles = fs.existsSync(articlesFile) ? JSON.parse(fs.readFileSync(articlesFile, 'utf8')) : [];
const sources = [
  ...residents.filter(row => row?.slug && row?.name).map(residentSource),
  ...PUBLIC_PAGES.map(pageSource).filter(Boolean),
  ...articles
    .filter(row => row?.slug && row?.title && (!Object.hasOwn(row, 'status') || row.status === 'published'))
    .map(articleSource),
];

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), sources }, null, 2)}\n`, 'utf8');
console.log(`Conocimiento Winston generado: ${sources.length} fuentes públicas.`);
