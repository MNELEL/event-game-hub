
-- Storage bucket for background music files
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-music', 'background-music', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of music files
CREATE POLICY "Public can read background music"
ON storage.objects FOR SELECT
USING (bucket_id = 'background-music');

-- Allow authenticated users to upload/update/delete music
CREATE POLICY "Authenticated can upload background music"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'background-music');

CREATE POLICY "Authenticated can update background music"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'background-music');

CREATE POLICY "Authenticated can delete background music"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'background-music');

-- Table to track uploaded music
CREATE TABLE public.background_music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.background_music ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read background_music"
ON public.background_music FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert background_music"
ON public.background_music FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update background_music"
ON public.background_music FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete background_music"
ON public.background_music FOR DELETE
TO authenticated
USING (true);
