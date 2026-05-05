ALTER TABLE public.yemot_credentials
  ADD COLUMN IF NOT EXISTS extension TEXT,
  ADD COLUMN IF NOT EXISTS last_setup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_setup_path TEXT;