insert into storage.buckets (id, name, public) values ('demo-media', 'demo-media', true) on conflict (id) do nothing;

create policy "demo-media public read" on storage.objects for select using (bucket_id = 'demo-media');
create policy "demo-media authed insert" on storage.objects for insert to authenticated with check (bucket_id = 'demo-media');
create policy "demo-media authed update" on storage.objects for update to authenticated using (bucket_id = 'demo-media');
create policy "demo-media authed delete" on storage.objects for delete to authenticated using (bucket_id = 'demo-media');