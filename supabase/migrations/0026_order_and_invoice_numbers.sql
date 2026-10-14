-- Yearly order and invoice numbers:  order  HSC-ORD-2026-001   invoice  HSC-2026-001
-- The counter restarts at 001 every calendar year (India time), so on 1 Jan 2027 the next order becomes
-- HSC-ORD-2027-001 with no manual change. Existing orders keep their order number (customers may be
-- tracking them); they are given an invoice number in the order they were placed.
begin;

create table if not exists public.doc_counters (
  kind text not null,
  year int not null,
  last_value int not null default 0,
  primary key (kind, year)
);
alter table public.doc_counters enable row level security; -- no policies: only next_doc_number() touches it

create or replace function public.next_doc_number(p_kind text, p_prefix text, p_at timestamptz default now())
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from (p_at at time zone 'Asia/Kolkata'))::int;
  n int;
begin
  insert into public.doc_counters (kind, year, last_value) values (p_kind, y, 1)
  on conflict (kind, year) do update set last_value = public.doc_counters.last_value + 1
  returning last_value into n;
  return p_prefix || '-' || y || '-' || lpad(n::text, 3, '0');
end;
$$;
revoke all on function public.next_doc_number(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.next_doc_number(text, text, timestamptz) to service_role;

-- Invoice number: backfill existing orders oldest-first, then default for new ones.
alter table public.orders add column if not exists invoice_number text;
do $$
declare r record;
begin
  for r in select id, placed_at from public.orders where invoice_number is null order by placed_at, created_at loop
    update public.orders set invoice_number = public.next_doc_number('invoice', 'HSC', r.placed_at) where id = r.id;
  end loop;
end $$;
alter table public.orders alter column invoice_number set default public.next_doc_number('invoice', 'HSC');
alter table public.orders alter column invoice_number set not null;
create unique index if not exists orders_invoice_number_key on public.orders (invoice_number);

-- Order number (the "Order ID" shown to customers) uses the same yearly scheme from now on.
alter table public.orders alter column order_number set default public.next_doc_number('order', 'HSC-ORD');

commit;
