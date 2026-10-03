-- Admin-only customer list that includes the sign-in e-mail (which lives in auth.users, not in profiles)
-- plus order stats. Guests who only checked out are shown with the e-mail / name / phone they typed at checkout.
create or replace function public.admin_list_customers()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  is_registered boolean,
  order_count bigint,
  total_spent numeric,
  last_order_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id,
    coalesce(u.email::text, lo.guest_email) as email,
    coalesce(nullif(p.full_name, ''), lo.guest_name) as full_name,
    coalesce(nullif(p.phone, ''), lo.guest_phone) as phone,
    p.created_at,
    u.last_sign_in_at,
    (u.email_confirmed_at is not null) as email_confirmed,
    (u.email is not null) as is_registered,
    coalesce(st.order_count, 0) as order_count,
    coalesce(st.total_spent, 0) as total_spent,
    st.last_order_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join lateral (
    select o.guest_email, o.guest_name, o.guest_phone
    from public.orders o
    where o.customer_id = p.id
    order by o.placed_at desc
    limit 1
  ) lo on true
  left join lateral (
    select
      count(*) as order_count,
      sum(o.total_amount) filter (where o.status not in ('cancelled', 'returned', 'refunded')) as total_spent,
      max(o.placed_at) as last_order_at
    from public.orders o
    where o.customer_id = p.id
      and not (o.payment_method = 'razorpay' and o.payment_status in ('pending', 'failed'))
  ) st on true
  where p.role = 'customer'
  order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_customers() from public, anon;
grant execute on function public.admin_list_customers() to authenticated;
