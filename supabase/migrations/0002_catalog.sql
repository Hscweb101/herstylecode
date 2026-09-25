-- ============================================================
-- CATALOG: categories, products, variants, images, collections
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_id_idx on public.categories(parent_id);
create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text not null unique,
  short_description text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  cost_price numeric(10,2),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  low_stock_threshold int not null default 5,
  track_inventory boolean not null default true,
  material text,
  colour text,
  size text,
  weight_grams numeric(10,2),
  care_instructions text,
  whats_included text,
  delivery_info text,
  return_eligible boolean not null default true,
  video_url text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_bestseller boolean not null default false,
  is_trending boolean not null default false,
  is_on_sale boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  view_count int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on public.products(category_id);
create index products_slug_idx on public.products(slug);
create index products_sku_idx on public.products(sku);
create index products_tags_idx on public.products using gin(tags);
create index products_name_trgm_idx on public.products using gin(name gin_trgm_ops);
create index products_active_idx on public.products(is_active);
create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_collections (
  product_id uuid not null references public.products(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  primary key (product_id, collection_id)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  variant_name text not null,
  colour text,
  size text,
  finish text,
  price numeric(10,2) check (price is null or price >= 0),
  compare_at_price numeric(10,2),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants(product_id);
create trigger trg_product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images(product_id);
create index product_images_variant_id_idx on public.product_images(variant_id);

create table public.inventory_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  change_qty int not null,
  reason text not null check (reason in ('order_placed','order_cancelled','manual_adjustment','restock','return_restock')),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index inventory_history_product_id_idx on public.inventory_history(product_id);
