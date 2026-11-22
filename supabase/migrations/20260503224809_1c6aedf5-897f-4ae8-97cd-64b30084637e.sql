-- background-music: drop redundant broad policies
DROP POLICY IF EXISTS "Authenticated can upload background music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update background music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete background music" ON storage.objects;

-- branding-assets: drop broad policies
DROP POLICY IF EXISTS "Authenticated upload branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update branding-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete branding-assets" ON storage.objects;

-- branding-assets: add owner-scoped policies
CREATE POLICY "Owner upload branding-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding-assets' AND owner = auth.uid());

CREATE POLICY "Owner update branding-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'branding-assets' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'branding-assets' AND owner = auth.uid());

CREATE POLICY "Owner delete branding-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'branding-assets' AND owner = auth.uid());