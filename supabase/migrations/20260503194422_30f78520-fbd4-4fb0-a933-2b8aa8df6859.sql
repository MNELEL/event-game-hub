CREATE TABLE public.branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'חיוש בת מצוה',
  full_name text NOT NULL DEFAULT 'חיוש בת מצוה - משחק טריוויה אינטראקטיבי',
  short_name text NOT NULL DEFAULT 'חיוש בת מצוה',
  phone text NOT NULL DEFAULT '03-7737970',
  icon_primary text NOT NULL DEFAULT '👑',
  icon_festive text NOT NULL DEFAULT '👑✨🎀',
  tagline text NOT NULL DEFAULT 'חידון אינטראקטיבי מיוחד לכבוד בת המצווה',
  hero_subtitle text NOT NULL DEFAULT 'כמה אתם מכירים את חיוש?',
  about_description text NOT NULL DEFAULT 'חיוש בת מצוה הוא חידון אינטראקטיבי מיוחד לכבוד בת המצווה — שאלות על חיוש,',
  lobby_subtitle text NOT NULL DEFAULT 'חידון לכבוד בת המצווה',
  is_active boolean NOT NULL DEFAULT true UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read branding"
  ON public.branding FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert branding"
  ON public.branding FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update branding"
  ON public.branding FOR UPDATE
  TO authenticated
  USING (true);

CREATE TRIGGER update_branding_updated_at
  BEFORE UPDATE ON public.branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.branding (is_active) VALUES (true);