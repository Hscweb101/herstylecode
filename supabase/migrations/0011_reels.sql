-- ============================================================
-- REELS: short vertical video tiles on the homepage
-- ============================================================

create table public.reels (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  poster_url text,
  caption text,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_reels_updated_at before update on public.reels
  for each row execute function public.set_updated_at();

alter table public.reels enable row level security;
create policy "reels_public_read" on public.reels for select using (is_active or public.is_admin());
create policy "reels_admin_write" on public.reels for all using (public.is_admin()) with check (public.is_admin());
