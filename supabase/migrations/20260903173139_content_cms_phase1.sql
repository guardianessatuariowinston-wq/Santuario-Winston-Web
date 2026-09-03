-- Santuario Winston · CMS de contenidos fase 1
-- Blog, Aprende con Winston y archivo histórico. Subsistema aislado de la app operativa.

create table public.content_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind text not null check (kind in ('blog','aprende','historias')),
  title text not null check (length(trim(title)) between 1 and 180),
  excerpt text not null default '' check (length(excerpt) <= 500),
  body_markdown text not null default '',
  category text,
  author_name text not null default 'Santuario Winston' check (length(trim(author_name)) between 1 and 160),
  status text not null default 'draft' check (status in ('draft','published','scheduled','hidden')),
  published_at timestamptz,
  scheduled_at timestamptz,
  featured_image_path text,
  featured_image_alt text,
  seo_title text check (seo_title is null or length(seo_title) <= 180),
  seo_description text check (seo_description is null or length(seo_description) <= 320),
  related_resident_slugs text[] not null default array[]::text[],
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_articles_public_idx
  on public.content_articles (kind, published_at desc)
  where status = 'published';
create index content_articles_updated_idx
  on public.content_articles (updated_at desc);

create table public.content_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (left(from_path, 1) = '/'),
  to_path text not null check (left(to_path, 1) = '/'),
  status_code integer not null default 301 check (status_code in (301,308)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.content_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  article_id uuid references public.content_articles(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index content_audit_log_article_idx on public.content_audit_log (article_id, created_at desc);
create index content_audit_log_actor_idx on public.content_audit_log (actor_user_id, created_at desc);

alter table public.content_articles enable row level security;
alter table public.content_redirects enable row level security;
alter table public.content_audit_log enable row level security;

revoke all on public.content_articles from anon, authenticated;
revoke all on public.content_redirects from anon, authenticated;
revoke all on public.content_audit_log from anon, authenticated;

grant select on public.content_articles to anon, authenticated;
grant select, insert, update, delete on public.content_articles to service_role;
grant select, insert, update, delete on public.content_redirects to service_role;
grant select, insert on public.content_audit_log to service_role;
grant usage, select on sequence public.content_audit_log_id_seq to service_role;

create policy "content_articles_public_read"
on public.content_articles
for select
to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

create policy "content_redirects_deny_clients"
on public.content_redirects
for all
to anon, authenticated
using (false)
with check (false);

create policy "content_audit_log_deny_clients"
on public.content_audit_log
for all
to anon, authenticated
using (false)
with check (false);
