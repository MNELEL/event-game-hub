
-- Drop the security definer view
DROP VIEW IF EXISTS public.players_public;

-- Recreate as security invoker view (default, no SECURITY DEFINER)
CREATE VIEW public.players_public WITH (security_invoker = true) AS
  SELECT id, game_id, name, score, connected, created_at
  FROM public.players;
