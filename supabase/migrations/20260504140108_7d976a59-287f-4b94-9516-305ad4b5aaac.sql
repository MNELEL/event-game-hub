REVOKE EXECUTE ON FUNCTION public.check_clock_skew(timestamptz, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_clock_skew(timestamptz, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_clock_skew(timestamptz, integer, integer) TO authenticated;