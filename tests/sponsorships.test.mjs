import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

test('sponsorship phase 1 database migration exists with isolated tables and RLS', () => {
  const rel = 'supabase/migrations/20260903165802_sponsorships_phase1.sql';
  assert.ok(exists(rel), rel);
  const sql = read(rel);
  for (const table of ['sponsor_people','sponsorship_residents','sponsorships','sponsor_payments','sponsor_incidents','sponsor_audit_log']) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`, 'i'), table);
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `${table} RLS`);
  }
  assert.match(sql, /importe_cent integer not null check \(importe_cent >= 1000\)/i);
  assert.match(sql, /lower\(email\)/i);
  assert.ok(!/grant\s+all\s+on/i.test(sql));
  const hardening = read('supabase/migrations/20260903170344_sponsorships_security_performance_hardening.sql');
  for (const table of ['sponsor_people','sponsorship_residents','sponsorships','sponsor_payments','sponsor_incidents','sponsor_audit_log']) {
    assert.match(hardening, new RegExp(`create policy \"${table}[^\"]*deny_clients\"`, 'i'), `${table} explicit deny`);
  }
  for (const index of ['sponsor_payments_sponsorship_idx','sponsor_incidents_sponsorship_idx','sponsor_audit_log_actor_idx']) assert.ok(hardening.includes(index), index);
});

test('sponsor admin edge function is isolated and role protected', () => {
  const rel = 'supabase/functions/winston-sponsors-admin/index.ts';
  assert.ok(exists(rel), rel);
  const source = read(rel);
  assert.match(source, /allowedRoles\s*=\s*new Set\(\["technical",\s*"admin"\]\)/);
  assert.match(source, /admin\.auth\.getUser\(token\)/);
  for (const action of ['dashboard','sponsors','sponsorships','resident_settings','save_resident_setting','create_manual_sponsorship','cancel_manual_sponsorship']) {
    assert.ok(source.includes(`action === "${action}"`), action);
  }
  assert.ok(!source.includes('winston_sync_records'), 'must not mix sponsorship data into app sync records');
});

test('administration exposes sponsorship section without removing existing sections', () => {
  const html = read('administracion.html');
  for (const section of ['dashboard','animals','tasks','activity','documents','recognitions','contacts','users','system']) {
    assert.ok(html.includes(`data-section="${section}"`), section);
  }
  assert.ok(html.includes('data-section="sponsors"'));
  assert.match(html, />Padrinos</);
});

test('admin API uses a separate sponsor endpoint', () => {
  const source = read('assets/js/admin-api.js');
  assert.match(source, /SPONSORS_ENDPOINT/);
  assert.match(source, /async function callSponsors\(/);
  assert.match(source, /winston-sponsors-admin/);
});

test('admin UI implements sponsor dashboard, manual creation and resident settings', () => {
  const source = read('assets/js/admin.js');
  for (const marker of ['renderSponsors','create_manual_sponsorship','save_resident_setting','cancel_manual_sponsorship']) {
    assert.ok(source.includes(marker), marker);
  }
  assert.ok(source.includes("section === 'sponsors'"));
});

test('public sponsorship page is prepared for real flow without fake checkout', () => {
  const html = read('apadrina.html');
  assert.ok(html.includes('data-sponsorship-hub'));
  assert.ok(html.includes('data-sponsorship-status'));
  assert.match(html, /apadrinamiento mensual/i);
  assert.ok(!/sk_live_|STRIPE_SECRET_KEY|service_role/i.test(html));
});

test('padrinos is a prominent public area for client review', () => {
  const shell = read('scripts/public-shell.mjs');
  assert.ok(shell.includes("activeClass(active,'padrinos')"), 'desktop top-level Padrinos nav');
  assert.match(shell, /drawer-group[^\n]*apadrina\.html[^\n]*>Padrinos</, 'mobile top-level Padrinos nav');

  const home = read('index.html');
  assert.ok(home.includes('data-home-padrinos'), 'home sponsorship feature block');
  assert.match(home, /Conviértete en padrino/i);
  assert.match(home, /Conocer a quién puedo apadrinar/i);

  const builder = read('scripts/build-habitantes.mjs');
  assert.ok(builder.includes('Apadrina a ${escapeHtml(record.name)}'), 'resident CTA names the animal');
});
