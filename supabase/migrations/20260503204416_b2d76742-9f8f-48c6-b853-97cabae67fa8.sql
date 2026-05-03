
REVOKE EXECUTE ON FUNCTION public.join_phone_player(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_phone_answer(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_phone_player(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_phone_answer(TEXT, INTEGER, INTEGER) TO service_role;
