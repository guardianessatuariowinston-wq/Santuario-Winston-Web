-- Santuario Winston · Padrinos fase 2 · Stripe
-- Añade identificadores duraderos de Stripe, consentimiento y deduplicación de webhooks.

alter table public.sponsor_people
  add column stripe_customer_id text,
  add column privacy_accepted_at timestamptz,
  add column privacy_version text;

create unique index sponsor_people_stripe_customer_uidx
  on public.sponsor_people (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.sponsorships
  add column external_checkout_session_id text,
  add column cancel_at_period_end boolean not null default false;

create unique index sponsorships_checkout_session_uidx
  on public.sponsorships (external_checkout_session_id)
  where external_checkout_session_id is not null;

create unique index sponsor_incidents_external_uidx
  on public.sponsor_incidents (incident_type, external_reference)
  where external_reference is not null;

create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  stripe_created_at timestamptz,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;
grant select, insert, update on public.stripe_webhook_events to service_role;

create policy "stripe_webhook_events_deny_clients"
on public.stripe_webhook_events
for all
to anon, authenticated
using (false)
with check (false);

comment on table public.stripe_webhook_events is 'Santuario Winston: deduplicación y trazabilidad técnica de webhooks Stripe; acceso solo por funciones protegidas.';
comment on column public.sponsor_people.stripe_customer_id is 'Identificador de cliente Stripe; nunca contiene datos de tarjeta.';
comment on column public.sponsor_people.privacy_accepted_at is 'Momento en el que se aceptó la información de privacidad durante el alta online.';
