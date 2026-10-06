DROP POLICY IF EXISTS "Authenticated can upload background music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update background music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete background music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "demo-media authed insert" ON storage.objects;
DROP POLICY IF EXISTS "demo-media authed update" ON storage.objects;
DROP POLICY IF EXISTS "demo-media authed delete" ON storage.objects;

DROP POLICY IF EXISTS "Owner can upload background music" ON storage.objects;
DROP POLICY IF EXISTS "Owner can update background music" ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete background music" ON storage.objects;
DROP POLICY IF EXISTS "Owner upload branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner update branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "demo-media owner insert" ON storage.objects;
DROP POLICY IF EXISTS "demo-media owner update" ON storage.objects;
DROP POLICY IF EXISTS "demo-media owner delete" ON storage.objects;

CREATE POLICY "Owner can upload background music" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'background-music' AND owner = auth.uid());
CREATE POLICY "Owner can update background music" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'background-music' AND owner = auth.uid()) WITH CHECK (bucket_id = 'background-music' AND owner = auth.uid());
CREATE POLICY "Owner can delete background music" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'background-music' AND owner = auth.uid());
CREATE POLICY "Owner upload branding-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding-assets' AND owner = auth.uid());
CREATE POLICY "Owner update branding-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding-assets' AND owner = auth.uid()) WITH CHECK (bucket_id = 'branding-assets' AND owner = auth.uid());
CREATE POLICY "Owner delete branding-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding-assets' AND owner = auth.uid());
CREATE POLICY "demo-media owner insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'demo-media' AND owner = auth.uid());
CREATE POLICY "demo-media owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'demo-media' AND owner = auth.uid()) WITH CHECK (bucket_id = 'demo-media' AND owner = auth.uid());
CREATE POLICY "demo-media owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'demo-media' AND owner = auth.uid());