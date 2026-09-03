import fs from 'node:fs';
import path from 'node:path';
import { targetRoot } from './target-root.mjs';
import { header, footer } from './public-shell.mjs';
import { renderMarkdown } from './content-markdown.mjs';
import { contentKinds, contentKind, contentPathForArticle } from './content-pages.mjs';

const root = targetRoot();
const production = process.env.WINSTON_PRODUCTION === '1';
const site = 'https://santuariowinston.org';
const articlesFile = path.join(root, 'assets/data/articles.json');
const residentsFile = path.join(root, 'assets/data/habitantes.json');
const articles = fs.existsSync(articlesFile) ? JSON.parse(fs.readFileSync(articlesFile, 'utf8')) : [];
const residents = fs.existsSync(residentsFile) ? JSON.parse(fs.readFileSync(residentsFile, 'utf8')) : [];
const residentMap = new Map(residents.map((row) => [row.slug, row]));
const robots = production ? 'index,follow' : 'noindex,nofollow';

const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const absoluteImage = (value) => value ? (String(value).startsWith('http') ? String(value) : `${site}/${String(value).replace(/^\//,'')}`) : `${site}/assets/media/optimized/logos/logo-wisnton-sinfondo.webp`;
const dateLabel = (value) => {
  const d = new Date(value || '');
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(d);
};

function head({ title, description, canonical, image, jsonLd, prefix }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:alt" content="${esc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><link rel="icon" href="${prefix}assets/favicon.svg"><link rel="stylesheet" href="${prefix}assets/css/winston-base.css"><link rel="stylesheet" href="${prefix}assets/css/winston-enhancements.css"><link rel="stylesheet" href="${prefix}assets/css/content.css"><script defer src="${prefix}assets/js/winston.js"></script><script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g,'\\u003c')}</script></head>`;
}

function relatedResidents(article, prefix) {
  const rows = (article.related_resident_slugs || []).map((slug) => residentMap.get(slug)).filter(Boolean);
  if (!rows.length) return '';
  return `<aside class="content-related shell"><p class="eyebrow">Habitantes relacionados</p><div class="content-related-grid">${rows.map((row) => `<article><img src="${prefix}${esc(row.image)}" alt="${esc(row.name)}" loading="lazy"><div><h3>${esc(row.name)}</h3><p>${esc(row.excerpt || '')}</p><a class="button button-outline" href="${prefix}animales/${esc(row.slug)}/">Conoce a ${esc(row.name)}</a></div></article>`).join('')}</div></aside>`;
}

function articlePage(article) {
  const kind = contentKind(article);
  const prefix = '../../';
  const canonical = `${site}/${contentPathForArticle(article)}`;
  const title = article.seo_title || `${article.title} · Santuario Winston`;
  const description = article.seo_description || article.excerpt || kind.description;
  const image = absoluteImage(article.featured_image_path);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BlogPosting', headline: article.title, description, url: canonical, datePublished: article.published_at || undefined, dateModified: article.updated_at || article.published_at || undefined, author: { '@type': 'Organization', name: article.author_name || 'Santuario Winston' }, publisher: { '@type': 'Organization', name: 'Santuario Winston', url: `${site}/` }, image },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${site}/` },
        { '@type': 'ListItem', position: 2, name: kind.label, item: `${site}/${kind.base}/` },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
      ]}
    ]
  };
  const heroImage = article.featured_image_path ? `<img class="content-hero-image" src="${prefix}${esc(article.featured_image_path)}" alt="${esc(article.featured_image_alt || article.title)}">` : '';
  return `${head({ title, description, canonical, image, jsonLd, prefix })}<body class="antialiased"><a class="skip-link" href="#contenido">Saltar al contenido</a>${header(prefix, '')}<main id="contenido"><article class="content-article"><header class="content-article-head shell"><p class="eyebrow">${esc(kind.label)}${article.category ? ` · ${esc(article.category)}` : ''}</p><h1>${esc(article.title)}</h1><p class="content-lead">${esc(article.excerpt || '')}</p><div class="content-meta"><span>${esc(article.author_name || 'Santuario Winston')}</span>${article.published_at ? `<span>${esc(dateLabel(article.published_at))}</span>` : ''}</div>${heroImage}</header><div class="content-body shell">${renderMarkdown(article.body_markdown || '')}</div>${relatedResidents(article, prefix)}</article></main>${footer(prefix)}</body></html>`;
}

function indexPage(kindKey, rows) {
  const kind = contentKinds[kindKey];
  const prefix = '../';
  const canonical = `${site}/${kind.base}/`;
  const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: kind.title, description: kind.description, url: canonical, inLanguage: 'es' };
  const cards = rows.length ? rows.map((article) => `<article class="content-card">${article.featured_image_path ? `<img src="${prefix}${esc(article.featured_image_path)}" alt="${esc(article.featured_image_alt || article.title)}" loading="lazy">` : ''}<div><p class="eyebrow">${esc(article.category || kind.label)}</p><h2><a href="${esc(article.slug)}/">${esc(article.title)}</a></h2><p>${esc(article.excerpt || '')}</p><div class="content-meta">${article.published_at ? `<span>${esc(dateLabel(article.published_at))}</span>` : ''}</div><a class="content-readmore" href="${esc(article.slug)}/">Leer artículo <span aria-hidden="true">→</span></a></div></article>`).join('') : '<p class="empty-content">Estamos preparando nuevos contenidos. Vuelve pronto.</p>';
  return `${head({ title: `${kind.title} · Santuario Winston`, description: kind.description, canonical, image: absoluteImage(null), jsonLd, prefix })}<body class="antialiased"><a class="skip-link" href="#contenido">Saltar al contenido</a>${header(prefix, '')}<main id="contenido"><section class="content-index-hero"><div class="shell"><p class="eyebrow">${esc(kind.eyebrow)}</p><h1>${esc(kind.title)}</h1><p>${esc(kind.description)}</p></div></section><section class="content-index shell">${cards}</section></main>${footer(prefix)}</body></html>`;
}

for (const kind of Object.values(contentKinds)) fs.rmSync(path.join(root, kind.base), { recursive: true, force: true });
for (const [kindKey, kind] of Object.entries(contentKinds)) {
  const rows = articles.filter((article) => article.kind === kindKey).sort((a,b) => String(b.published_at || '').localeCompare(String(a.published_at || '')));
  const dir = path.join(root, kind.base); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), indexPage(kindKey, rows), 'utf8');
  for (const article of rows) {
    const articleDir = path.join(dir, article.slug); fs.mkdirSync(articleDir, { recursive: true });
    fs.writeFileSync(path.join(articleDir, 'index.html'), articlePage(article), 'utf8');
  }
}
console.log(`Contenido editorial generado: ${articles.length} artículos.`);
