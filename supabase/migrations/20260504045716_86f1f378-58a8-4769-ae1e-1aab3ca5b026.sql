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
BEGIN
  v_clean_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF length(v_clean_phone) < 4 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  SELECT * INTO v_game FROM public.games
  WHERE status IN ('lobby', 'playing', 'question', 'results', 'leaderboard')
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_active_game';
  END IF;

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

  -- A caller is considered "joined in lobby" only if BOTH:
  --   1) the game is still in the lobby phase, AND
  --   2) we are still inside the host's grace window
  --      (start_at is NULL = host hasn't clicked start yet,
  --       or now() < start_at = inside the countdown window).
  -- This prevents callers who arrive in the exact moment the status
  -- flips (race conditions, late polls) from being credited as eligible.
  v_in_lobby := (
    v_game.status = 'lobby'
    AND (v_game.start_at IS NULL OR now() < v_game.start_at)
  );
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