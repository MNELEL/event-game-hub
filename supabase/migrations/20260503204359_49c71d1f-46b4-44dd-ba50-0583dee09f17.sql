
CREATE TABLE public.phone_players (
  phone TEXT PRIMARY KEY,
  player_id UUID NOT NULL,
  game_id UUID NOT NULL,
  last_question_index INTEGER NOT NULL DEFAULT -1,
  last_answer_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_players ENABLE ROW LEVEL SECURITY;

-- No policies: table is only accessed via SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.join_phone_player(p_phone TEXT)
RETURNS TABLE(
  player_id UUID,
  secret_token UUID,
  game_id UUID,
  status TEXT,
  current_question_index INTEGER,
  time_remaining INTEGER,
  question_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game public.games%ROWTYPE;
  v_player public.players%ROWTYPE;
  v_existing public.phone_players%ROWTYPE;
  v_clean_phone TEXT;
  v_suffix TEXT;
  v_name TEXT;
BEGIN
  v_clean_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF length(v_clean_phone) < 4 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  -- Find the single active game
  SELECT * INTO v_game FROM public.games
  WHERE status IN ('lobby', 'playing', 'question', 'results', 'leaderboard')
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_active_game';
  END IF;

  -- Existing mapping for the same active game?
  SELECT * INTO v_existing FROM public.phone_players WHERE phone = v_clean_phone;
  IF FOUND AND v_existing.game_id = v_game.id THEN
    SELECT * INTO v_player FROM public.players WHERE id = v_existing.player_id;
    IF FOUND THEN
      player_id := v_player.id;
      secret_token := v_player.secret_token;
      game_id := v_game.id;
      status := v_game.status;
      current_question_index := v_game.current_question_index;
      time_remaining := v_game.time_remaining;
      question_ids := v_game.question_ids;
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  -- Create new player
  v_suffix := right(v_clean_phone, 4);
  v_name := 'מתקשר ' || v_suffix;

  INSERT INTO public.players (game_id, name)
  VALUES (v_game.id, v_name)
  RETURNING * INTO v_player;

  INSERT INTO public.phone_players (phone, player_id, game_id, last_question_index)
  VALUES (v_clean_phone, v_player.id, v_game.id, -1)
  ON CONFLICT (phone) DO UPDATE
    SET player_id = EXCLUDED.player_id,
        game_id = EXCLUDED.game_id,
        last_question_index = -1,
        last_answer_at = NULL;

  player_id := v_player.id;
  secret_token := v_player.secret_token;
  game_id := v_game.id;
  status := v_game.status;
  current_question_index := v_game.current_question_index;
  time_remaining := v_game.time_remaining;
  question_ids := v_game.question_ids;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_phone_answer(
  p_phone TEXT,
  p_question_index INTEGER,
  p_answer INTEGER
)
RETURNS TABLE(accepted BOOLEAN, correct BOOLEAN, points INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_phone TEXT;
  v_pp public.phone_players%ROWTYPE;
  v_game public.games%ROWTYPE;
  v_question public.questions%ROWTYPE;
  v_qid UUID;
  v_correct BOOLEAN;
  v_points INTEGER := 0;
BEGIN
  v_clean_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF p_answer < 1 OR p_answer > 4 THEN
    accepted := false; correct := false; points := 0; RETURN NEXT; RETURN;
  END IF;

  SELECT * INTO v_pp FROM public.phone_players WHERE phone = v_clean_phone;
  IF NOT FOUND THEN
    accepted := false; correct := false; points := 0; RETURN NEXT; RETURN;
  END IF;

  SELECT * INTO v_game FROM public.games WHERE id = v_pp.game_id;
  IF NOT FOUND OR v_game.status <> 'question' OR v_game.current_question_index <> p_question_index THEN
    accepted := false; correct := false; points := 0; RETURN NEXT; RETURN;
  END IF;

  IF v_pp.last_question_index >= p_question_index THEN
    accepted := false; correct := false; points := 0; RETURN NEXT; RETURN;
  END IF;

  IF p_question_index < 0 OR p_question_index >= array_length(v_game.question_ids, 1) THEN
    accepted := false; correct := false; points := 0; RETURN NEXT; RETURN;
  END IF;

  v_qid := v_game.question_ids[p_question_index + 1];
  SELECT * INTO v_question FROM public.questions WHERE id = v_qid;
  IF NOT FOUND THEN
    accepted := false; correct := false; points := 0; RETURN NEXT; RETURN;
  END IF;

  v_correct := (v_question.correct_answer = (p_answer - 1));
  IF v_correct THEN
    v_points := v_question.points;
    UPDATE public.players SET score = score + v_points WHERE id = v_pp.player_id;
  END IF;

  INSERT INTO public.player_answers (player_id, game_id, question_id, answer, correct, time_taken, points_earned)
  VALUES (v_pp.player_id, v_game.id, v_qid, p_answer - 1, v_correct, 0, v_points);

  UPDATE public.phone_players
  SET last_question_index = p_question_index, last_answer_at = now()
  WHERE phone = v_clean_phone;

  accepted := true; correct := v_correct; points := v_points;
  RETURN NEXT;
END;
$$;
