-- =============================================
-- Table: referrals
-- =============================================

create table if not exists public.referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at  timestamptz not null default now(),
  unique (referrer_id, referred_id)
);

create index if not exists idx_ref_referrer_id on public.referrals(referrer_id);
create index if not exists idx_ref_referred_id on public.referrals(referred_id);
create index if not exists idx_ref_status      on public.referrals(status);
