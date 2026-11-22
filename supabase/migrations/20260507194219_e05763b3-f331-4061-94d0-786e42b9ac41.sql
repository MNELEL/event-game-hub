ALTER PUBLICATION supabase_realtime DROP TABLE public.phone_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.phone_players
  (player_id, game_id, joined_in_lobby, last_question_index, last_answer_at, last_seen_question_index, last_poll_at, created_at);