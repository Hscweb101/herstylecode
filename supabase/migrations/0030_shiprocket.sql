-- Shiprocket integration: ids returned when a shipment is created, so labels
-- and webhook updates can be matched back to the order.
alter table public.orders
  add column if not exists shiprocket_order_id text,
  add column if not exists shiprocket_shipment_id text,
  add column if not exists shipping_label_url text;
create index if not exists orders_shiprocket_order_id_idx on public.orders(shiprocket_order_id);
