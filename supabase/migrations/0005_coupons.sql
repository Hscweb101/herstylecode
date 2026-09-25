-- ============================================================
-- COUPONS
-- ============================================================

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_order_value numeric(10,2) not null default 0,
  max_discount_amount numeric(10,2),
  usage_limit int,
  usage_limit_per_customer int not null default 1,
  used_count int not null default 0,
  first_order_only boolean not null default false,
  free_shipping boolean not null default false,
  applies_to text not null default 'all' check (applies_to in ('all','category','product')),
  category_id uuid references public.categories(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index coupons_code_idx on public.coupons(code);
create trigger trg_coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

create table public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid,
  customer_id uuid references public.profiles(id) on delete set null,
  guest_email text,
  used_at timestamptz not null default now()
);
create index coupon_usages_coupon_id_idx on public.coupon_usages(coupon_id);
