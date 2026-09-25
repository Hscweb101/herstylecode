-- ============================================================
-- BUSINESS-LOGIC FUNCTIONS
-- ============================================================

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep products.rating_avg / rating_count in sync with approved reviews.
create or replace function public.refresh_product_rating(p_product_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products p
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.product_id = p_product_id and r.is_approved
      ), 0),
      rating_count = coalesce((
        select count(*) from public.reviews r
        where r.product_id = p_product_id and r.is_approved
      ), 0)
  where p.id = p_product_id;
end;
$$;

create or replace function public.trg_review_rating_refresh()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_product_rating(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.trg_review_rating_refresh();

-- Atomically decrement stock, preventing overselling. Raises if insufficient.
create or replace function public.decrement_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_qty int,
  p_reference_type text,
  p_reference_id uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_remaining int;
begin
  if p_variant_id is not null then
    update public.product_variants
    set stock_quantity = stock_quantity - p_qty
    where id = p_variant_id and stock_quantity >= p_qty
    returning stock_quantity into v_remaining;

    if v_remaining is null then
      raise exception 'INSUFFICIENT_STOCK: variant % does not have % units available', p_variant_id, p_qty;
    end if;
  else
    update public.products
    set stock_quantity = stock_quantity - p_qty
    where id = p_product_id and stock_quantity >= p_qty
    returning stock_quantity into v_remaining;

    if v_remaining is null then
      raise exception 'INSUFFICIENT_STOCK: product % does not have % units available', p_product_id, p_qty;
    end if;
  end if;

  insert into public.inventory_history (product_id, variant_id, change_qty, reason, reference_type, reference_id)
  values (p_product_id, p_variant_id, -p_qty, p_reference_type, p_reference_type, p_reference_id);
end;
$$;

-- Restore stock (order cancellation / return).
create or replace function public.restore_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_qty int,
  p_reference_type text,
  p_reference_id uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_variant_id is not null then
    update public.product_variants set stock_quantity = stock_quantity + p_qty where id = p_variant_id;
  else
    update public.products set stock_quantity = stock_quantity + p_qty where id = p_product_id;
  end if;

  insert into public.inventory_history (product_id, variant_id, change_qty, reason, reference_type, reference_id)
  values (p_product_id, p_variant_id, p_qty, p_reference_type, p_reference_type, p_reference_id);
end;
$$;

-- Validate a coupon code against an order subtotal + customer, without
-- exposing the full coupons table to anonymous clients (see RLS).
create or replace function public.validate_coupon(
  p_code text,
  p_subtotal numeric,
  p_customer_id uuid default null,
  p_guest_email text default null
)
returns table (
  is_valid boolean,
  message text,
  coupon_id uuid,
  discount_type text,
  discount_value numeric,
  max_discount_amount numeric,
  free_shipping boolean
)
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
  v_used_by_customer int;
  v_prior_orders int;
begin
  select * into c from public.coupons where lower(code) = lower(p_code) and is_active limit 1;

  if c is null then
    return query select false, 'Invalid coupon code', null::uuid, null::text, null::numeric, null::numeric, null::boolean;
    return;
  end if;

  if c.starts_at > now() or (c.ends_at is not null and c.ends_at < now()) then
    return query select false, 'This coupon is not currently active', null::uuid, null::text, null::numeric, null::numeric, null::boolean;
    return;
  end if;

  if p_subtotal < c.min_order_value then
    return query select false, format('Minimum order value is ₹%s', c.min_order_value), null::uuid, null::text, null::numeric, null::numeric, null::boolean;
    return;
  end if;

  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return query select false, 'This coupon has reached its usage limit', null::uuid, null::text, null::numeric, null::numeric, null::boolean;
    return;
  end if;

  select count(*) into v_used_by_customer from public.coupon_usages
  where coupon_id = c.id and (
    (p_customer_id is not null and customer_id = p_customer_id) or
    (p_guest_email is not null and guest_email = p_guest_email)
  );

  if v_used_by_customer >= c.usage_limit_per_customer then
    return query select false, 'You have already used this coupon', null::uuid, null::text, null::numeric, null::numeric, null::boolean;
    return;
  end if;

  if c.first_order_only then
    select count(*) into v_prior_orders from public.orders
    where (p_customer_id is not null and customer_id = p_customer_id)
       or (p_guest_email is not null and guest_email = p_guest_email);
    if v_prior_orders > 0 then
      return query select false, 'This coupon is valid for first orders only', null::uuid, null::text, null::numeric, null::numeric, null::boolean;
      return;
    end if;
  end if;

  return query select true, 'Coupon applied', c.id, c.discount_type, c.discount_value, c.max_discount_amount, c.free_shipping;
end;
$$;

grant execute on function public.validate_coupon(text, numeric, uuid, text) to anon, authenticated;
