import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = rel => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

test('public bootstrap loads Winston interactive widget once', () => {
  const bootstrap = read('assets/js/winston.js');
  assert.match(bootstrap, /winston-chat\.js/);
  assert.match(bootstrap, /data-winston-chat-loaded/);
});

test('widget exposes accessible launcher and panel contract', () => {
  const js = read('assets/js/winston-chat.js');
  assert.match(js, /data-winston-chat-root/);
  assert.match(js, /aria-expanded/);
  assert.match(js, /aria-controls/);
  assert.match(js, /aria-live="polite"/);
  assert.match(js, /Conoce a mis amigos/);
  assert.match(js, /Quiero apadrinar/);
  assert.match(js, /Aprende conmigo/);
  assert.match(js, /Cómo ayudar/);
});

test('widget declares all Winston visual states', () => {
  const js = read('assets/js/winston-chat.js');
  for (const state of ['idle','hello','thinking','answer','error']) {
    assert.ok(js.includes(`'${state}'`) || js.includes(`"${state}"`), state);
  }
});

test('chat CSS supports mobile and reduced motion', () => {
  const css = read('assets/css/winston-enhancements.css');
  assert.match(css, /\.winston-chat-launcher/);
  assert.match(css, /\.winston-chat-panel/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('chat client calls Supabase securely and keeps only short session history', () => {
  const js = read('assets/js/winston-chat.js');
  assert.match(js, /functions\/v1\/winston-chat/);
  assert.match(js, /sessionStorage/);
  assert.match(js, /MAX_HISTORY\s*=\s*6/);
  assert.match(js, /MAX_MESSAGE\s*=\s*500/);
  assert.ok(!/localStorage/.test(js));
  assert.ok(!/service_role|OPENAI_API_KEY/i.test(js));
  assert.ok(!/SUPABASE_KEY|Authorization|['\"]apikey['\"]\s*:/i.test(js), 'public chat must not send unnecessary Supabase credentials');
  assert.match(js, /AbortController|AbortSignal/);
  assert.match(js, /\.textContent\s*=/);
});
