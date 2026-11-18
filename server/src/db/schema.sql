-- PostgreSQL Schema for BuildSmart NG (24-Hour Ephemeral Projects + Market Baselines)
-- Designed to work on local PostgreSQL or Supabase Postgres.

CREATE TABLE IF NOT EXISTS temp_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Nigerian Home Build',
  city TEXT NOT NULL DEFAULT 'abuja',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_temp_projects_expires_at
  ON temp_projects (expires_at);

CREATE TABLE IF NOT EXISTS market_prices (
  city TEXT NOT NULL,
  item_key TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  source_note TEXT NOT NULL DEFAULT '2026 baseline benchmark',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (city, item_key)
);

-- Optional cleanup function if running on Supabase / pg_cron:
-- SELECT cron.schedule('purge-expired-builds', '*/15 * * * *', $$DELETE FROM temp_projects WHERE expires_at <= NOW();$$);
