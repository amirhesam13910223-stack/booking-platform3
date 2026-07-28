-- =============================================
-- Table: credits
-- =============================================

create table if not exists public.credits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  balance    integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_credits_user_id on public.credits(user_id);
