-- =============================================
-- Table: support_tickets
-- =============================================

create table if not exists public.support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  subject    text not null,
  message    text not null,
  status     text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_st_user_id on public.support_tickets(user_id);
