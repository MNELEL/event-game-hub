import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Copy, Check, Phone, Server, AlertCircle, Wand2, Loader2, CheckCircle2, XCircle, Circle, BookOpen, ShieldCheck, Search, Home, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IvrTestCallButton } from "@/components/game/IvrTestCallButton";
import { CallTestWizard } from "@/components/yemot/CallTestWizard";
import { ApiPermissionsChecklist } from "@/components/yemot/ApiPermissionsChecklist";
import { YemotCredentialsCard } from "@/components/yemot/YemotCredentialsCard";
import { E2ETestRunner } from "@/components/yemot/E2ETestRunner";

const SUPABASE_PROJECT_ID = "wzmspoufqdldcuagsvir";
const WEBHOOK_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/yemot-ivr`;

function CopyBox({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("הועתק ללוח");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="flex items-stretch gap-2">
        <code className="flex-1 bg-muted/60 border border-border rounded-md px-3 py-2 text-xs sm:text-sm font-mono break-all text-foreground select-all" dir="ltr">
          {value}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
        {n}
      </div>
      <div className="flex-1 space-y-2">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "yemot_webhook_secret";

export default function YemotSetup() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [extension, setExtension] = useState<string>(() => {
    if (typeof window === "undefined") return "1";
    return localStorage.getItem("yemot_extension") || "1";
  });
  const [autoLoading, setAutoLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  type CheckItem = { key: string; ok: boolean; detail: string };
  type CheckResult =
    | { ok: boolean; exists: boolean; path: string; checks: CheckItem[]; raw?: string; message?: string }
    | null;
  const [checkResult, setCheckResult] = useState<CheckResult>(null);
  type LogStatus = "pending" | "running" | "success" | "error";
  type LogEntry = { id: string; label: string; status: LogStatus; detail?: string; ts: number };
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const pushLog = (entry: Omit<LogEntry, "ts">) =>
    setLogs((prev) => [...prev, { ...entry, ts: Date.now() }]);
  const updateLog = (id: string, patch: Partial<LogEntry>) =>
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch, ts: Date.now() } : l)));

  const runCheck = async () => {
    const ext = (extension || "1").replace(/[^0-9]/g, "");
    if (!ext) { toast.error("יש להזין מספר שלוחה תקין"); return; }
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-yemot-extension", {
        body: { extension: ext },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setCheckResult(data as CheckResult);
      if ((data as any)?.ok) toast.success("השלוחה מוגדרת כראוי בימות");
      else toast.error("נמצאו בעיות בתצורת השלוחה");
    } catch (e: any) {
      toast.error(e?.message || "בדיקת התצורה נכשלה");
    } finally {
      setCheckLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (secret) {
      localStorage.setItem(STORAGE_KEY, secret);
      setSavedAt(Date.now());
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setSavedAt(null);
    }
  }, [secret]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("yemot_extension", extension || "1");
  }, [extension]);

  const runAutoSetup = async () => {
    const ext = (extension || "1").replace(/[^0-9]/g, "");
    if (!ext) {
      toast.error("יש להזין מספר שלוחה תקין");
      return;
    }
    setAutoLoading(true);
    setLogs([]);
    const t0 = Date.now();
    pushLog({ id: "prep", label: `הכנת תוכן ext.ini עבור שלוחה ${ext}`, status: "running" });
    try {
      // tiny delay so the user actually sees the step
      await new Promise((r) => setTimeout(r, 150));
      updateLog("prep", { status: "success", detail: `נתיב יעד: ivr2:/${ext}/ext.ini` });

      pushLog({ id: "upload", label: "שליחה לשרת והעלאה לימות המשיח", status: "running" });
      const { data, error } = await supabase.functions.invoke("setup-yemot-extension", {
        body: { extension: ext },
      });
      if (error) throw error;
      if ((data as any)?.error) {
        const det = (data as any)?.details ? JSON.stringify((data as any).details) : undefined;
        updateLog("upload", { status: "error", detail: det });
        throw new Error((data as any).error);
      }
      const ymInfo = (data as any)?.yemot;
      updateLog("upload", {
        status: "success",
        detail: typeof ymInfo === "string" ? ymInfo : JSON.stringify(ymInfo),
      });

      pushLog({
        id: "done",
        label: `הסתיים בהצלחה תוך ${((Date.now() - t0) / 1000).toFixed(1)} שניות`,
        status: "success",
        detail: `חייג למערכת והקש ${ext} כדי לבדוק.`,
      });
      toast.success(`שלוחה ${ext} הוגדרה בהצלחה בימות!`);
    } catch (e: any) {
      console.error(e);
      pushLog({ id: "fail", label: "ההגדרה האוטומטית נכשלה", status: "error", detail: e?.message });
      toast.error(e?.message || "ההגדרה האוטומטית נכשלה. נסה את הדרך הידנית למטה.");
    } finally {
      setAutoLoading(false);
    }
  };

  const clearSecret = () => {
    setSecret("");
    toast.success("הסוד נמחק מהמכשיר");
  };

  const fullUrl = secret
    ? `${WEBHOOK_URL}?secret=${encodeURIComponent(secret)}`
    : `${WEBHOOK_URL}?secret=YOUR_SECRET`;

  const iniContent = `type=api
api_link=${fullUrl}
api_add_0=ApiPhone
api_add_1=ApiDID
api_add_2=ApiExtension
api_000=none
api_extension_send=yes
api_call_id_send=yes
hangup_insert_file=no
say_error_message=no`;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
              <Home className="w-4 h-4" />
              חזרה לדף הראשי
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-1">
              <ArrowRight className="w-4 h-4" />
              חזרה לניהול
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <IvrTestCallButton />
            <Button variant="outline" size="sm" onClick={() => navigate("/ivr-guide")} className="gap-1">
              <BookOpen className="w-4 h-4" />
              מדריך IVR
            </Button>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
            <Phone className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">הוראות התקנה — ימות המשיח</h1>
          <p className="text-muted-foreground">
            חבר את השלוחה שלך כדי שמתקשרים יוכלו להצטרף למשחק ולענות בהקשת מקשים
          </p>
        </div>

        {/* 1. Per-user Yemot credentials */}
        <YemotCredentialsCard extension={extension} />

        {/* 2. API permissions verification */}
        <ApiPermissionsChecklist />

        {/* 3. End-to-end test runner */}
        <E2ETestRunner extension={extension} />

        {/* 4. Auto setup */}
        <Card className="p-5 border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-bold text-foreground">הגדרה אוטומטית של השלוחה</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            לחיצה אחת תיצור/תעדכן את <code dir="ltr">ext.ini</code> בשלוחה הנבחרת ישירות בימות, ותכתוב גם בשורש המערכת לגיבוי.
          </p>
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-sm text-foreground shrink-0">שלוחה:</label>
            <input
              type="text"
              inputMode="numeric"
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              placeholder="1"
              className="w-20 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-mono text-center"
              dir="ltr"
            />
            <Button
              type="button"
              onClick={runAutoSetup}
              disabled={autoLoading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {autoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              הגדר את השלוחה
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={runCheck}
              disabled={checkLoading}
              className="gap-2"
            >
              {checkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              בדוק תצורה
            </Button>
          </div>

          {checkResult && (
            <div className={`rounded-md border p-3 space-y-2 ${checkResult.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {checkResult.ok ? (
                  <><ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> השלוחה מחוברת בצורה תקינה</>
                ) : checkResult.exists ? (
                  <><AlertCircle className="w-4 h-4 text-destructive" /> נמצאו בעיות בקובץ ext.ini</>
                ) : (
                  <><XCircle className="w-4 h-4 text-destructive" /> הקובץ לא נמצא — הרץ "הגדר את השלוחה" קודם</>
                )}
              </div>
              {checkResult.checks?.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {checkResult.checks.map((c) => (
                    <li key={c.key} className="flex items-start gap-2">
                      {c.ok
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <div className="text-foreground">{c.key}</div>
                        <div className="text-[11px] text-muted-foreground font-mono break-all" dir="ltr">{c.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {checkResult.message && (
                <div className="text-xs text-muted-foreground">{checkResult.message}</div>
              )}
            </div>
          )}

          {(autoLoading || logs.length > 0) && (
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">לוג השלבים:</div>
              <div className="rounded-md border border-border bg-background/80 p-3 space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0">
                      {l.status === "running" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {l.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {l.status === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                      {l.status === "pending" && <Circle className="w-4 h-4 text-muted-foreground" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={l.status === "error" ? "text-destructive" : "text-foreground"}>
                        {l.label}
                      </div>
                      {l.detail && (
                        <div className="text-[11px] text-muted-foreground font-mono break-all whitespace-pre-wrap mt-0.5" dir="ltr">
                          {l.detail}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums" dir="ltr">
                      {new Date(l.ts).toLocaleTimeString("he-IL", { hour12: false })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* 5. Optional: step-by-step call wizard (collapsible) */}
        <details className="rounded-lg border-2 border-border bg-card group">
          <summary className="cursor-pointer p-4 flex items-center justify-between font-bold text-foreground select-none">
            <span>אשף בדיקת חיוג צעד־אחר־צעד</span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-4 pt-0">
            <CallTestWizard />
          </div>
        </details>

        {/* 6. Trivia module replacement notice (collapsible) */}
        <details className="rounded-lg border border-amber-500/40 bg-amber-500/5 group">
          <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-foreground select-none">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              אם הוגדר אצלך "מודול טריוויה" בימות
            </span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-4 pt-0 text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              מודול הטריוויה המובנה של ימות הוא מערכת <strong>עצמאית לחלוטין</strong> ו<strong>לא מתחבר</strong> לאפליקציה.
              צריך להחליף את הגדרת השלוחה ל־<code dir="ltr" className="bg-muted px-1 rounded">type=api</code>.
            </p>
            <ol className="list-decimal pr-5 space-y-1 text-xs">
              <li>פאנל ימות → <strong>ניהול מערכת</strong> → <strong>שלוחות</strong>.</li>
              <li>אתרי את השלוחה (למשל <code dir="ltr">1</code>) שמוגדרת כ"טריוויה" ושני אותה ל־"שלוחת API" (או מחקי את התוכן).</li>
              <li>חזרי לכאן ולחצי <strong>"הגדר את השלוחה"</strong>.</li>
            </ol>
          </div>
        </details>

        {/* 7. How it works (collapsible reference) */}
        <details className="rounded-lg border border-border bg-card group">
          <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-foreground select-none">
            <span className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              איך זה עובד מאחורי הקלעים?
            </span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-4 pt-0">
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pr-5 leading-relaxed">
              <li>בכל פעולה ימות שולחת בקשה ל־Edge Function שלנו (כתובת ה־webhook נכתבת אוטומטית ב־ext.ini).</li>
              <li>בכניסה ראשונה — נוצר אוטומטית שחקן בשם <strong>"מתקשר ####"</strong> (4 ספרות אחרונות של הטלפון).</li>
              <li>במצב <strong>שאלה</strong> — המתקשר מתבקש להקיש 1-4. תשובה ננעלת כשהזמן נגמר.</li>
              <li>בין שאלות — המערכת מקריאה הודעת המתנה וחוזרת לבדוק שוב.</li>
              <li>בסיום — מושמע "המשחק הסתיים" והשיחה מנותקת.</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
