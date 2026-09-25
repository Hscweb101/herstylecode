-- ============================================================
-- CATEGORY VIDEOS, MOMENTS (backend-controlled "Every Moment"
-- section), BANNER SIMPLIFICATION, VERIFIED-PURCHASE REVIEWS
-- ============================================================

-- ---------- Category video support ----------
alter table public.categories add column video_url text;

-- ---------- Moments: "Designed For Your Every Moment" tiles ----------
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  image_url text,
  link_type text not null default 'url' check (link_type in ('product', 'category', 'url')),
  product_id uuid references public.products(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  custom_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_moments_updated_at before update on public.moments
  for each row execute function public.set_updated_at();

alter table public.moments enable row level security;
create policy "moments_public_read" on public.moments for select using (is_active or public.is_admin());
create policy "moments_admin_write" on public.moments for all using (public.is_admin()) with check (public.is_admin());

-- Storage buckets for category media and moments images
insert into storage.buckets (id, name, public)
values ('categories', 'categories', true), ('moments', 'moments', true)
on conflict (id) do nothing;

create policy "categories_bucket_public_read" on storage.objects
  for select using (bucket_id = 'categories');
create policy "categories_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'categories' and public.is_admin());
create policy "categories_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'categories' and public.is_admin());
create policy "categories_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'categories' and public.is_admin());

create policy "moments_bucket_public_read" on storage.objects
  for select using (bucket_id = 'moments');
create policy "moments_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'moments' and public.is_admin());
create policy "moments_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'moments' and public.is_admin());
create policy "moments_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'moments' and public.is_admin());

-- ---------- Banners: simplify to hero-only ----------
update public.banners set placement = 'hero' where placement <> 'hero';
alter table public.banners drop constraint banners_placement_check;
alter table public.banners add constraint banners_placement_check check (placement in ('hero'));
alter table public.banners alter column placement set default 'hero';

-- ---------- Reviews: only verified purchasers (or admin) may insert ----------
drop policy "reviews_customer_insert" on public.reviews;
create policy "reviews_customer_insert" on public.reviews for insert with check (
  public.is_admin()
  or (
    customer_id = auth.uid()
    and exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = reviews.product_id
        and o.customer_id = auth.uid()
        and o.status <> 'cancelled'
    )
  )
);
