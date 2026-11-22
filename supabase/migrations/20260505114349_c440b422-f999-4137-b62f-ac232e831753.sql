ALTER PUBLICATION supabase_realtime ADD TABLE public.phone_players;
ALTER TABLE public.phone_players REPLICA IDENTITY FULL;