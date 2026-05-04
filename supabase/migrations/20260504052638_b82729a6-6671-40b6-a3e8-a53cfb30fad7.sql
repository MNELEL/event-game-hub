
-- System alerts table for server-side health warnings (clock skew etc.)
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read system alerts" ON public.system_alerts;
CREATE POLICY "Authenticated can read system alerts"
  ON public.system_alerts FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_system_alerts_kind_created
  ON public.system_alerts (kind, created_at DESC);

-- Clock-skew check RPC. Compares the client's "now" against server now()
-- and records an alert + RAISE LOG when drift exceeds the threshold.
-- Returns the measured drift so the UI can display/refuse start.
CREATE OR REPLACE FUNCTION public.check_clock_skew(
  p_client_now timestamptz,
  p_warn_seconds integer DEFAULT 5,
  p_critical_seconds integer DEFAULT 30
)
RETURNS TABLE(
  server_now timestamptz,
  client_now timestamptz,
  drift_seconds numeric,
  severity text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_server timestamptz := now();
  v_drift numeric;
  v_abs numeric;
  v_severity text;
  v_msg text;
BEGIN
  IF p_client_now IS NULL THEN
    RAISE EXCEPTION 'client_now_required';
  END IF;

  v_drift := extract(epoch FROM (p_client_now - v_server));
  v_abs := abs(v_drift);

  IF v_abs >= p_critical_seconds THEN
    v_severity := 'critical';
    v_msg := format('Clock skew %ss exceeds critical threshold %ss — refusing to start game',
                    round(v_drift, 2), p_critical_seconds);
  ELSIF v_abs >= p_warn_seconds THEN
    v_severity := 'warning';
    v_msg := format('Clock skew %ss exceeds warn threshold %ss', round(v_drift, 2), p_warn_seconds);
  ELSE
    v_severity := 'info';
    v_msg := format('Clock skew OK (%ss)', round(v_drift, 2));
  END IF;

  IF v_severity <> 'info' THEN
    RAISE LOG '[check_clock_skew] severity=% drift=%s server=% client=%',
      v_severity, v_drift, v_server, p_client_now;
    INSERT INTO public.system_alerts (kind, severity, message, details)
    VALUES (
      'clock_skew', v_severity, v_msg,
      jsonb_build_object(
        'server_now', v_server,
        'client_now', p_client_now,
        'drift_seconds', v_drift,
        'warn_seconds', p_warn_seconds,
        'critical_seconds', p_critical_seconds
      )
    );
  END IF;

  server_now := v_server;
  client_now := p_client_now;
  drift_seconds := v_drift;
  severity := v_severity;
  message := v_msg;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_clock_skew(timestamptz, integer, integer) TO anon, authenticated;
