-- Card thumbnail: an optional image shown only on product cards (shop grid, home rails, menus), separate from the gallery.
alter table public.products add column if not exists thumbnail_url text;
