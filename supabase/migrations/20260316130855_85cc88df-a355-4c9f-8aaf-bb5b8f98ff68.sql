-- 1. Restrict questions table writes to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can update questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can delete questions" ON public.questions;

CREATE POLICY "Authenticated users can insert questions"
  ON public.questions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
  ON public.questions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete questions"
  ON public.questions FOR DELETE TO authenticated USING (true);

-- 2. Prevent score inflation: replace open INSERT policy on player_answers
-- with one that enforces points_earned=0 and correct=false
DROP POLICY IF EXISTS "Anyone can submit answers" ON public.player_answers;

CREATE POLICY "Players can submit answers with zero points"
  ON public.player_answers FOR INSERT TO public
  WITH CHECK (points_earned = 0 AND correct = false);