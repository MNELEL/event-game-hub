DROP POLICY IF EXISTS "auth_read_answers" ON public.player_answers;

CREATE POLICY "Game owner can read player_answers"
ON public.player_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = player_answers.game_id
      AND games.created_by = auth.uid()
  )
);