-- Hemera: admin Suspended Accounts page support. Run after 20261013000000_account_lifecycle.sql.

-- Lets the admin panel know whether to show "Permanently delete" (superadmins only).
-- The edge function enforces the same rule server-side regardless.
create or replace function public.current_admin_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.admins where user_id = auth.uid() and status = 'active';
$$;

revoke all on function public.current_admin_role() from public, anon;
grant execute on function public.current_admin_role() to authenticated;

-- Same as before, plus: refuse to purge while money is still in the wallet
-- (a late transfer can land after deletion). Refund it first.
create or replace function public.admin_prepare_purge(p_user_id uuid, p_retain_days int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
  v_email  text;
begin
  select account_status into v_status from public.profiles where id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_status <> 'deleted' then raise exception 'ONLY_DELETED_ACCOUNTS_CAN_BE_PURGED'; end if;

  if exists (select 1 from public.wallets where user_id = p_user_id and balance_kobo > 0) then
    raise exception 'WALLET_BALANCE_REMAINING';
  end if;

  select email into v_email from auth.users where id = p_user_id;

  if p_retain_days = 0 then
    delete from public.reserved_emails where user_id = p_user_id;
  else
    update public.reserved_emails
       set release_at = case when p_retain_days is null then null
                             else now() + make_interval(days => p_retain_days) end
     where user_id = p_user_id;
  end if;

  return v_email;
end;
$$;

revoke all on function public.admin_prepare_purge(uuid, int) from public, anon, authenticated;
grant execute on function public.admin_prepare_purge(uuid, int) to service_role;
