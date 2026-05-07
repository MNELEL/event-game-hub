DROP POLICY IF EXISTS "demo-media authed insert" ON storage.objects;
DROP POLICY IF EXISTS "demo-media authed update" ON storage.objects;
DROP POLICY IF EXISTS "demo-media authed delete" ON storage.objects;

CREATE POLICY "demo-media owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'demo-media' AND owner = auth.uid());

CREATE POLICY "demo-media owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'demo-media' AND owner = auth.uid())
WITH CHECK (bucket_id = 'demo-media' AND owner = auth.uid());

CREATE POLICY "demo-media owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'demo-media' AND owner = auth.uid());