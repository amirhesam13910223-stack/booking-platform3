-- =============================================
-- Table: profiles
-- Description: User profiles linked to auth.users
-- =============================================

create table if not exists public.profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  phone_number              text unique,
  full_name                 text,
  avatar_url                text,
  referral_code             text not null unique default substr(md5(random()::text), 1, 6),
  referred_by               text references public.profiles(referral_code),
  is_suspended              boolean not null default false,
  signup_ip                 text,
  signup_device_fingerprint text,
  created_at                timestamptz not null default now()
);

create index if not exists idx_profiles_referral_code on public.profiles(referral_code);
create index if not exists idx_profiles_referred_by   on public.profiles(referred_by);
create index if not exists idx_profiles_phone_number  on public.profiles(phone_number);
