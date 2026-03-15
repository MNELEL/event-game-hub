
-- 1. GAMES: Restrict INSERT to authenticated, UPDATE to game host only
DROP POLICY "Anyone can create games" ON games;
CREATE POLICY "Authenticated users can create games" ON games FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY "Anyone can update games" ON games;
CREATE POLICY "Host can update own games" ON games FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- 2. PLAYER_ANSWERS: Remove UPDATE policy (not needed, scoring is in-memory)
DROP POLICY "Anyone can update answers" ON player_answers;

-- 3. PLAYERS: Remove UPDATE policy (score tracked in host memory)
DROP POLICY "Anyone can update players" ON players;

-- 4. QUESTIONS: Restrict SELECT to authenticated only (players never read directly)
DROP POLICY "Anyone can read questions" ON questions;
CREATE POLICY "Authenticated users can read questions" ON questions FOR SELECT TO authenticated USING (true);
