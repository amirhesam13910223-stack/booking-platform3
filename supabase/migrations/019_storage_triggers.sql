-- =============================================
-- Storage: documents bucket + policies
-- =============================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "storage_docs_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage_docs_select" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage_docs_delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- Trigger: auto-update updated_at
-- =============================================

create or replace function public.fn_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_conversations_updated on public.conversations;
create trigger trg_conversations_updated
  before update on public.conversations
  for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_credits_updated on public.credits;
create trigger trg_credits_updated
  before update on public.credits
  for each row execute function public.fn_set_updated_at();

-- =============================================
-- Trigger: init new user (free plan + credits)
-- =============================================

create or replace function public.fn_init_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_free_plan_id uuid;
begin
  insert into public.credits (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  select id into v_free_plan_id from public.plans where name = 'free' limit 1;

  if v_free_plan_id is not null then
    insert into public.subscriptions (user_id, plan_id, status, started_at, expires_at, auto_renew)
    values (new.id, v_free_plan_id, 'active', now(), now() + interval '100 years', false);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_init_new_user on public.profiles;
create trigger trg_init_new_user
  after insert on public.profiles
  for each row execute function public.fn_init_new_user();
