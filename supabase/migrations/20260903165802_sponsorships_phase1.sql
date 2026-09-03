-- Santuario Winston · Padrinos fase 1
-- Subsistema aislado de los registros operativos de la app.

create table public.sponsor_people (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  surnames text,
  email text not null check (position('@' in email) > 1),
  phone text,
  country text,
  status text not null default 'active' check (status in ('active','inactive','blocked')),
  marketing_opt_in boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index sponsor_people_email_lower_uidx
  on public.sponsor_people (lower(email));

create table public.sponsorship_residents (
  resident_slug text primary key check (resident_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  enabled boolean not null default false,
  minimum_amount_cent integer not null default 1000 check (minimum_amount_cent >= 1000),
  suggested_amounts_cent integer[] not null default array[1000,1500,2500],
  allow_custom_amount boolean not null default true,
  show_sponsor_count boolean not null default false,
  public_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(suggested_amounts_cent) between 1 and 6),
  check (0 < all(suggested_amounts_cent))
);

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  sponsor_person_id uuid not null references public.sponsor_people(id) on delete restrict,
  resident_slug text not null references public.sponsorship_residents(resident_slug) on update cascade on delete restrict,
  resident_name_snapshot text not null,
  importe_cent integer not null check (importe_cent >= 1000),
  currency text not null default 'eur' check (currency = 'eur'),
  cadence text not null default 'monthly' check (cadence = 'monthly'),
  origin text not null check (origin in ('manual','stripe')),
  status text not null default 'pending' check (status in ('pending','active','payment_issue','cancel_scheduled','cancelled')),
  certificate_name text,
  is_gift boolean not null default false,
  started_at timestamptz,
  cancellation_requested_at timestamptz,
  cancellation_effective_at timestamptz,
  cancellation_reason text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sponsorships_person_idx on public.sponsorships (sponsor_person_id, created_at desc);
create index sponsorships_resident_idx on public.sponsorships (resident_slug, status);
create unique index sponsorships_external_subscription_uidx
  on public.sponsorships (external_subscription_id)
  where external_subscription_id is not null;

create table public.sponsor_payments (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references public.sponsorships(id) on delete restrict,
  amount_cent integer not null check (amount_cent > 0),
  currency text not null default 'eur' check (currency = 'eur'),
  status text not null check (status in ('pending','paid','failed','refunded')),
  provider text not null check (provider in ('manual','stripe')),
  external_payment_id text,
  external_invoice_id text,
  refunded_cent integer not null default 0 check (refunded_cent >= 0 and refunded_cent <= amount_cent),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index sponsor_payments_external_payment_uidx
  on public.sponsor_payments (external_payment_id)
  where external_payment_id is not null;
create unique index sponsor_payments_external_invoice_uidx
  on public.sponsor_payments (external_invoice_id)
  where external_invoice_id is not null;

create table public.sponsor_incidents (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references public.sponsorships(id) on delete restrict,
  incident_type text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  detail text,
  external_reference text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index sponsor_incidents_open_idx
  on public.sponsor_incidents (status, opened_at desc);

create table public.sponsor_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.sponsor_people enable row level security;
alter table public.sponsorship_residents enable row level security;
alter table public.sponsorships enable row level security;
alter table public.sponsor_payments enable row level security;
alter table public.sponsor_incidents enable row level security;
alter table public.sponsor_audit_log enable row level security;

revoke all on public.sponsor_people from anon, authenticated;
revoke all on public.sponsorship_residents from anon, authenticated;
revoke all on public.sponsorships from anon, authenticated;
revoke all on public.sponsor_payments from anon, authenticated;
revoke all on public.sponsor_incidents from anon, authenticated;
revoke all on public.sponsor_audit_log from anon, authenticated;

-- Service role is used only inside protected Edge Functions.
grant select, insert, update, delete on public.sponsor_people to service_role;
grant select, insert, update, delete on public.sponsorship_residents to service_role;
grant select, insert, update, delete on public.sponsorships to service_role;
grant select, insert, update, delete on public.sponsor_payments to service_role;
grant select, insert, update, delete on public.sponsor_incidents to service_role;
grant select, insert on public.sponsor_audit_log to service_role;
grant usage, select on sequence public.sponsor_audit_log_id_seq to service_role;
