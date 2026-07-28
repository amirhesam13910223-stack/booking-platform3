-- =============================================
-- Table: conversations
-- =============================================

create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null default 'گفتگوی جدید',
  module     text not null default 'chat' check (module in ('chat', 'code')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conv_user_id on public.conversations(user_id);
create index if not exists idx_conv_module  on public.conversations(module);
