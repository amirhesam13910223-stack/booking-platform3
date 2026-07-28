-- =============================================
-- Table: usage_logs + helper functions
-- =============================================

create table if not exists public.usage_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('message', 'document', 'content')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_ul_user_id             on public.usage_logs(user_id);
create index if not exists idx_ul_action_type         on public.usage_logs(action_type);
create index if not exists idx_ul_user_action_created on public.usage_logs(user_id, action_type, created_at desc);

-- Helper: count today's usage
create or replace function public.get_daily_usage_count(p_user_id uuid, p_action_type text)
returns integer language sql stable security definer as $$
  select count(*)::integer from public.usage_logs
  where user_id = p_user_id and action_type = p_action_type
    and created_at >= date_trunc('day', now());
$$;

-- Helper: count this month's usage
create or replace function public.get_monthly_usage_count(p_user_id uuid, p_action_type text)
returns integer language sql stable security definer as $$
  select count(*)::integer from public.usage_logs
  where user_id = p_user_id and action_type = p_action_type
    and created_at >= date_trunc('month', now());
$$;
