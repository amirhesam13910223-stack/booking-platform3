-- =============================================
-- Table: generated_content
-- =============================================

create table if not exists public.generated_content (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  template_type text not null,
  input_prompt  text not null,
  output_text   text not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_gc_user_id on public.generated_content(user_id);
