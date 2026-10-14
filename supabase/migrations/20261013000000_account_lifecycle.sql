-- =====================================================================
-- Hemera: account lifecycle (Requirements 8 + 9)
-- Matched to the live schema. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lifecycle state on the profile (existing rows become 'active')
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'deleted')),
  add column if not exists status_changed_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists profiles_account_status_idx
  on public.profiles (account_status) where account_status <> 'active';

-- ---------------------------------------------------------------------
-- 2. Reserved emails. release_at NULL = held indefinitely.
-- ---------------------------------------------------------------------
create table if not exists public.reserved_emails (
  email        text primary key check (email = lower(email)),
  user_id      uuid not null,
  reserved_at  timestamptz not null default now(),
  release_at   timestamptz
);
create index if not exists reserved_emails_user_idx on public.reserved_emails (user_id);
alter table public.reserved_emails enable row level security;  -- no policies: definer functions only

-- ---------------------------------------------------------------------
-- 3. Who may manage deleted accounts
--    View / reactivate: active superadmin, or an active admin with the 'admin' scope
--    Permanently delete: active superadmin only
-- ---------------------------------------------------------------------
create or replace function public.is_account_admin(p_user_id uuid, p_superadmin_only boolean default false)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = p_user_id
      and a.status = 'active'
      and (a.role = 'superadmin' or (not p_superadmin_only and 'admin' = any(a.scopes)))
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Eligibility: the single definition of what blocks deletion
-- ---------------------------------------------------------------------
create or replace function public.account_deletion_blockers(p_user_id uuid)
returns text[]
language plpgsql stable security definer set search_path = public
as $$
declare
  b text[] := '{}';
  -- orders.status has no check constraint, so this is deny-by-default:
  -- any status NOT in this list counts as an active order.
  v_finished text[] := array['delivered', 'completed', 'cancelled', 'canceled', 'refunded', 'failed', 'rejected'];
begin
  -- E-Chop / E-Wash orders
  if exists (
    select 1 from public.orders
    where user_id = p_user_id
      and order_type in ('echop', 'ewash')
      and coalesce(status, '') <> all (v_finished)
  ) then b := array_append(b, 'active_order'); end if;

  -- E-Plan: active plan, unfinished E-Plan order, or a delivery on the road
  if exists (select 1 from public.eplan_plans where user_id = p_user_id and status = 'active')
     or exists (
       select 1 from public.orders
       where user_id = p_user_id and order_type = 'eplan'
         and coalesce(status, '') <> all (v_finished)
     )
     or exists (
       select 1 from public.eplan_deliveries d
       join public.eplan_plans pl on pl.id = d.plan_id
       where pl.user_id = p_user_id and d.status = 'in_transit'
     )
  then b := array_append(b, 'active_eplan'); end if;

  -- E-Wash subscription plans
  if exists (select 1 from public.wash_plans where user_id = p_user_id and status = 'active')
  then b := array_append(b, 'active_subscription'); end if;

  -- Money in flight: open funding/payment attempts, withdrawals, unresolved payment reviews
  if exists (
       select 1 from public.wallet_transactions
       where user_id = p_user_id and status in ('pending', 'processing')
     )
     or exists (
       select 1 from public.withdrawal_requests
       where user_id = p_user_id and status in ('pending', 'processing', 'review')
     )
     or exists (
       select 1 from public.payment_reconciliation r
       join public.wallet_transactions wt on wt.tx_ref = r.tx_ref
       where wt.user_id = p_user_id and r.resolved_at is null
     )
  then b := array_append(b, 'pending_wallet_transaction'); end if;

  -- Wallet balance (E-Plan top-ups and plain funding share this wallet)
  if exists (select 1 from public.wallets where user_id = p_user_id and balance_kobo > 0)
  then b := array_append(b, 'wallet_balance'); end if;

  return b;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Race protection
--    Deletion takes FOR UPDATE on the profile row; every new order, plan,
--    wallet transaction or withdrawal takes FOR SHARE on it and requires
--    'active'. Whichever commits first, the other one sees it.
--
--    A deliberate admin action on a deleted account (e.g. refunding its
--    wallet) can opt out inside its own transaction with:
--      set local hemera.allow_inactive_account = 'on';
-- ---------------------------------------------------------------------
create or replace function public.assert_account_active()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
begin
  if new.user_id is null
     or current_setting('hemera.allow_inactive_account', true) = 'on' then
    return new;
  end if;

  select account_status into v_status
  from public.profiles where id = new.user_id
  for share;

  if found and v_status <> 'active' then
    raise exception 'ACCOUNT_NOT_ACTIVE' using hint = 'This account is suspended or deleted';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_require_active_account on public.orders;
create trigger orders_require_active_account
  before insert on public.orders
  for each row execute function public.assert_account_active();

drop trigger if exists eplan_plans_require_active_account on public.eplan_plans;
create trigger eplan_plans_require_active_account
  before insert on public.eplan_plans
  for each row execute function public.assert_account_active();

drop trigger if exists wash_plans_require_active_account on public.wash_plans;
create trigger wash_plans_require_active_account
  before insert on public.wash_plans
  for each row execute function public.assert_account_active();

drop trigger if exists wallet_tx_require_active_account on public.wallet_transactions;
create trigger wallet_tx_require_active_account
  before insert on public.wallet_transactions
  for each row execute function public.assert_account_active();

drop trigger if exists withdrawals_require_active_account on public.withdrawal_requests;
create trigger withdrawals_require_active_account
  before insert on public.withdrawal_requests
  for each row execute function public.assert_account_active();

-- ---------------------------------------------------------------------
-- 6. The deletion itself (called only by the delete-account edge function)
-- ---------------------------------------------------------------------
create or replace function public.request_account_deletion(p_user_id uuid, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_status   text;
  v_email    text;
  v_blockers text[];
begin
  select account_status into v_status
  from public.profiles where id = p_user_id
  for update;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;
  if v_status = 'deleted' then
    return jsonb_build_object('status', 'already_deleted');
  end if;
  if v_status <> 'active' then
    return jsonb_build_object('status', 'not_active');
  end if;

  v_blockers := public.account_deletion_blockers(p_user_id);
  if cardinality(v_blockers) > 0 then
    -- Nothing changed: no partial deactivation.
    return jsonb_build_object('status', 'blocked', 'blockers', to_jsonb(v_blockers));
  end if;

  select email into v_email from auth.users where id = p_user_id;

  update public.profiles
     set account_status    = 'deleted',
         status_changed_at = now(),
         deleted_at        = now()
   where id = p_user_id;

  if v_email is not null then
    insert into public.reserved_emails (email, user_id)
    values (lower(v_email), p_user_id)
    on conflict (email) do update
      set user_id = excluded.user_id, reserved_at = now(), release_at = null;
  end if;

  -- Your existing deletion record
  insert into public.account_deletions (id, user_id, email, reason, created_at)
  values (gen_random_uuid(), p_user_id, v_email, left(p_reason, 1000), now())
  on conflict do nothing;

  return jsonb_build_object('status', 'deleted');
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Signup enforcement
-- ---------------------------------------------------------------------
-- Until a purge, the auth user still exists, so Supabase already refuses the
-- duplicate email. This hook keeps it reserved AFTER a purge, per release_at.
-- Enable: Dashboard → Authentication → Hooks → "Before User Created".
create or replace function public.hook_block_reserved_emails(event jsonb)
returns jsonb
language plpgsql stable
as $$
declare
  v_email text := lower(event -> 'user' ->> 'email');
begin
  if v_email is not null and exists (
    select 1 from public.reserved_emails
    where email = v_email and (release_at is null or release_at > now())
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 409,
      'message', 'This email is linked to a deleted Hemera account. Please contact Support to restore it.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on public.reserved_emails to supabase_auth_admin;
grant execute on function public.hook_block_reserved_emails(jsonb) to supabase_auth_admin;

-- For the signup screen. Reveals only whether an email belongs to a DELETED account.
create or replace function public.email_registration_status(p_email text)
returns text
language sql stable security definer set search_path = public
as $$
  select case when exists (
    select 1 from public.reserved_emails
    where email = lower(trim(p_email)) and (release_at is null or release_at > now())
  ) then 'reserved' else 'not_reserved' end;
$$;

-- ---------------------------------------------------------------------
-- 8. Admin: Suspended Accounts listing
--    Shows user-deleted accounts plus anyone currently banned in Supabase Auth,
--    with the wallet balance so admins can see money left on a deleted account.
-- ---------------------------------------------------------------------
create or replace function public.admin_list_restricted_accounts()
returns table (
  user_id             uuid,
  email               text,
  full_name           text,
  phone               text,
  kind                text,         -- 'user_deleted' | 'suspended'
  deleted_at          timestamptz,
  deletion_reason     text,
  banned_until        timestamptz,
  wallet_balance_kobo bigint
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_account_admin(auth.uid()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
    select p.id,
           u.email::text,
           p.full_name,
           p.phone,
           case when p.account_status = 'deleted' then 'user_deleted' else 'suspended' end,
           p.deleted_at,
           (select ad.reason from public.account_deletions ad
             where ad.user_id = p.id order by ad.created_at desc limit 1),
           u.banned_until,
           coalesce(w.balance_kobo, 0)::bigint
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.wallets w on w.user_id = p.id
     where p.account_status in ('deleted', 'suspended')
        or u.banned_until > now()
     order by coalesce(p.status_changed_at, p.deleted_at) desc nulls last;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Admin: reactivate / prepare purge (called by admin-account-lifecycle
--    with the service role, after it has checked the admin's role)
-- ---------------------------------------------------------------------
create or replace function public.admin_reactivate_deleted_account(p_user_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
begin
  select account_status into v_status from public.profiles where id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_status = 'active' then return 'already_active'; end if;            -- idempotent retry
  if v_status <> 'deleted' then raise exception 'NOT_A_DELETED_ACCOUNT'; end if;

  update public.profiles
     set account_status = 'active', status_changed_at = now(), deleted_at = null
   where id = p_user_id;

  delete from public.reserved_emails where user_id = p_user_id;
  return 'reactivated';
end;
$$;

-- p_retain_days: NULL = keep the email reserved indefinitely, 0 = release now, N = after N days.
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

-- ---------------------------------------------------------------------
-- 10. Privileges (Supabase grants EXECUTE to anon/authenticated by default)
-- ---------------------------------------------------------------------
revoke all on function public.account_deletion_blockers(uuid)            from public, anon, authenticated;
revoke all on function public.request_account_deletion(uuid, text)       from public, anon, authenticated;
revoke all on function public.admin_reactivate_deleted_account(uuid)     from public, anon, authenticated;
revoke all on function public.admin_prepare_purge(uuid, int)             from public, anon, authenticated;
revoke all on function public.hook_block_reserved_emails(jsonb)          from public, anon, authenticated;
revoke all on function public.is_account_admin(uuid, boolean)            from public, anon, authenticated;
revoke all on function public.admin_list_restricted_accounts()           from public, anon;

grant execute on function public.account_deletion_blockers(uuid)         to service_role;
grant execute on function public.request_account_deletion(uuid, text)    to service_role;
grant execute on function public.admin_reactivate_deleted_account(uuid)  to service_role;
grant execute on function public.admin_prepare_purge(uuid, int)          to service_role;
grant execute on function public.is_account_admin(uuid, boolean)         to service_role;
grant execute on function public.admin_list_restricted_accounts()        to authenticated;
grant execute on function public.email_registration_status(text)         to anon, authenticated;
