create extension if not exists pg_net;

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  order_updates boolean not null default true,
  wallet_credits boolean not null default true,
  network_updates boolean not null default true,
  promotions boolean not null default true,
  third_party_updates boolean not null default true,
  eplan_subscription_updates boolean not null default true,
  ewash_subscription_updates boolean not null default true,
  chat_messages boolean not null default true,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings
  add column if not exists wallet_credits boolean not null default true,
  add column if not exists network_updates boolean not null default true,
  add column if not exists third_party_updates boolean not null default true,
  add column if not exists eplan_subscription_updates boolean not null default true,
  add column if not exists ewash_subscription_updates boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.notification_settings enable row level security;
drop policy if exists "Users manage own notification settings" on public.notification_settings;
create policy "Users manage own notification settings"
  on public.notification_settings
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
grant select, insert, update on public.notification_settings to authenticated;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in (
    'order_updates',
    'wallet_credits',
    'network_updates',
    'promotions',
    'third_party_updates',
    'eplan_subscription_updates',
    'ewash_subscription_updates',
    'chat_messages',
    'welcome'
  )),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications"
  on public.notifications
  for delete
  to authenticated
  using (user_id = auth.uid());
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;

create table if not exists public.notification_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.notification_push_tokens enable row level security;
drop policy if exists "Users manage own notification push tokens" on public.notification_push_tokens;
create policy "Users manage own notification push tokens"
  on public.notification_push_tokens
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
grant select, insert, update, delete on public.notification_push_tokens to authenticated;
grant all on public.notification_push_tokens to service_role;

create or replace function public.redact_chat_notification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.category = 'chat_messages' then
    new.title := 'New live chat reply';
    new.body := 'Support has replied to your live chat. Open the Hemera app to continue the conversation.';
    new.data := '{}'::jsonb;
  end if;
  return new;
end;
$$;

drop trigger if exists redact_chat_notification on public.notifications;
create trigger redact_chat_notification
  before insert on public.notifications
  for each row execute function public.redact_chat_notification();

create or replace function public.dispatch_notification_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dispatch_secret text;
begin
  select decrypted_secret
    into dispatch_secret
    from vault.decrypted_secrets
   where name = 'notification_dispatch_secret'
   limit 1;

  if dispatch_secret is null then
    raise warning 'Notification delivery is not configured: add notification_dispatch_secret to Supabase Vault.';
    return new;
  end if;

  perform net.http_post(
    url := 'https://hjekdbhjhndvoeuaermd.supabase.co/functions/v1/notification-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notification-secret', dispatch_secret
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
exception
  when undefined_table or invalid_schema_name or undefined_function or insufficient_privilege then
    raise warning 'Could not enqueue notification delivery (SQLSTATE %). Confirm Supabase Vault and pg_net are enabled.', SQLSTATE;
    return new;
end;
$$;

drop trigger if exists dispatch_notification_delivery on public.notifications;
create trigger dispatch_notification_delivery
  after insert on public.notifications
  for each row execute function public.dispatch_notification_delivery();

create or replace function public.create_signup_welcome_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  insert into public.notifications (user_id, category, title, body, data)
  values (
    new.id,
    'welcome',
    'Welcome to Hemera!',
    case
      when display_name is null then
        'Thanks for signing up with Hemera! Your account is ready. You can now order meals with E-Chop, book laundry and dry-cleaning services with E-Wash, and explore E-Plan.'
      else
        'Hi ' || display_name || ', thanks for signing up with Hemera! Your account is ready. You can now order meals with E-Chop, book laundry and dry-cleaning services with E-Wash, and explore E-Plan.'
    end,
    '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists create_signup_welcome_notification on auth.users;
create trigger create_signup_welcome_notification
  after insert on auth.users
  for each row execute function public.create_signup_welcome_notification();

create or replace function public.create_order_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_name text;
  service_name text;
  status_name text;
  order_reference text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  if new.user_id is null then
    return new;
  end if;

  if lower(coalesce(new.order_type, '')) in ('eplan', 'e-plan') then
    category_name := 'eplan_subscription_updates';
    service_name := 'E-Plan';
  elsif lower(coalesce(new.order_type, '')) in ('ewash_subscription', 'e-wash-subscription')
      or lower(coalesce(new.metadata ->> 'kind', '')) = 'subscription' then
    category_name := 'ewash_subscription_updates';
    service_name := 'E-Wash subscription';
  else
    category_name := 'order_updates';
    service_name := case lower(coalesce(new.order_type, ''))
      when 'echop' then 'E-Chop'
      when 'ewash' then 'E-Wash'
      else initcap(replace(coalesce(new.order_type, 'service'), '_', ' '))
    end;
  end if;

  status_name := initcap(replace(coalesce(new.status, 'updated'), '_', ' '));
  order_reference := nullif(new.metadata ->> 'ref', '');
  insert into public.notifications (user_id, category, title, body, data)
  values (
    new.user_id,
    category_name,
    service_name || ' update',
    'Your ' || service_name || ' order'
      || case when order_reference is null then '' else ' (' || order_reference || ')' end
      || ' is now ' || status_name || '.',
    jsonb_build_object(
      'order_id', new.id,
      'order_type', new.order_type,
      'status', new.status
    )
  );
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.orders') is not null then
    drop trigger if exists create_order_status_notification on public.orders;
    create trigger create_order_status_notification
      after insert or update of status on public.orders
      for each row execute function public.create_order_status_notification();
  end if;
end;
$$;

create or replace function public.create_wallet_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_name text;
  title_text text;
  body_text text;
  transaction_purpose text;
begin
  if tg_op = 'UPDATE'
      and new.status is not distinct from old.status
      and new.purpose is not distinct from old.purpose then
    return new;
  end if;
  if new.user_id is null or lower(coalesce(new.status, '')) <> 'success' then
    return new;
  end if;

  transaction_purpose := lower(coalesce(new.purpose, ''));
  if lower(coalesce(new.type, '')) = 'credit' then
    if tg_op = 'UPDATE' and lower(coalesce(old.status, '')) = 'success' then
      return new;
    end if;
    category_name := 'wallet_credits';
    title_text := 'Wallet payment received';
    body_text := 'Your E-Plan wallet was credited with NGN '
      || trim(to_char(coalesce(new.amount_kobo, 0)::numeric / 100, 'FM999,999,999,990.00'))
      || '.';
  elsif transaction_purpose = 'eplan' then
    category_name := 'eplan_subscription_updates';
    title_text := 'E-Plan payment confirmed';
    body_text := 'Your E-Plan payment has been confirmed.';
  elsif transaction_purpose = 'subscription' then
    category_name := 'ewash_subscription_updates';
    title_text := 'E-Wash subscription update';
    body_text := 'Your E-Wash subscription payment has been confirmed.';
  else
    return new;
  end if;

  insert into public.notifications (user_id, category, title, body, data)
  values (
    new.user_id,
    category_name,
    title_text,
    body_text,
    jsonb_build_object('wallet_transaction_id', new.id, 'tx_ref', new.tx_ref)
  );
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.wallet_transactions') is not null then
    drop trigger if exists create_wallet_notification on public.wallet_transactions;
    create trigger create_wallet_notification
      after insert or update of status, purpose on public.wallet_transactions
      for each row execute function public.create_wallet_notification();
  end if;
end;
$$;

create or replace function public.create_subscription_payment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_name text;
  category_name text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  if new.user_id is null
      or lower(coalesce(new.status, '')) not in ('success', 'successful', 'completed', 'paid') then
    return new;
  end if;

  service_name := lower(coalesce(new.service, ''));
  if service_name = 'eplan' then
    category_name := 'eplan_subscription_updates';
  elsif service_name in ('ewash', 'subscription', 'e-wash') then
    category_name := 'ewash_subscription_updates';
  else
    return new;
  end if;

  insert into public.notifications (user_id, category, title, body, data)
  values (
    new.user_id,
    category_name,
    case when category_name = 'eplan_subscription_updates'
      then 'E-Plan subscription update'
      else 'E-Wash subscription update'
    end,
    case when category_name = 'eplan_subscription_updates'
      then 'Your E-Plan payment has been confirmed.'
      else 'Your E-Wash subscription payment has been confirmed.'
    end,
    jsonb_build_object('transaction_id', new.id, 'reference', new.reference, 'service', new.service)
  );
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.transactions') is not null then
    drop trigger if exists create_subscription_payment_notification on public.transactions;
    create trigger create_subscription_payment_notification
      after insert or update of status on public.transactions
      for each row execute function public.create_subscription_payment_notification();
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
      and not exists (
        select 1
          from pg_publication_tables
         where pubname = 'supabase_realtime'
           and schemaname = 'public'
           and tablename = 'notifications'
      ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
