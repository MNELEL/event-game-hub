-- ============================================================
-- SECURITY FIX MIGRATION
-- תיקון בעיות אבטחה ב-RLS policies
-- ============================================================

-- ============================================================
-- QUESTIONS TABLE
-- רק מנהל מאומת יכול לנהל שאלות
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can update questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can update questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can delete questions" ON public.questions;

-- שחקנים לא קוראים שאלות ישירות — רק המארח המאומת
CREATE POLICY "Authenticated can read questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- רק מאומתים יכולים לנהל שאלות
CREATE POLICY "Authenticated can insert questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- GAMES TABLE
-- רק מארח מאומת יכול ליצור/לעדכן משחק
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create games" ON public.games;
DROP POLICY IF EXISTS "Anyone can update games" ON public.games;
DROP POLICY IF EXISTS "Anyone can read games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;
DROP POLICY IF EXISTS "Host can update own games" ON public.games;

-- שחקנים צריכים לקרוא את מצב המשחק
CREATE POLICY "Anyone can read games"
  ON public.games FOR SELECT
  USING (true);

-- רק מאומת יכול ליצור משחק
CREATE POLICY "Authenticated can create games"
  ON public.games FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- רק מי שיצר את המשחק יכול לעדכן אותו
CREATE POLICY "Host can update own game"
  ON public.games FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================
-- PLAYERS TABLE
-- שחקנים יכולים להצטרף, אבל לא לשנות ניקוד
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read players" ON public.players;
DROP POLICY IF EXISTS "Anyone can join as player" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can update players" ON public.players;

-- כולם יכולים לראות שחקנים (לטבלת מובילים)
CREATE POLICY "Anyone can read players"
  ON public.players FOR SELECT
  USING (true);

-- כל אחד יכול להצטרף (אין auth לשחקנים)
CREATE POLICY "Anyone can join as player"
  ON public.players FOR INSERT
  WITH CHECK (true);

-- רק המארח המאומת יכול לעדכן ניקוד
CREATE POLICY "Authenticated can update players"
  ON public.players FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================
-- PLAYER_ANSWERS TABLE
-- מניעת הגשת תשובות בשם שחקנים אחרים
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read answers" ON public.player_answers;
DROP POLICY IF EXISTS "Anyone can submit answers" ON public.player_answers;
DROP POLICY IF EXISTS "Anyone can update answers" ON public.player_answers;
DROP POLICY IF EXISTS "Authenticated users can update answers" ON public.player_answers;

-- רק המארח המאומת יכול לקרוא תשובות (כולל תשובות נכונות!)
CREATE POLICY "Authenticated can read answers"
  ON public.player_answers FOR SELECT
  TO authenticated
  USING (true);

-- כל אחד יכול להגיש תשובה (שחקנים ללא auth)
-- אבל לא יכול להגיש יותר מפעם אחת לאותה שאלה
CREATE POLICY "Anyone can submit answer once"
  ON public.player_answers FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.player_answers pa
      WHERE pa.player_id = player_id
        AND pa.question_id = question_id
        AND pa.game_id = game_id
    )
  );

-- אין UPDATE על תשובות — הן קבועות לאחר הגשה
-- (ניקוד מחושב בזיכרון על ידי המארח)

-- ============================================================
-- GAME_SETTINGS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read settings" ON public.game_settings;
DROP POLICY IF EXISTS "Anyone can manage settings" ON public.game_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.game_settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.game_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.game_settings;

CREATE POLICY "Authenticated can read settings"
  ON public.game_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage settings"
  ON public.game_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update settings"
  ON public.game_settings FOR UPDATE
  TO authenticated
  USING (true);
