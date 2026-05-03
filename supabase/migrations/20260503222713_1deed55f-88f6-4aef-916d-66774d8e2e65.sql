
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.players;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players (id, game_id, name, score, connected, created_at);
