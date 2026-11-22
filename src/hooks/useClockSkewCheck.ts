import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SkewSeverity = "info" | "warning" | "critical";

export interface ClockSkewResult {
  severity: SkewSeverity;
  driftSeconds: number;
  message?: string;
}

/**
 * Periodically asks the server how far off the local clock is.
 * Returns the latest non-info result (warning/critical) so callers
 * can show a friendly banner.
 */
export const useClockSkewCheck = (opts?: {
  intervalMs?: number;
  warnSeconds?: number;
  criticalSeconds?: number;
  enabled?: boolean;
}) => {
  const intervalMs = opts?.intervalMs ?? 60_000;
  const warnSeconds = opts?.warnSeconds ?? 8;
  const criticalSeconds = opts?.criticalSeconds ?? 30;
  const enabled = opts?.enabled ?? true;
  const [skew, setSkew] = useState<ClockSkewResult | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const check = async () => {
      try {
        const { data, error } = await supabase.rpc("check_clock_skew", {
          p_client_now: new Date().toISOString(),
          p_warn_seconds: warnSeconds,
          p_critical_seconds: criticalSeconds,
        });
        if (cancelled || error) return;
        const row = Array.isArray(data) ? data[0] : null;
        if (!row) return;
        if (row.severity === "info") {
          setSkew(null);
        } else {
          setSkew({
            severity: row.severity as SkewSeverity,
            driftSeconds: Number(row.drift_seconds),
            message: row.message,
          });
        }
      } catch {
        // silent — clock check is best-effort
      }
    };

    check();
    const iv = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [intervalMs, warnSeconds, criticalSeconds, enabled]);

  return skew;
};
