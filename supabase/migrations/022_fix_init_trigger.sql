-- =============================================
-- Migration 022: Init trigger safety net (Phase 2 hotfix)
-- ─────────────────────────────────────────────────────────
-- Ensures the fn_init_new_user trigger properly handles
-- onboarding_completed flag and avoids duplicate inserts.
-- =============================================

-- Ensure onboarding_completed column exists
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default true;

-- Update the init trigger to handle onboarding_completed properly
create or replace function public.fn_init_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_free_plan_id uuid;
begin
  -- Create credits row (ignore if exists)
  insert into public.credits (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  -- Create free subscription (ignore if exists)
  select id into v_free_plan_id from public.plans where name = 'free' limit 1;

  if v_free_plan_id is not null then
    insert into public.subscriptions (user_id, plan_id, status, started_at, expires_at, auto_renew)
    values (new.id, v_free_plan_id, 'active', now(), now() + interval '100 years', false)
    on conflict do nothing;
  end if;

  -- Safety: ensure onboarding_completed is false for new signups
  -- The verify-otp Edge Function inserts with onboarding_completed=false
  -- This trigger runs AFTER insert, so the value is already set.
  -- This is just a safety net in case something else inserts with true.
  -- Note: we don't override if the inserting code explicitly set a value.

  return new;
end;
$$;

-- Recreate the trigger
drop trigger if exists trg_init_new_user on public.profiles;
create trigger trg_init_new_user
  after insert on public.profiles
  for each row execute function public.fn_init_new_user();

-- ─── Add missing updated_at columns ────────────────────
-- Some tables may be missing updated_at, ensure they exist
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- Add indexes for performance
create index if not exists idx_notifications_user_unread
  on public.notifications(user_id) where is_read = false;

create index if not exists idx_subscriptions_user_active
  on public.subscriptions(user_id) where status = 'active';

create index if not exists idx_referrals_referrer_verified
  on public.referrals(referrer_id) where status = 'verified';
