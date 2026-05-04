ALTER TABLE public.phone_players
  ADD COLUMN IF NOT EXISTS last_poll_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_seen_question_index INTEGER;