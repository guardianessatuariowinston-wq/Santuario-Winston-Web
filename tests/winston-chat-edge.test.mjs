import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = rel => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

test('Winston chat migration is isolated with RLS and no public policies', () => {
  const sql = read('supabase/migrations/20260906_winston_chat_rate_limits.sql');
  assert.match(sql, /create table[\s\S]*winston_chat_rate_limits/i);
  assert.match(sql, /enable row level security/i);
  assert.ok(!/create policy[\s\S]*to\s+(anon|authenticated)/i.test(sql));
  assert.match(sql, /revoke all[\s\S]*anon, authenticated/i);
  assert.match(sql, /primary key\s*\(client_hash\)/i, 'rate limit table should retain one rolling row per anonymous client');
  assert.doesNotMatch(sql, /primary key\s*\(client_hash\s*,\s*window_start\)/i);
});

test('Winston chat edge function validates origin payload and anonymous rate limit', () => {
  const edge = read('supabase/functions/winston-chat/index.ts');
  assert.match(edge, /WINSTON_CHAT_RATE_SALT/);
  assert.match(edge, /crypto\.subtle\.digest/);
  assert.match(edge, /429/);
  assert.match(edge, /MAX_MESSAGE\s*=\s*500/);
  assert.match(edge, /MAX_HISTORY\s*=\s*6/);
  assert.match(edge, /history/);
  assert.match(edge, /allowedOrigins/);
  assert.match(edge, /x-forwarded-for/i);
  assert.match(edge, /onConflict:\s*"client_hash"/, 'rate counter should update one row per anonymous client');
  assert.match(edge, /Date\.parse\(data\?\.window_start/, 'rate window comparison must be timestamp-format independent');
});

test('Winston chat grounds replies and applies domain/veterinary guardrails', () => {
  const edge = read('supabase/functions/winston-chat/index.ts');
  assert.match(edge, /WINSTON_CHAT_KNOWLEDGE_URL/);
  assert.match(edge, /retrieveSources/);
  assert.match(edge, /out-of-scope/);
  assert.match(edge, /vet-risk/);
  assert.match(edge, /no diagnost/i);
  assert.ok(!/eval\(|new Function\(/.test(edge));
});

test('Winston chat uses OpenAI Responses with separate input/output moderation and no client secrets', () => {
  const edge = read('supabase/functions/winston-chat/index.ts');
  assert.match(edge, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(edge, /https:\/\/api\.openai\.com\/v1\/moderations/);
  assert.match(edge, /OPENAI_API_KEY/);
  assert.match(edge, /OPENAI_MODEL/);
  assert.match(edge, /gpt-5\.6-luna/);
  assert.match(edge, /store\s*:\s*false/);
  assert.match(edge, /omni-moderation-latest/);
  assert.match(edge, /max_output_tokens\s*:\s*350/);
  assert.ok(!read('assets/js/winston-chat.js').includes('OPENAI_API_KEY'));
});
