-- =============================================
-- Table: uploaded_files
-- =============================================

create table if not exists public.uploaded_files (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  file_name        text not null,
  storage_path     text not null,
  file_type        text not null,
  file_size_bytes  bigint not null check (file_size_bytes > 0),
  analysis_summary text,
  status           text not null default 'processing' check (status in ('processing', 'done', 'failed')),
  created_at       timestamptz not null default now()
);

create index if not exists idx_uf_user_id on public.uploaded_files(user_id);
create index if not exists idx_uf_status  on public.uploaded_files(status);
