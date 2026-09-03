import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'habitantes.html');
const outputPath = path.join(root, 'assets/data/habitantes.json');
const html = fs.readFileSync(sourcePath, 'utf8');

const decode = (value = '') => value
  .replace(/<!--\s*-->/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

const text = (markup = '') => decode(markup
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' '))
  .replace(/\s+/g, ' ')
  .trim();

const first = (markup, re) => {
  const m = markup.match(re);
  return m ? m[1] : '';
};

const slugBase = (value) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase();

const articles = [...html.matchAll(/<article class="resident-card"[^>]*>([\s\S]*?)<\/article>/g)].map(m => m[1]);
if (articles.length !== 70) throw new Error(`Esperadas 70 fichas; encontradas ${articles.length}`);

const seen = new Map();
const records = articles.map((card, index) => {
  const name = text(first(card, /<h2[^>]*>([\s\S]*?)<\/h2>/));
  const dateLabel = text(first(card, /<p class="resident-date"[^>]*>([\s\S]*?)<\/p>/));
  const image = decode(first(card, /<div class="resident-photo"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/));
  const excerpt = text(first(card, /<p class="resident-excerpt"[^>]*>([\s\S]*?)<\/p>/));
  const details = first(card, /<details class="resident-story"[^>]*>([\s\S]*?)<\/details>/);
  const story = [...details.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => text(m[1])).filter(Boolean);
  if (!name || !image || !excerpt || story.length === 0) throw new Error(`Ficha incompleta en posición ${index + 1}: ${name || '(sin nombre)'}`);
  const base = slugBase(name) || `habitante-${index + 1}`;
  const count = (seen.get(base) || 0) + 1;
  seen.set(base, count);
  const slug = count === 1 ? base : `${base}-${count}`;
  return {
    slug,
    name,
    dateLabel,
    image,
    excerpt,
    story,
    species: null,
    sponsorable: null,
    source: 'habitantes.html',
    order: index + 1,
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`Extraídas ${records.length} historias (${new Set(records.map(x => x.slug)).size} slugs únicos).`);
