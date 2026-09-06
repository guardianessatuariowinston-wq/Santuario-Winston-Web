import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = rel => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

test('Winston knowledge contains only controlled public sources', () => {
  const knowledge = JSON.parse(read('assets/data/winston-chat-knowledge.json'));
  assert.equal(knowledge.version, 1);
  assert.ok(knowledge.sources.length >= 75, `sources=${knowledge.sources.length}`);
  assert.ok(knowledge.sources.some(x => x.id === 'resident:zeus'));
  assert.ok(knowledge.sources.some(x => x.type === 'page' && x.url === '/apadrina.html'));
  const serialized = JSON.stringify(knowledge);
  assert.ok(!serialized.includes('review_note'));
  assert.ok(!serialized.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(!serialized.includes('OPENAI_API_KEY'));
  assert.ok(!knowledge.sources.some(x => /administracion/i.test(x.url)));
});

test('article knowledge can only come from the public published snapshot', () => {
  const articles = JSON.parse(read('assets/data/articles.json'));
  const knowledge = JSON.parse(read('assets/data/winston-chat-knowledge.json'));
  const articleSources = knowledge.sources.filter(x => x.type === 'article');
  const publicKeys = new Set(articles.map(x => String(x.id || `${x.kind}:${x.slug}`)));
  assert.ok(articleSources.every(x => publicKeys.has(String(x.articleId))));
  assert.ok(!articleSources.some(x => /review_note|internal|draft/i.test(JSON.stringify(x))));
});
