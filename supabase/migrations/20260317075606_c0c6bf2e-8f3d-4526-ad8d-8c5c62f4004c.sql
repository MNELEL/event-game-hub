
-- 1. Remove public read on questions (exposes correct_answer)
DROP POLICY IF EXISTS "anyone_read_questions" ON public.questions;

-- 2. Remove stale public write policies on game_settings
DROP POLICY IF EXISTS "Anyone can manage settings" ON public.game_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.game_settings;

-- 3. Fix auth_delete_games: only game creator can delete
DROP POLICY IF EXISTS "auth_delete_games" ON public.games;
CREATE POLICY "Owner can delete games"
  ON public.games FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- 4. Fix auth_delete_players: only game owner can delete players
DROP POLICY IF EXISTS "auth_delete_players" ON public.players;
CREATE POLICY "Game owner can delete players"
  ON public.players FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = players.game_id
        AND games.created_by = auth.uid()
    )
  );

-- 5. Remove public INSERT on player_answers (edge function uses service_role)
DROP POLICY IF EXISTS "Players can submit answers with zero points" ON public.player_answers;

-- 6. Tighten questions: authenticated INSERT/UPDATE/DELETE already exist, add public SELECT without correct_answer via function
-- We keep the existing authenticated SELECT. For the edge function (which uses service_role), it bypasses RLS.

-- 7. Add player name validation
ALTER TABLE public.players
  ADD CONSTRAINT players_name_length
  CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 50);
