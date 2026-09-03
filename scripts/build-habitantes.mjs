import fs from 'node:fs';
import path from 'node:path';
import { header, footer } from './public-shell.mjs';

const root = path.resolve(import.meta.dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/habitantes.json'), 'utf8'));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const metaDescription = value => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length <= 155 ? clean : `${clean.slice(0, 152).replace(/\s+\S*$/, '')}…`;
};
const recommendations = (index) => {
  const picks = [];
  for (const offset of [1, 7, 17, 29]) {
    const candidate = rows[(index + offset) % rows.length];
    if (candidate.slug !== rows[index].slug && !picks.some(x => x.slug === candidate.slug)) picks.push(candidate);
    if (picks.length === 3) break;
  }
  return picks;
};

function page(record, index) {
  const desc = metaDescription(record.excerpt);
  const canonical = `https://santuariowinston.org/animales/${record.slug}/`;
  const ogImage = `https://santuariowinston.org/${record.image}`;
  const storyHtml = record.story.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');
  const recHtml = recommendations(index).map(other => `<a class="resident-related-card" href="../${other.slug}/"><img src="../../${other.image}" alt="${escapeHtml(other.name)}" loading="lazy"/><span>${escapeHtml(other.name)}</span></a>`).join('');
  const jsonLd = JSON.stringify({
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'Article',
        '@id':`${canonical}#article`,
        headline:`${record.name} · Santuario Winston`,
        description:desc,
        image:[ogImage],
        mainEntityOfPage:{'@id':`${canonical}#webpage`},
        publisher:{'@type':'Organization','@id':'https://santuariowinston.org/#organization',name:'Santuario Winston',url:'https://santuariowinston.org/'}
      },
      {
        '@type':'BreadcrumbList',
        '@id':`${canonical}#breadcrumb`,
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Inicio',item:'https://santuariowinston.org/'},
          {'@type':'ListItem',position:2,name:'Habitantes',item:'https://santuariowinston.org/habitantes.html'},
          {'@type':'ListItem',position:3,name:record.name,item:canonical}
        ]
      }
    ]
  }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(record.name)} · Habitantes · Santuario Winston</title><meta name="description" content="${escapeHtml(desc)}"/><meta name="robots" content="noindex,nofollow"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:title" content="${escapeHtml(record.name)} · Santuario Winston"/><meta property="og:description" content="${escapeHtml(desc)}"/><meta property="og:url" content="${canonical}"/><meta property="og:image" content="${ogImage}"/><meta property="og:image:alt" content="${escapeHtml(record.name)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escapeHtml(record.name)} · Santuario Winston"/><meta name="twitter:description" content="${escapeHtml(desc)}"/><meta name="twitter:image" content="${ogImage}"/><link rel="icon" href="../../assets/favicon.svg"/><link rel="stylesheet" href="../../assets/css/winston-base.css"/><link rel="stylesheet" href="../../assets/css/winston-enhancements.css"/><script type="application/ld+json">${jsonLd}</script><script defer src="../../assets/js/winston.js"></script></head><body class="antialiased"><a class="skip-link" href="#contenido">Saltar al contenido</a>${header('../../','descubre')}<main id="contenido" class="resident-profile"><section class="resident-profile-hero"><div class="shell resident-profile-grid"><div class="resident-profile-photo"><img src="../../${record.image}" alt="${escapeHtml(record.name)}"/></div><div class="resident-profile-intro"><p class="eyebrow">Historias de la manada</p><p class="resident-profile-breadcrumb"><a href="../../habitantes.html">Habitantes</a> <span aria-hidden="true">/</span> ${escapeHtml(record.name)}</p><h1>${escapeHtml(record.name)}</h1><p class="resident-date">${escapeHtml(record.dateLabel)}</p><p class="resident-profile-excerpt">${escapeHtml(record.excerpt)}</p><div class="button-row"><a class="button button-primary" href="../../apadrina.html?habitante=${encodeURIComponent(record.slug)}">Apadrina a ${escapeHtml(record.name)}</a><a class="button button-outline" href="../../habitantes.html">Volver a Habitantes</a></div></div></div></section><section class="section-space resident-profile-story"><div class="shell resident-profile-story-grid"><div><p class="eyebrow">Su historia</p><h2>Una vida con nombre propio.</h2></div><div class="resident-story-copy">${storyHtml}</div></div></section><section class="section-space resident-related"><div class="shell"><div class="section-heading"><div><p class="eyebrow">Sigue conociendo</p><h2>Otros habitantes del Santuario</h2></div><a class="text-link" href="../../habitantes.html">Ver las 70 historias →</a></div><div class="resident-related-grid">${recHtml}</div></div></section></main>${footer('../../')}</body></html>`;
}

const outRoot = path.join(root, 'animales');
fs.rmSync(outRoot, { recursive: true, force: true });
for (const [index, record] of rows.entries()) {
  const dir = path.join(outRoot, record.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(record, index), 'utf8');
}
console.log(`Generadas ${rows.length} fichas de habitantes.`);
