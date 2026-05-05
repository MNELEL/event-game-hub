CREATE POLICY "Game owner can read phone_players"
ON public.phone_players
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.games g
  WHERE g.id = phone_players.game_id AND g.created_by = auth.uid()
));