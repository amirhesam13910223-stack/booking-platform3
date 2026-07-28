-- =============================================
-- Row Level Security Policies (all 16 tables)
-- =============================================

-- Enable RLS
alter table public.profiles            enable row level security;
alter table public.plans               enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.credits             enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.uploaded_files      enable row level security;
alter table public.generated_content   enable row level security;
alter table public.usage_logs          enable row level security;
alter table public.referrals           enable row level security;
alter table public.payments            enable row level security;
alter table public.notifications       enable row level security;
alter table public.support_tickets     enable row level security;
alter table public.otp_codes           enable row level security;
alter table public.audit_log           enable row level security;

-- ─── profiles ───────────────────────────────
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No public read policy for profiles.
-- Referral code lookups are done through the secure
-- public.verify_referral_code(text) function (added in migration 021).
-- service_role bypasses RLS for admin operations.

-- ─── plans (public) ─────────────────────────
create policy "plans_select_public" on public.plans
  for select using (true);

-- ─── subscriptions ──────────────────────────
create policy "subs_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "subs_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);

create policy "subs_update_own" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── credits ────────────────────────────────
create policy "credits_select_own" on public.credits
  for select using (auth.uid() = user_id);

create policy "credits_insert_own" on public.credits
  for insert with check (auth.uid() = user_id);

create policy "credits_update_own" on public.credits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── credit_transactions ────────────────────
create policy "ctx_select_own" on public.credit_transactions
  for select using (auth.uid() = user_id);
-- Insert via service_role only (Edge Functions)

-- ─── conversations ──────────────────────────
create policy "conv_select_own" on public.conversations
  for select using (auth.uid() = user_id);

create policy "conv_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);

create policy "conv_update_own" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "conv_delete_own" on public.conversations
  for delete using (auth.uid() = user_id);

-- ─── messages (via parent conversation) ─────
create policy "msg_select_own" on public.messages
  for select using (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "msg_insert_own" on public.messages
  for insert with check (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "msg_update_own" on public.messages
  for update using (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid())
  );

-- ─── uploaded_files ─────────────────────────
create policy "files_select_own" on public.uploaded_files
  for select using (auth.uid() = user_id);

create policy "files_insert_own" on public.uploaded_files
  for insert with check (auth.uid() = user_id);

create policy "files_delete_own" on public.uploaded_files
  for delete using (auth.uid() = user_id);

-- ─── generated_content ──────────────────────
create policy "gc_select_own" on public.generated_content
  for select using (auth.uid() = user_id);

create policy "gc_insert_own" on public.generated_content
  for insert with check (auth.uid() = user_id);

create policy "gc_delete_own" on public.generated_content
  for delete using (auth.uid() = user_id);

-- ─── usage_logs ─────────────────────────────
create policy "ul_select_own" on public.usage_logs
  for select using (auth.uid() = user_id);
-- Insert via service_role only (Edge Functions)

-- ─── referrals ──────────────────────────────
create policy "ref_select_own" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);
-- Insert via service_role only (process-referral)

-- ─── payments ───────────────────────────────
create policy "pay_select_own" on public.payments
  for select using (auth.uid() = user_id);
-- Insert via service_role only (zarinpal functions)

-- ─── notifications ──────────────────────────
create policy "not_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "not_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Insert via service_role only (backend logic)

-- ─── support_tickets ────────────────────────
create policy "st_select_own" on public.support_tickets
  for select using (auth.uid() = user_id);

create policy "st_insert_own" on public.support_tickets
  for insert with check (auth.uid() = user_id);

-- ─── otp_codes ──────────────────────────────
-- No user policies: managed entirely by service_role.
-- RLS enabled + no policy = all user access denied (secure by default).

-- ─── audit_log ──────────────────────────────
-- No user policies: managed entirely by service_role (admin functions).
-- RLS enabled + no policy = all user access denied (secure by default).
