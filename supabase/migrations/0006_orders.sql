-- ============================================================
-- ORDERS / ORDER ITEMS / STATUS HISTORY / PAYMENTS
-- Orders are created server-side only (via the checkout-create-order
-- edge function using the service role key) so that prices, stock and
-- coupon math are always derived from the database, never the client.
-- ============================================================

create sequence if not exists public.order_number_seq start 1000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('HSC' || nextval('public.order_number_seq')::text),
  customer_id uuid references public.profiles(id) on delete set null,
  guest_name text,
  guest_email text,
  guest_phone text,
  status text not null default 'new' check (status in
    ('new','paid','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','partially_refunded')),
  payment_method text not null default 'razorpay' check (payment_method in ('razorpay','cod')),
  subtotal numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  shipping_amount numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  shipping_address jsonb not null,
  billing_address jsonb,
  shipping_method text,
  shipping_provider text,
  tracking_number text,
  tracking_url text,
  internal_notes text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_id_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index orders_order_number_idx on public.orders(order_number);
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text not null,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index order_items_order_id_idx on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history(order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'razorpay',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created','authorized','captured','failed','refunded')),
  raw_response jsonb,
  created_at timestamptz not null default now()
);
create index payments_order_id_idx on public.payments(order_id);
create index payments_razorpay_order_id_idx on public.payments(razorpay_order_id);
