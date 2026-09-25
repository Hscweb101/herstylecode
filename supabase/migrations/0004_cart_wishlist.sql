-- ============================================================
-- CART & WISHLIST
-- Guest carts/wishlists are keyed by a client-generated session_id
-- (stored in localStorage) and merged into the customer's account
-- on login. Either customer_id or session_id must be present.
-- ============================================================

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_chk check (customer_id is not null or session_id is not null)
);
create unique index carts_customer_id_uidx on public.carts(customer_id) where customer_id is not null;
create unique index carts_session_id_uidx on public.carts(session_id) where session_id is not null;
create trigger trg_carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);
create trigger trg_cart_items_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlists_owner_chk check (customer_id is not null or session_id is not null)
);
create unique index wishlists_customer_product_uidx on public.wishlists(customer_id, product_id) where customer_id is not null;
create unique index wishlists_session_product_uidx on public.wishlists(session_id, product_id) where session_id is not null;
