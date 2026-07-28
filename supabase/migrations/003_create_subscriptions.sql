-- =============================================
-- Table: subscriptions
-- =============================================

create table if not exists public.subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  plan_id    uuid not null references public.plans(id),
  status     text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_subs_user_id    on public.subscriptions(user_id);
create index if not exists idx_subs_status     on public.subscriptions(status);
create index if not exists idx_subs_expires_at on public.subscriptions(expires_at);
