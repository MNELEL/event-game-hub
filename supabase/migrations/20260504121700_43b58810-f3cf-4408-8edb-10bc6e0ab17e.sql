-- Drop public SELECT policies that allowed clients to list files in public buckets.
-- Public URL access (CDN) does not depend on these policies and continues to work.
DROP POLICY IF EXISTS "Public can read background music" ON storage.objects;
DROP POLICY IF EXISTS "Public read branding-assets" ON storage.objects;