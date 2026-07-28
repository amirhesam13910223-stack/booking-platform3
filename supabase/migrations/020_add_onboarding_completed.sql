-- =============================================
-- Migration 020: Add onboarding_completed to profiles
-- Phase 2: Authentication & Onboarding
-- =============================================

-- اضافه کردن ستون onboarding_completed
-- برای کاربرانی که قبلاً ثبت‌نام کرده‌اند، true در نظر گرفته می‌شود
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default true;

-- برای کاربرانی که از این لحظه به بعد ثبت‌نام می‌کنند،
-- مقدار پیش‌فرض false خواهد بود (از طریق trigger یا کد اپلیکیشن)
-- اما برای سازگاری با کاربران موجود، default = true

-- آپدیت RLS: اجازه آپدیت onboarding_completed توسط خود کاربر
-- (سیاست‌های RLS در migration 017 تنظیم شده‌اند)
