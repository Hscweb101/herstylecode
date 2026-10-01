-- Official support email shown in the footer, Contact page and policy pages.
update public.store_settings
set value = value || '{"support_email":"herstylecode.in@gmail.com"}'::jsonb
where key = 'store_info';
