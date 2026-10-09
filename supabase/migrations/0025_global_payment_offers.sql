-- Pay Now discount and COD partial payment are now one site-wide setting (Admin > Settings),
-- not per product. The old per-product columns stay in the table but are no longer used.
insert into public.store_settings (key, value)
values ('payment_offers', '{"online_discount_type":"percent","online_discount_value":0,"cod_advance_type":"none","cod_advance_value":0}'::jsonb)
on conflict (key) do nothing;
