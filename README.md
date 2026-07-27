# AIHub - Persian AI SaaS Platform

Persian-language (Farsi) AI SaaS platform with Freemium subscription model. Full RTL support, Vazirmatn font, Jalali calendar.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark-mode, RTL) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Payments | ZarinPal (Toman) |
| SMS/OTP | Kavenegar / SMS.ir |
| AI | Claude API / OpenAI API (server-side) |

## Database (16 Tables, RLS Enabled)

| # | Table | Description |
|---|-------|-------------|
| 1 | profiles | User profiles with referral codes |
| 2 | plans | Free/Pro/Ultra definitions (public) |
| 3 | subscriptions | User subscription records |
| 4 | credits | Bonus credit balance |
| 5 | credit_transactions | Credit ledger + auto-balance trigger |
| 6 | conversations | Chat and code threads |
| 7 | messages | Messages with feedback |
| 8 | uploaded_files | Document upload tracking |
| 9 | generated_content | AI-generated content |
| 10 | usage_logs | Daily/monthly quota tracking |
| 11 | referrals | Referral relationships |
| 12 | payments | ZarinPal transactions |
| 13 | notifications | In-app notifications |
| 14 | support_tickets | Support requests |
| 15 | otp_codes | Temporary OTP codes |
| 16 | audit_log | Admin action trail |

## Plans
| Plan | Price | Msg/day | Docs/mo | Content/mo | Code Assistant |
|------|-------|---------|----------|-----------|---------------|
| Free | 0 | 15 | 3 | 5 | No |
| Pro | 149,000 | 200 | 50 | Unlimited | Yes |
| Ultra | 349,000 | 1,500 | Unlimited | Unlimited | Yes |

## Build Phases
- [x] Phase 1 - Scaffold + Supabase DB (16 tables + RLS)
- [ ] Phase 2 - Auth (OTP + Google) + onboarding
- [ ] Phase 3 - Chat module
- [ ] Phase 4 - Billing + ZarinPal
- [ ] Phase 5 - Documents, content, code assistant
- [ ] Phase 6 - Referrals + notifications
- [ ] Phase 7 - Admin + support + legal
- [ ] Phase 8 - PWA + analytics + deletion

## Security
- All secrets stored as Supabase Secrets (never in frontend)
- Quotas enforced server-side via check-quota Edge Function
- OTP rate-limited per phone + per IP
- File uploads validated (MIME type + size)
- All admin actions logged to audit_log
- XSS sanitization on all user-generated content
