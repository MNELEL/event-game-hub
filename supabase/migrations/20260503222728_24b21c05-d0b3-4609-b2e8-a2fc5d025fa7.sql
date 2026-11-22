
-- Restrict EXECUTE on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.join_phone_player(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_phone_answer(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_player_score(uuid, integer) FROM anon, authenticated;
-- claim_branding: only authenticated users
REVOKE EXECUTE ON FUNCTION public.claim_branding(uuid) FROM anon;
-- join_game_by_code stays callable by anon (players join without auth)
