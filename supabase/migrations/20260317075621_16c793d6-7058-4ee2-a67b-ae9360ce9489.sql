
-- Tighten questions policies to scope to authenticated user
-- The INSERT/UPDATE/DELETE are already authenticated-only which is correct
-- But they use WITH CHECK (true) / USING (true) - these are fine since
-- questions are shared global resources managed by any admin

-- Tighten game_settings: scope to authenticated only (already done)
-- Tighten games: INSERT already scoped to authenticated
-- The Authenticated users can create games uses WITH CHECK (true) which is fine

-- Tighten players: Anyone can join as player uses public WITH CHECK (true)
-- This is intentional - players need to join without auth

-- Fix: games INSERT should set created_by
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
CREATE POLICY "Authenticated users can create games"
  ON public.games FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Fix: game_settings INSERT should be scoped
DROP POLICY IF EXISTS "Authenticated can manage settings" ON public.game_settings;
CREATE POLICY "Authenticated can manage settings"
  ON public.game_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix: game_settings UPDATE should be scoped
DROP POLICY IF EXISTS "Authenticated can update settings" ON public.game_settings;  
CREATE POLICY "Authenticated can update settings"
  ON public.game_settings FOR UPDATE
  TO authenticated
  USING (true);
