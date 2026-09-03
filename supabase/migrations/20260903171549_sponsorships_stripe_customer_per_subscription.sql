-- Santuario Winston · Padrinos · cliente Stripe por apadrinamiento.
-- Una misma persona puede apadrinar varios habitantes y Checkout puede crear clientes Stripe distintos.

alter table public.sponsorships
  add column external_customer_id text;

create index sponsorships_external_customer_idx
  on public.sponsorships (external_customer_id)
  where external_customer_id is not null;

comment on column public.sponsorships.external_customer_id is 'Cliente Stripe asociado a esta suscripción concreta; permite múltiples apadrinamientos por persona sin perder trazabilidad.';
