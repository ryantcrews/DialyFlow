-- Seed dialysis units
INSERT INTO units (name) VALUES
  ('West Iredell WFB'),
  ('Wilkesboro WFB'),
  ('Davie WFB'),
  ('Statesville WFB'),
  ('Lake Norman WFB'),
  ('Taylorsville FMC');

-- Default admin: admin@dialyrounds.local / ChangeMe123!
-- Password hash generated with PBKDF2-SHA256, 100000 iterations
-- Run `npm run db:seed:local` after migrations; this file is applied via wrangler d1 execute
-- The hash below is a placeholder - seed.ts in worker bootstrap will create admin if missing
