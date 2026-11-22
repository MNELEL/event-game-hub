
-- 1. Revoke public execute on increment_player_score, grant only to service_role
REVOKE EXECUTE ON FUNCTION public.increment_player_score(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_player_score(uuid, integer) TO service_role;

-- 2. Fix game_settings: drop public write policies, add authenticated-only
DROP POLICY IF EXISTS "Anyone can manage settings" ON public.game_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.game_settings;

CREATE POLICY "Authenticated can manage settings"
  ON public.game_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update settings"
  ON public.game_settings FOR UPDATE
  TO authenticated
  USING (true);
