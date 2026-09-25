-- Storage bucket for review photos (used by both customer uploads and
-- admin-added reviews).
insert into storage.buckets (id, name, public)
values ('reviews', 'reviews', true)
on conflict (id) do nothing;

create policy "reviews_bucket_public_read" on storage.objects
  for select using (bucket_id = 'reviews');
create policy "reviews_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'reviews' and public.is_admin());
create policy "reviews_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'reviews' and public.is_admin());
create policy "reviews_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'reviews' and public.is_admin());
