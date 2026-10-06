ALTER TABLE public.branding ADD COLUMN IF NOT EXISTS event_at timestamptz;
ALTER TABLE public.branding ADD COLUMN IF NOT EXISTS music_lead_minutes integer NOT NULL DEFAULT 10;