-- Allow game owner to delete player_answers for their games
CREATE POLICY "Game owner can delete player_answers"
  ON public.player_answers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = player_answers.game_id
        AND games.created_by = auth.uid()
    )
  );