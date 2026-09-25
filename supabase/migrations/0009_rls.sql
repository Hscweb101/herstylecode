-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','staff')
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Catalog: public read, admin write ----------
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_history enable row level security;

create policy "categories_public_read" on public.categories for select using (is_active or public.is_admin());
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "collections_public_read" on public.collections for select using (is_active or public.is_admin());
create policy "collections_admin_write" on public.collections for all using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read" on public.products for select using (is_active or public.is_admin());
create policy "products_admin_write" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "product_collections_public_read" on public.product_collections for select using (true);
create policy "product_collections_admin_write" on public.product_collections for all using (public.is_admin()) with check (public.is_admin());

create policy "product_variants_public_read" on public.product_variants for select using (is_active or public.is_admin());
create policy "product_variants_admin_write" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images_public_read" on public.product_images for select using (true);
create policy "product_images_admin_write" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

create policy "inventory_history_admin_only" on public.inventory_history for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Profiles ----------
alter table public.profiles enable row level security;
create policy "profiles_self_read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "profiles_admin_insert" on public.profiles for insert with check (id = auth.uid() or public.is_admin());

-- ---------- Addresses ----------
alter table public.addresses enable row level security;
create policy "addresses_owner_all" on public.addresses for all
  using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

-- ---------- Cart / Wishlist ----------
-- Guest carts (customer_id is null) are identified by an unguessable
-- session_id generated client-side; authenticated users are scoped to
-- their own customer_id.
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;

create policy "carts_owner_all" on public.carts for all
  using (customer_id = auth.uid() or (customer_id is null and auth.role() = 'anon') or public.is_admin())
  with check (customer_id = auth.uid() or (customer_id is null and auth.role() = 'anon') or public.is_admin());

create policy "cart_items_owner_all" on public.cart_items for all
  using (
    exists (select 1 from public.carts c where c.id = cart_id and (c.customer_id = auth.uid() or (c.customer_id is null and auth.role() = 'anon')))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and (c.customer_id = auth.uid() or (c.customer_id is null and auth.role() = 'anon')))
    or public.is_admin()
  );

create policy "wishlists_owner_all" on public.wishlists for all
  using (customer_id = auth.uid() or (customer_id is null and auth.role() = 'anon') or public.is_admin())
  with check (customer_id = auth.uid() or (customer_id is null and auth.role() = 'anon') or public.is_admin());

-- ---------- Orders (writes happen server-side via service role only) ----------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;

create policy "orders_owner_read" on public.orders for select using (customer_id = auth.uid() or public.is_admin());
create policy "orders_admin_write" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "orders_admin_insert" on public.orders for insert with check (public.is_admin());
create policy "orders_admin_delete" on public.orders for delete using (public.is_admin());

create policy "order_items_owner_read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin()))
);
create policy "order_items_admin_write" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

create policy "order_status_history_owner_read" on public.order_status_history for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin()))
);
create policy "order_status_history_admin_write" on public.order_status_history for all using (public.is_admin()) with check (public.is_admin());

create policy "payments_owner_read" on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin()))
);
create policy "payments_admin_write" on public.payments for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Coupons (never directly readable by clients; use validate_coupon RPC) ----------
alter table public.coupons enable row level security;
alter table public.coupon_usages enable row level security;
create policy "coupons_admin_only" on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy "coupon_usages_admin_only" on public.coupon_usages for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Reviews ----------
alter table public.reviews enable row level security;
create policy "reviews_public_read_approved" on public.reviews for select using (is_approved or customer_id = auth.uid() or public.is_admin());
create policy "reviews_customer_insert" on public.reviews for insert with check (customer_id = auth.uid() or public.is_admin());
create policy "reviews_customer_update_own" on public.reviews for update using (customer_id = auth.uid() or public.is_admin()) with check (customer_id = auth.uid() or public.is_admin());
create policy "reviews_admin_delete" on public.reviews for delete using (public.is_admin());

-- ---------- CMS: banners, static pages, faqs, navigation, settings ----------
alter table public.banners enable row level security;
alter table public.static_pages enable row level security;
alter table public.faqs enable row level security;
alter table public.navigation_items enable row level security;
alter table public.store_settings enable row level security;

create policy "banners_public_read" on public.banners for select using (is_active or public.is_admin());
create policy "banners_admin_write" on public.banners for all using (public.is_admin()) with check (public.is_admin());

create policy "static_pages_public_read" on public.static_pages for select using (true);
create policy "static_pages_admin_write" on public.static_pages for all using (public.is_admin()) with check (public.is_admin());

create policy "faqs_public_read" on public.faqs for select using (is_active or public.is_admin());
create policy "faqs_admin_write" on public.faqs for all using (public.is_admin()) with check (public.is_admin());

create policy "navigation_public_read" on public.navigation_items for select using (is_active or public.is_admin());
create policy "navigation_admin_write" on public.navigation_items for all using (public.is_admin()) with check (public.is_admin());

create policy "store_settings_public_read" on public.store_settings for select using (true);
create policy "store_settings_admin_write" on public.store_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Newsletter / Contact ----------
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;

create policy "newsletter_public_insert" on public.newsletter_subscribers for insert with check (true);
create policy "newsletter_admin_read" on public.newsletter_subscribers for select using (public.is_admin());
create policy "newsletter_admin_delete" on public.newsletter_subscribers for delete using (public.is_admin());

create policy "contact_public_insert" on public.contact_messages for insert with check (true);
create policy "contact_admin_read" on public.contact_messages for select using (public.is_admin());
create policy "contact_admin_write" on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());
