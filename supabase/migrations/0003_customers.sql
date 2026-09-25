-- ============================================================
-- CUSTOMERS / PROFILES / ADDRESSES
-- profiles.id mirrors auth.users.id (1:1). Created automatically
-- on signup via handle_new_user() trigger (see 0008_functions.sql).
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','staff','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'India',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_customer_id_idx on public.addresses(customer_id);
create trigger trg_addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  source text,
  subscribed_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
