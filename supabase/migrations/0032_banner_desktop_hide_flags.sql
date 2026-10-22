-- Banner: per-element hide flags for desktop
alter table public.banners
  add column if not exists hide_title_desktop boolean not null default false,
  add column if not exists hide_subtitle_desktop boolean not null default false,
  add column if not exists hide_button_desktop boolean not null default false;
