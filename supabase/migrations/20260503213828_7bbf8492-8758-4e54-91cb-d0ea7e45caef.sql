-- =====================================================
-- 1) PLAYERS: remove ability to read secret_token
-- =====================================================
REVOKE SELECT (secret_token) ON public.players FROM anon, authenticated;

-- Make sure the safe view still excludes it and is readable
CREATE OR REPLACE VIEW public.players_public
WITH (security_invoker = on) AS
  SELECT id, game_id, name, score, connected, created_at
  FROM public.players;

GRANT SELECT ON public.players_public TO anon, authenticated;

-- =====================================================
-- 2) BACKGROUND_MUSIC: scope writes to uploader
-- =====================================================
DROP POLICY IF EXISTS "Authenticated can insert background_music" ON public.background_music;
DROP POLICY IF EXISTS "Authenticated can update background_music" ON public.background_music;
DROP POLICY IF EXISTS "Authenticated can delete background_music" ON public.background_music;

ALTER TABLE public.background_music
  ALTER COLUMN uploaded_by SET NOT NULL;

CREATE POLICY "Uploader can insert background_music"
  ON public.background_music FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Uploader can update own background_music"
  ON public.background_music FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Uploader can delete own background_music"
  ON public.background_music FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

-- =====================================================
-- 3) STORAGE bucket "background-music": scope writes to owner
-- =====================================================
DROP POLICY IF EXISTS "Authenticated can upload background music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update background music" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete background music" ON storage.objects;

CREATE POLICY "Owner can upload background music"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'background-music' AND owner = auth.uid());

CREATE POLICY "Owner can update background music"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'background-music' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'background-music' AND owner = auth.uid());

CREATE POLICY "Owner can delete background music"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'background-music' AND owner = auth.uid());

-- =====================================================
-- 4) BRANDING: only owner can update; add claim function
-- =====================================================
DROP POLICY IF EXISTS "Owner or unclaimed can update branding" ON public.branding;

CREATE POLICY "Owner can update branding"
  ON public.branding FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- One-time claim function: the first admin to call this owns the branding row.
CREATE OR REPLACE FUNCTION public.claim_branding(p_branding_id uuid)
RETURNS public.branding
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.branding%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_row FROM public.branding WHERE id = p_branding_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'branding_not_found';
  END IF;

  IF v_row.owner_id IS NOT NULL AND v_row.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'already_claimed';
  END IF;

  UPDATE public.branding
     SET owner_id = auth.uid(), updated_at = now()
   WHERE id = p_branding_id
   RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_branding(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_branding(uuid) TO authenticated;