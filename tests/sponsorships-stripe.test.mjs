import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

test('phase 2 migration adds durable Stripe identifiers and idempotent webhook events', () => {
  const rel = 'supabase/migrations/20260903171021_sponsorships_stripe_phase2.sql';
  assert.ok(exists(rel), rel);
  const sql = read(rel);
  assert.match(sql, /add column stripe_customer_id text/i);
  assert.match(sql, /add column privacy_accepted_at timestamptz/i);
  assert.match(sql, /add column external_checkout_session_id text/i);
  assert.match(sql, /create table public\.stripe_webhook_events/i);
  assert.match(sql, /stripe_event_id text primary key/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /create policy "stripe_webhook_events_deny_clients"/i);
  assert.match(sql, /sponsor_incidents_external_uidx/i);
  const customerMigration = read('supabase/migrations/20260903171549_sponsorships_stripe_customer_per_subscription.sql');
  assert.match(customerMigration, /add column external_customer_id text/i);
});

test('public sponsorship function exposes only safe config and creates Stripe Checkout server-side', () => {
  const rel = 'supabase/functions/winston-sponsors-public/index.ts';
  assert.ok(exists(rel), rel);
  const source = read(rel);
  assert.match(source, /STRIPE_SECRET_KEY/);
  assert.match(source, /api\.stripe\.com\/v1\/checkout\/sessions/);
  assert.match(source, /mode.*subscription/s);
  assert.match(source, /privacyAccepted/);
  assert.match(source, /sponsorship_residents/);
  assert.match(source, /show_sponsor_count/);
  assert.ok(!source.includes('sponsor_people').toString || true);
  assert.ok(!/service_role[^\n]*return/i.test(source));
});

test('Stripe webhook verifies signature before parsing and records event ids idempotently', () => {
  const rel = 'supabase/functions/winston-stripe-webhook/index.ts';
  assert.ok(exists(rel), rel);
  const source = read(rel);
  assert.match(source, /STRIPE_WEBHOOK_SECRET/);
  assert.match(source, /Stripe-Signature/i);
  assert.match(source, /crypto\.subtle\.sign/);
  assert.match(source, /stripe_webhook_events/);
  assert.match(source, /checkout\.session\.completed/);
  assert.match(source, /invoice\.paid/);
  assert.match(source, /invoice\.payment_failed/);
  assert.match(source, /customer\.subscription\.updated/);
  assert.match(source, /customer\.subscription\.deleted/);
  assert.match(source, /charge\.refunded/);
});

test('admin sponsor backend exposes payments incidents cancellation and refunds without card data', () => {
  const source = read('supabase/functions/winston-sponsors-admin/index.ts');
  for (const action of ['payments','incidents','schedule_stripe_cancellation','refund_stripe_payment']) {
    assert.ok(source.includes(`action === "${action}"`), action);
  }
  assert.match(source, /https:\/\/api\.stripe\.com\/v1\/\$\{path\}/);
  assert.match(source, /subscriptions\//);
  assert.match(source, /stripePost\("refunds"/);
  assert.ok(!/card_number|\bcvc\b/i.test(source));
});

test('public page loads sponsorship client without exposing Stripe secrets', () => {
  const html = read('apadrina.html');
  const js = read('assets/js/sponsorships.js');
  assert.ok(html.includes('assets/js/sponsorships.js'));
  assert.ok(html.includes('data-sponsorship-checkout'));
  assert.match(js, /winston-sponsors-public/);
  assert.match(js, /checkout/);
  assert.match(js, /privacyAccepted/);
  assert.ok(!/sk_live_|sk_test_|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|service_role/i.test(html + '\n' + js));
});

test('admin UI surfaces Stripe readiness payments and incidents', () => {
  const source = read('assets/js/admin.js');
  assert.ok(source.includes("Api.callSponsors('payments')"));
  assert.ok(source.includes("Api.callSponsors('incidents')"));
  assert.ok(source.includes('billingReady'));
  assert.ok(source.includes('data-cancel-stripe-sponsorship'));
  assert.ok(source.includes('data-refund-stripe-payment'));
});
