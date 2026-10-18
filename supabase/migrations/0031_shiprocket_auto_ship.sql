-- Auto-create a Shiprocket shipment when an order is confirmed (toggle in Admin > Settings).
insert into public.store_settings (key, value)
values ('shiprocket', '{"auto_ship": true}'::jsonb)
on conflict (key) do nothing;
