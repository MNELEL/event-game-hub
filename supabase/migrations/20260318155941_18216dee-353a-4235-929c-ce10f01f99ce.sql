-- 1. Remove public read on player_answers, keep authenticated only
DROP POLICY IF EXISTS "Anyone can read answers" ON public.player_answers;

-- 2. Tighten player join: only allow joining games in lobby status
DROP POLICY IF EXISTS "Anyone can join as player" ON public.players;
CREATE POLICY "Anyone can join lobby games"
  ON public.players FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = players.game_id
        AND games.status = 'lobby'
    )
  );

-- 3. Remove duplicate SELECT policies
DROP POLICY IF EXISTS "anyone_read_players" ON public.players;
DROP POLICY IF EXISTS "anyone_read_games" ON public.games;
DROP POLICY IF EXISTS "anyone_read_settings" ON public.game_settings;