-- =========================================================
-- 1) Players: restrict SELECT to game owner; hide secret_token
-- =========================================================

-- Drop overly-permissive read policy and recreate it scoped to game owner
DROP POLICY IF EXISTS "Authenticated can read players" ON public.players;

CREATE POLICY "Game owner can read players"
ON public.players
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = players.game_id
      AND games.created_by = auth.uid()
  )
);

-- Make sure players_public view is the only path for non-owner reads
GRANT SELECT ON public.players_public TO anon, authenticated;

-- Fully revoke direct read of the secret_token column from clients
REVOKE SELECT (secret_token) ON public.players FROM anon, authenticated;

-- =========================================================
-- 2) Players: replace anonymous INSERT with a safe RPC so
--    players never need direct INSERT...RETURNING access to
--    the secret_token column.
-- =========================================================

DROP POLICY IF EXISTS "Anyone can join lobby games" ON public.players;
REVOKE INSERT ON public.players FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.join_game_by_code(p_code text, p_name text)
RETURNS TABLE (
  player_id uuid,
  secret_token uuid,
  game_id uuid,
  status text,
  current_question_index integer,
  time_remaining integer,
  question_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game public.games%ROWTYPE;
  v_player public.players%ROWTYPE;
  v_clean_name text;
BEGIN
  v_clean_name := btrim(coalesce(p_name, ''));
  IF length(v_clean_name) = 0 OR length(v_clean_name) > 40 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  SELECT * INTO v_game FROM public.games WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_not_found';
  END IF;

  IF v_game.status <> 'lobby' THEN
    RAISE EXCEPTION 'game_not_open';
  END IF;

  INSERT INTO public.players (game_id, name)
  VALUES (v_game.id, v_clean_name)
  RETURNING * INTO v_player;

  player_id := v_player.id;
  secret_token := v_player.secret_token;
  game_id := v_game.id;
  status := v_game.status;
  current_question_index := v_game.current_question_index;
  time_remaining := v_game.time_remaining;
  question_ids := v_game.question_ids;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.join_game_by_code(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_game_by_code(text, text) TO anon, authenticated;

-- =========================================================
-- 3) Branding: add owner_id and scope writes to that owner
-- =========================================================

ALTER TABLE public.branding
  ADD COLUMN IF NOT EXISTS owner_id uuid;

DROP POLICY IF EXISTS "Authenticated can insert branding" ON public.branding;
DROP POLICY IF EXISTS "Authenticated can update branding" ON public.branding;

-- Block direct inserts from clients (single branding row is seeded)
-- (no INSERT policy = no inserts allowed)

-- The first authenticated user to update branding claims ownership
CREATE POLICY "Owner or unclaimed can update branding"
ON public.branding
FOR UPDATE
TO authenticated
USING (owner_id IS NULL OR owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- =========================================================
-- 4) Lock down SECURITY DEFINER helper functions
-- =========================================================

REVOKE EXECUTE ON FUNCTION public.increment_player_score(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
