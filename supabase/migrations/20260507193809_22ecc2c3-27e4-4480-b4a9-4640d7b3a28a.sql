-- Re-add players to the realtime publication with an explicit column list
-- that EXCLUDES secret_token so it is never broadcast.
ALTER PUBLICATION supabase_realtime DROP TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players
  (id, game_id, name, score, connected, created_at);