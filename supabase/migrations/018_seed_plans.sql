-- =============================================
-- Seed: Free / Pro / Ultra plans (exact spec values)
-- =============================================

insert into public.plans (
  name, price_toman, price_yearly_toman, billing_period,
  daily_message_limit, monthly_document_limit, monthly_content_limit,
  code_assistant_access, priority_queue
) values
  ('free',  0,      0,       'monthly', 15,   3,  5,  false, false),
  ('pro',   149000, 1490000, 'monthly', 200,  50, -1, true,  true),
  ('ultra', 349000, 3490000, 'monthly', 1500, -1, -1, true,  true)
on conflict (name) do nothing;
