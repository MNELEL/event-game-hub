DROP POLICY IF EXISTS "Anyone can read background_music" ON public.background_music;
CREATE POLICY "Anyone can read active background_music" ON public.background_music FOR SELECT TO anon, authenticated USING (is_active = true OR uploaded_by = auth.uid());
DROP POLICY IF EXISTS "Anyone can read branding" ON public.branding;
CREATE POLICY "Anyone can read active branding" ON public.branding FOR SELECT TO anon, authenticated USING (is_active = true OR owner_id = auth.uid());
DROP POLICY IF EXISTS "Public read branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "demo-media public read" ON storage.objects;
DROP POLICY IF EXISTS "Public can read background music" ON storage.objects;