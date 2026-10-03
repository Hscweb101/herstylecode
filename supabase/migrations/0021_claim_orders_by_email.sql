-- ============================================================
-- Link guest orders to a customer account by e-mail.
--
-- Checkout works for guests (every visitor has an anonymous auth session), so an order is stored with
-- customer_id = that anonymous user and guest_email = the e-mail typed at checkout. If the shopper later
-- registers / signs in with the SAME e-mail (possibly on another phone or after clearing the browser),
-- their anonymous user id is gone and "My Orders" would be empty.
--
-- claim_my_orders() re-assigns those orders to the signed-in customer. It only ever acts for a real
-- (non-anonymous) user whose e-mail address is CONFIRMED, and only on orders whose checkout e-mail
-- matches that confirmed address, so nobody can claim someone else's orders.
-- ============================================================

create or replace function public.claim_my_orders()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_anon boolean;
  v_count integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  select lower(trim(u.email)), u.email_confirmed_at, coalesce(u.is_anonymous, false)
    into v_email, v_confirmed, v_anon
    from auth.users u
   where u.id = v_uid;

  if v_anon or v_email is null or v_email = '' or v_confirmed is null then
    return 0;
  end if;

  update public.orders
     set customer_id = v_uid
   where lower(trim(guest_email)) = v_email
     and customer_id is distinct from v_uid;
  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke all on function public.claim_my_orders() from public, anon;
grant execute on function public.claim_my_orders() to authenticated;
