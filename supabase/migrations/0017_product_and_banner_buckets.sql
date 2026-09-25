-- Storage buckets for product photos and home banners (same pattern as the other public media buckets).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true), ('banners', 'banners', true)
on conflict (id) do nothing;

create policy "product_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

create policy "banners_bucket_public_read" on storage.objects
  for select using (bucket_id = 'banners');
create policy "banners_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'banners' and public.is_admin());
create policy "banners_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'banners' and public.is_admin());
create policy "banners_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'banners' and public.is_admin());
