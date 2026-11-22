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
  v_status_ok BOOLEAN;
  v_grace_ok BOOLEAN;
  v_reason TEXT;
BEGIN
  v_clean_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF length(v_clean_phone) < 4 THEN
    RAISE LOG '[join_phone_player] phone=%* rejected: invalid_phone (len<4)',
      right(coalesce(v_clean_phone, ''), 4);
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  SELECT * INTO v_game FROM public.games
  WHERE status IN ('lobby', 'playing', 'question', 'results', 'leaderboard')
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE LOG '[join_phone_player] phone=*%s rejected: no_active_game',
      right(v_clean_phone, 4);
    RAISE EXCEPTION 'no_active_game';
  END IF;

  SELECT * INTO v_existing FROM public.phone_players WHERE phone = v_clean_phone;
  IF FOUND AND v_existing.game_id = v_game.id THEN
    SELECT * INTO v_player FROM public.players WHERE id = v_existing.player_id;
    IF FOUND THEN
      RAISE LOG '[join_phone_player] phone=*%s game=% returning caller, keeping joined_in_lobby=%',
        right(v_clean_phone, 4), v_game.id, v_existing.joined_in_lobby;
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

  -- Compute eligibility with breakdown for logging.
  v_status_ok := (v_game.status = 'lobby');
  v_grace_ok := (v_game.start_at IS NULL OR now() < v_game.start_at);
  v_in_lobby := v_status_ok AND v_grace_ok;

  IF v_in_lobby THEN
    v_reason := 'eligible: status=lobby AND ' ||
      CASE
        WHEN v_game.start_at IS NULL THEN 'start_at IS NULL (host has not started)'
        ELSE 'now()<start_at (inside grace window, ' ||
             extract(epoch from (v_game.start_at - now()))::int || 's left)'
      END;
  ELSE
    v_reason := 'late: ' ||
      CASE WHEN NOT v_status_ok THEN 'status=' || v_game.status || ' (not lobby)' ELSE '' END ||
      CASE WHEN NOT v_status_ok AND NOT v_grace_ok THEN ' AND ' ELSE '' END ||
      CASE WHEN NOT v_grace_ok THEN
        'now()>=start_at (' || extract(epoch from (now() - v_game.start_at))::int || 's past start)'
      ELSE '' END;
  END IF;

  RAISE LOG '[join_phone_player] phone=*%s game=% status=% start_at=% → joined_in_lobby=% (%)',
    right(v_clean_phone, 4), v_game.id, v_game.status, v_game.start_at, v_in_lobby, v_reason;

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