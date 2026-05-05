
ALTER TABLE public.branding
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS background_image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read branding-assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'branding-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated upload branding-assets"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'branding-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated update branding-assets"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'branding-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated delete branding-assets"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'branding-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
