
-- Drop all restrictive policies and recreate as permissive

-- questions table
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can update questions" ON public.questions;

CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update questions" ON public.questions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete questions" ON public.questions FOR DELETE USING (true);

-- games table
DROP POLICY IF EXISTS "Anyone can read games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;

CREATE POLICY "Anyone can read games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Anyone can create games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON public.games FOR UPDATE USING (true);

-- players table
DROP POLICY IF EXISTS "Anyone can join as player" ON public.players;
DROP POLICY IF EXISTS "Anyone can read players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can update players" ON public.players;

CREATE POLICY "Anyone can read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can join as player" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE USING (true);

-- player_answers table
DROP POLICY IF EXISTS "Anyone can read answers" ON public.player_answers;
DROP POLICY IF EXISTS "Anyone can submit answers" ON public.player_answers;
DROP POLICY IF EXISTS "Authenticated users can update answers" ON public.player_answers;

CREATE POLICY "Anyone can read answers" ON public.player_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can submit answers" ON public.player_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update answers" ON public.player_answers FOR UPDATE USING (true);

-- game_settings table
DROP POLICY IF EXISTS "Anyone can read settings" ON public.game_settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.game_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.game_settings;

CREATE POLICY "Anyone can read settings" ON public.game_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can manage settings" ON public.game_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.game_settings FOR UPDATE USING (true);
