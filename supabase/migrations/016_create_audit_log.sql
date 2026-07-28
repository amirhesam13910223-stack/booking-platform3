-- =============================================
-- Table: audit_log
-- =============================================

create table if not exists public.audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_id       uuid not null references auth.users(id),
  action         text not null,
  target_user_id uuid references auth.users(id),
  details        jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists idx_al_actor_id   on public.audit_log(actor_id);
create index if not exists idx_al_action     on public.audit_log(action);
create index if not exists idx_al_created_at on public.audit_log(created_at desc);
