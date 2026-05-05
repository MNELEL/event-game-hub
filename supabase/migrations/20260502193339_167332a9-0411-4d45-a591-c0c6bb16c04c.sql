-- 1) Restrict players SELECT to authenticated only (hides secret_token from anon).
DROP POLICY IF EXISTS "Anyone can read players" ON public.players;
CREATE POLICY "Authenticated can read players"
  ON public.players FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous (public) reads via the safe view that excludes secret_token.
GRANT SELECT ON public.players_public TO anon, authenticated;

-- 2) Restrict questions SELECT to the owner only (prevents authenticated users from
-- seeing correct_answer for questions they don't own).
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;
CREATE POLICY "Owner can read questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());