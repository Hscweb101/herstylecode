-- Admin-only: permanently delete a customer (auth user + profile).
-- profiles/addresses/cart/wishlist cascade; orders keep their rows with customer_id set null.
create or replace function public.admin_delete_customer(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if target = auth.uid() then
    raise exception 'cannot delete yourself';
  end if;
  if exists (select 1 from public.profiles where id = target and role <> 'customer') then
    raise exception 'cannot delete admin/staff accounts';
  end if;
  delete from auth.users where id = target;
end;
$$;
revoke all on function public.admin_delete_customer(uuid) from public, anon;
grant execute on function public.admin_delete_customer(uuid) to authenticated;
