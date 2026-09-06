create table if not exists public.winston_chat_rate_limits (
  client_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (client_hash)
);

alter table public.winston_chat_rate_limits enable row level security;
revoke all on table public.winston_chat_rate_limits from anon, authenticated;

create index if not exists winston_chat_rate_limits_updated_idx
  on public.winston_chat_rate_limits(updated_at);
