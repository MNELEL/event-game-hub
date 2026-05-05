import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle, Clock, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = {
  id: string;
  name: string;
  status: "ok" | "fail" | "pending";
  message?: string;
  error_code?: string;
  next_step?: string;
  duration_ms?: number;
  request?: { endpoint: string; body: Record<string, unknown> };
  response?: { http_status: number; body: unknown };
  cleanup?: { ok: boolean; body: unknown };
  path?: string;
};

type Result = {
  ok: boolean;
  failed_at: string | null;
  steps: Step[];
  total_ms: number;
};

export function E2ETestRunner({ extension, autoRunTrigger }: { extension?: string; autoRunTrigger?: number }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const lastTrigger = useRef<number | undefined>(undefined);

  const ext = (extension || (typeof window !== "undefined" ? localStorage.getItem("yemot_extension") : null) || "1")
    .toString()
    .replace(/[^0-9]/g, "") || "1";

  const run = async () => {
    setRunning(true);
    setResult(null);
    setTopError(null);
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "e2e_test", extension: ext },
      });
      if (error) throw new Error(error.message);
      const d = data as any;
      if (d?.error) throw new Error(d.error);
      const r = d as Result;
      setResult(r);
      // Auto-expand failed step
      if (r.failed_at) setExpanded({ [r.failed_at]: true });
      if (r.ok) toast.success("בדיקת קצה־לקצה עברה בהצלחה");
      else toast.error(`כשל בשלב: ${r.steps.find((s) => s.id === r.failed_at)?.name || r.failed_at}`);
    } catch (e: any) {
      setTopError(e?.message || "הבדיקה נכשלה");
      toast.error(e?.message || "הבדיקה נכשלה");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (autoRunTrigger && autoRunTrigger !== lastTrigger.current && !running) {
      lastTrigger.current = autoRunTrigger;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunTrigger]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <Card className="p-5 border-2 border-primary/40 bg-background/60 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">בדיקת קצה־לקצה מול ימות</h2>
        </div>
        <Button onClick={run} disabled={running} className="gap-2" size="sm">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          {running ? "בודק..." : `הרץ בדיקה (שלוחה ${ext})`}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        מריץ ברצף: אימות אסימון → בדיקת הרשאת UploadTextFile → כתיבת ext.ini. כל שלב מוצג עם הבקשה, התגובה, וההצעה לפעולה מתקנת.
      </p>

      {topError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{topError}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-md border p-3 text-sm flex items-center gap-2 ${
              result.ok
                ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/50 bg-destructive/5 text-destructive"
            }`}
          >
            {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="font-semibold">
              {result.ok ? "כל השלבים עברו בהצלחה" : `נכשל בשלב: ${result.steps.find((s) => s.id === result.failed_at)?.name}`}
            </span>
            <span className="ms-auto text-xs flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {result.total_ms}ms
            </span>
          </div>

          <ol className="space-y-2">
            {result.steps.map((s) => {
              const isOpen = expanded[s.id];
              const ok = s.status === "ok";
              return (
                <li
                  key={s.id}
                  className={`rounded-md border ${
                    ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/50 bg-destructive/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="w-full flex items-center gap-2 p-3 text-start"
                  >
                    {ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <span className="font-semibold text-sm text-foreground flex-1">{s.name}</span>
                    {typeof s.duration_ms === "number" && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.duration_ms}ms
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/60 p-3 space-y-3 text-xs">
                      {s.message && (
                        <div className={ok ? "text-foreground" : "text-destructive font-medium"}>{s.message}</div>
                      )}
                      {s.error_code && (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-muted-foreground">קוד שגיאה:</span>
                          <code className="px-2 py-0.5 rounded bg-muted font-mono text-destructive">{s.error_code}</code>
                        </div>
                      )}
                      {s.next_step && (
                        <div className="rounded border border-amber-500/40 bg-amber-500/5 p-2 text-foreground">
                          <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1">פעולה מתקנת</div>
                          <div>{s.next_step}</div>
                        </div>
                      )}
                      {s.path && (
                        <div className="font-mono text-[11px] text-muted-foreground break-all" dir="ltr">{s.path}</div>
                      )}
                      {s.request && (
                        <details className="border border-border/60 rounded">
                          <summary className="cursor-pointer p-2 text-muted-foreground select-none">בקשה ←</summary>
                          <div className="p-2 border-t border-border/60 space-y-1">
                            <div className="font-mono text-[11px]" dir="ltr">{s.request.endpoint}</div>
                            <pre className="bg-muted/50 rounded p-2 overflow-x-auto text-[11px]" dir="ltr">
{JSON.stringify(s.request.body, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                      {s.response && (
                        <details className="border border-border/60 rounded" open={!ok}>
                          <summary className="cursor-pointer p-2 text-muted-foreground select-none">
                            תגובה (HTTP {s.response.http_status}) ←
                          </summary>
                          <pre className="p-2 border-t border-border/60 bg-muted/50 overflow-x-auto text-[11px] max-h-64" dir="ltr">
{typeof s.response.body === "string" ? s.response.body : JSON.stringify(s.response.body, null, 2)}
                          </pre>
                        </details>
                      )}
                      {s.cleanup && (
                        <div className={`text-[11px] ${s.cleanup.ok ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400"}`}>
                          ניקוי קובץ בדיקה: {s.cleanup.ok ? "הצליח" : "נכשל"}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}
