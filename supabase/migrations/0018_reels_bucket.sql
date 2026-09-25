-- Storage bucket for reel videos and their poster images (same pattern as the other public media buckets).
insert into storage.buckets (id, name, public)
values ('reels', 'reels', true)
on conflict (id) do nothing;

create policy "reels_bucket_public_read" on storage.objects
  for select using (bucket_id = 'reels');
create policy "reels_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'reels' and public.is_admin());
create policy "reels_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'reels' and public.is_admin());
create policy "reels_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'reels' and public.is_admin());
