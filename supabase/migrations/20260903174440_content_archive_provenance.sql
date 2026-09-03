-- Santuario Winston · procedencia del archivo histórico
-- Permite recuperar contenido antiguo sin perder autoría, fecha ni URL de origen.

alter table public.content_articles
  add column if not exists source_url text,
  add column if not exists original_published_at timestamptz,
  add column if not exists original_author_name text,
  add column if not exists review_note text;

alter table public.content_articles
  add constraint content_articles_source_url_http_check
  check (source_url is null or source_url ~ '^https?://');
