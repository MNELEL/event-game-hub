ALTER TABLE public.game_settings
  ADD COLUMN IF NOT EXISTS lobby_grace_seconds integer NOT NULL DEFAULT 0;