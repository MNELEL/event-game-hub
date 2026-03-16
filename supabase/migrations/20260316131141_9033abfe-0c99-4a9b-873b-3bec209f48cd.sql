-- Allow the service role to update player scores (edge function uses service role)
-- The existing RLS blocks UPDATE on players, but service role bypasses RLS

-- Create a helper function for score increment (used by edge function)
CREATE OR REPLACE FUNCTION public.increment_player_score(p_player_id uuid, p_points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.players
  SET score = score + p_points
  WHERE id = p_player_id;
END;
$$;