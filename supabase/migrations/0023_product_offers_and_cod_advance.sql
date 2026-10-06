-- ============================================================
-- Per-product storefront controls (all editable from Admin > Products):
--   * show_purchase_proof  : toggle the "X others purchased" pill
--   * online_discount_*    : discount applied when the shopper pays online ("Pay Now")
--   * cod_advance_*        : partial payment taken online for Cash on Delivery orders
-- plus the order columns needed to track a COD advance.
-- ============================================================

alter table public.products
  add column if not exists show_purchase_proof boolean not null default true,
  add column if not exists online_discount_type text not null default 'amount',
  add column if not exists online_discount_value numeric(10,2) not null default 0,
  add column if not exists cod_advance_type text not null default 'none',
  add column if not exists cod_advance_value numeric(10,2) not null default 0;

alter table public.products drop constraint if exists products_online_discount_type_check;
alter table public.products add constraint products_online_discount_type_check
  check (online_discount_type in ('amount', 'percent'));
alter table public.products drop constraint if exists products_online_discount_value_check;
alter table public.products add constraint products_online_discount_value_check
  check (online_discount_value >= 0);
alter table public.products drop constraint if exists products_cod_advance_type_check;
alter table public.products add constraint products_cod_advance_type_check
  check (cod_advance_type in ('none', 'amount', 'percent'));
alter table public.products drop constraint if exists products_cod_advance_value_check;
alter table public.products add constraint products_cod_advance_value_check
  check (cod_advance_value >= 0);

alter table public.orders
  add column if not exists advance_amount numeric(10,2) not null default 0,
  add column if not exists advance_paid boolean not null default false;

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending','paid','partially_paid','failed','refunded','partially_refunded'));
