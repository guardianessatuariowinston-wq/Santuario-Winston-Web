create index sponsor_payments_sponsorship_idx on public.sponsor_payments (sponsorship_id, created_at desc);
create index sponsor_incidents_sponsorship_idx on public.sponsor_incidents (sponsorship_id, opened_at desc);
create index sponsor_audit_log_actor_idx on public.sponsor_audit_log (actor_user_id, created_at desc);

create policy "sponsor_people_deny_clients" on public.sponsor_people for all to anon, authenticated using (false) with check (false);
create policy "sponsorship_residents_deny_clients" on public.sponsorship_residents for all to anon, authenticated using (false) with check (false);
create policy "sponsorships_deny_clients" on public.sponsorships for all to anon, authenticated using (false) with check (false);
create policy "sponsor_payments_deny_clients" on public.sponsor_payments for all to anon, authenticated using (false) with check (false);
create policy "sponsor_incidents_deny_clients" on public.sponsor_incidents for all to anon, authenticated using (false) with check (false);
create policy "sponsor_audit_log_deny_clients" on public.sponsor_audit_log for all to anon, authenticated using (false) with check (false);
