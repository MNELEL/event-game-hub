
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.join_phone_player(p_phone text)
 RETURNS TABLE(player_id uuid, secret_token uuid, game_id uuid, status text, current_question_index integer, time_remaining integer, question_ids uuid[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_game public.games%ROWTYPE;
  v_player public.players%ROWTYPE;
  v_existing public.phone_players%ROWTYPE;
  v_clean_phone TEXT;
  v_suffix TEXT;
  v_name TEXT;
  v_in_lobby BOOLEAN;
  v_reason TEXT;
  v_outcome TEXT;
BEGIN
  v_clean_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF length(v_clean_phone) < 4 THEN
    INSERT INTO public.join_phone_player_audit
      (phone_tail, game_id, game_status, start_at, joined_in_lobby, reason, outcome)
    VALUES (right(coalesce(v_clean_phone, ''), 4), NULL, NULL, NULL, false,
            'rejected: invalid_phone (len<4)', 'invalid_phone');
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  SELECT g.* INTO v_game FROM public.games g
  WHERE g.status IN ('lobby', 'playing', 'question', 'results', 'leaderboard')
  ORDER BY g.updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.join_phone_player_audit
      (phone_tail, game_id, game_status, start_at, joined_in_lobby, reason, outcome)
    VALUES (right(v_clean_phone, 4), NULL, NULL, NULL, false,
            'rejected: no_active_game', 'no_active_game');
    RAISE EXCEPTION 'no_active_game';
  END IF;

  SELECT pp.* INTO v_existing FROM public.phone_players pp WHERE pp.phone = v_clean_phone;
  IF FOUND AND v_existing.game_id = v_game.id THEN
    SELECT pl.* INTO v_player FROM public.players pl WHERE pl.id = v_existing.player_id;
    IF FOUND THEN
      INSERT INTO public.join_phone_player_audit
        (phone_tail, game_id, game_status, start_at, joined_in_lobby, reason, outcome)
      VALUES (right(v_clean_phone, 4), v_game.id, v_game.status, v_game.start_at,
              v_existing.joined_in_lobby,
              'returning caller, keeping joined_in_lobby=' || v_existing.joined_in_lobby,
              'returning');
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

  -- New rule: callers can join at any phase until the host locks the game.
  v_in_lobby := NOT COALESCE(v_game.locked, false);

  IF v_in_lobby THEN
    v_reason := 'eligible: game unlocked, status=' || v_game.status;
    v_outcome := 'eligible';
  ELSE
    v_reason := 'late: game locked by host';
    v_outcome := 'locked';
  END IF;

  INSERT INTO public.join_phone_player_audit
    (phone_tail, game_id, game_status, start_at, joined_in_lobby, reason, outcome)
  VALUES (right(v_clean_phone, 4), v_game.id, v_game.status, v_game.start_at,
          v_in_lobby, v_reason, v_outcome);

  v_suffix := right(v_clean_phone, 4);
  v_name := 'מתקשר ' || v_suffix;

  INSERT INTO public.players (game_id, name)
  VALUES (v_game.id, v_name)
  RETURNING * INTO v_player;

  INSERT INTO public.phone_players (phone, player_id, game_id, last_question_index, joined_in_lobby)
  VALUES (v_clean_phone, v_player.id, v_game.id, -1, v_in_lobby)
  ON CONFLICT (phone) DO UPDATE
    SET player_id = EXCLUDED.player_id,
        game_id = EXCLUDED.game_id,
        last_question_index = -1,
        last_answer_at = NULL,
        joined_in_lobby = EXCLUDED.joined_in_lobby;

  player_id := v_player.id;
  secret_token := v_player.secret_token;
  game_id := v_game.id;
  status := v_game.status;
  current_question_index := v_game.current_question_index;
  time_remaining := v_game.time_remaining;
  question_ids := v_game.question_ids;
  RETURN NEXT;
END;
$function$;
