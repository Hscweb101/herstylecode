-- ============================================================
-- BLOG: SEO content articles (styling tips, guides, lookbooks)
-- ============================================================

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  author_name text not null default 'HerStyleCode',
  tags text[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_published_idx on public.blog_posts(is_published, published_at desc);
create trigger trg_blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;
create policy "blog_posts_public_read" on public.blog_posts for select using (is_published or public.is_admin());
create policy "blog_posts_admin_write" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

-- Storage bucket for cover images / in-post images
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

create policy "blog_bucket_public_read" on storage.objects
  for select using (bucket_id = 'blog');
create policy "blog_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'blog' and public.is_admin());
create policy "blog_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'blog' and public.is_admin());
create policy "blog_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'blog' and public.is_admin());
