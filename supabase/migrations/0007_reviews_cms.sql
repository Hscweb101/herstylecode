-- ============================================================
-- REVIEWS, BANNERS, STATIC PAGES, FAQS, NAVIGATION, SETTINGS
-- ============================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  images text[] not null default '{}',
  is_verified_purchase boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_id_idx on public.reviews(product_id);
create index reviews_approved_idx on public.reviews(is_approved);
create trigger trg_reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null default 'hero' check (placement in ('hero','offer','category','announcement')),
  title text,
  subtitle text,
  image_url text,
  mobile_image_url text,
  link_url text,
  cta_text text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

create table public.static_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);
create trigger trg_static_pages_updated_at before update on public.static_pages
  for each row execute function public.set_updated_at();

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label text not null,
  url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger trg_store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();
