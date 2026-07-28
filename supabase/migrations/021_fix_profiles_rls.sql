-- =============================================
-- Migration 021: Secure referral lookup (Phase 2 hotfix)
-- ─────────────────────────────────────────────────────────
-- Problem:
--   The previous "profiles_select_referral" policy with using(true)
--   exposed all profile columns (including signup_ip) to any user.
--
-- Solution:
--   Remove the public policy and use a SECURITY DEFINER function
--   for referral code verification. This function runs with elevated
--   privileges but only returns the minimum required data.
--
-- Note: Edge Functions use service_role which bypasses RLS entirely,
--   so they can still read full profile data when needed.
-- =============================================

-- Drop the overly permissive policy
drop policy if exists "profiles_select_referral" on public.profiles;

-- Create a secure function for referral code verification
-- Security definer means it runs with the creator's privileges
-- Only returns (id, referral_code) - no sensitive data exposed
create or replace function public.verify_referral_code(p_code text)
returns table (id uuid, referral_code text)
language sql
security definer
set search_path = public, pg_temp
as $$
  select id, referral_code
  from public.profiles
  where referral_code = p_code
  limit 1;
$$;

-- Grant execute to anon and authenticated (not service_role - it doesn't need it)
grant execute on function public.verify_referral_code(text) to anon;
grant execute on function public.verify_referral_code(text) to authenticated;

-- ─── Verify: RLS policies on profiles ─────────────────
-- After this fix, profiles should have:
--   1. profiles_select_own (user sees only their own row)
--   2. profiles_insert_own (user can only insert their own row)
--   3. profiles_update_own (user can only update their own row)
-- No public access to profiles table directly.
-- Referral lookup is done through the secure verify_referral_code function.

-- ─── Audit log entry ───────────────────────────────────
-- (This migration was applied as a security hotfix for Phase 2)
