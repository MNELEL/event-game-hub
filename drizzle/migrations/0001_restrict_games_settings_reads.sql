DROP POLICY IF EXISTS "Anyone can read settings" ON public.game_settings;
CREATE POLICY "Owner can read settings" ON public.game_settings FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read games" ON public.games;
CREATE POLICY "Anyone can read active games" ON public.games FOR SELECT TO anon, authenticated USING (status <> 'finished');
CREATE POLICY "Host can read own games" ON public.games FOR SELECT TO authenticated USING (created_by = auth.uid());