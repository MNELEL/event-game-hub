import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Copy, Check, Phone, FileCode, Server, Bug, AlertCircle, Trash2, Save, Wand2, Loader2, CheckCircle2, XCircle, Circle, BookOpen, ShieldCheck, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IvrTestCallButton } from "@/components/game/IvrTestCallButton";
import { CallTestWizard } from "@/components/yemot/CallTestWizard";
import { ApiPermissionsChecklist } from "@/components/yemot/ApiPermissionsChecklist";
import { YemotCredentialsCard } from "@/components/yemot/YemotCredentialsCard";

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
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-1">
            <ArrowRight className="w-4 h-4" />
            חזרה לניהול
          </Button>
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

        {/* Per-user Yemot credentials */}
        <YemotCredentialsCard />

        {/* Trivia module replacement notice */}
        <Card className="p-5 border-2 border-amber-500/50 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="font-bold text-foreground">חשוב — אם הוגדר אצלך "מודול טריוויה" בימות</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              מודול הטריוויה המובנה של ימות הוא מערכת <strong>עצמאית לחלוטין</strong>: הוא מנהל בעצמו שאלות, ניקוד ומשתתפים, ו<strong>לא מתחבר</strong> לאפליקציה הזו.
            </p>
            <p>
              כדי שמתקשרים יצטרפו למשחק שאת מנהלת מהמסך — צריך להחליף את הגדרת השלוחה מ"מודול טריוויה" לשלוחה מסוג <code dir="ltr" className="bg-muted px-1 rounded">API</code> שמדברת עם השרת שלנו.
            </p>
            <div className="bg-background/60 border border-border rounded-md p-3 space-y-1.5">
              <div className="font-semibold text-foreground text-sm">איך עושים את זה:</div>
              <ol className="list-decimal pr-5 space-y-1 text-xs">
                <li>היכנסי לפאנל ימות → <strong>ניהול מערכת</strong> → <strong>שלוחות</strong>.</li>
                <li>אתרי את השלוחה (למשל <code dir="ltr">1</code>) שכרגע מוגדרת כ"טריוויה".</li>
                <li>שני אותה ל-<strong>"שלוחת API"</strong> — או פשוט מחקי את התוכן הקיים שלה.</li>
                <li>חזרי לכאן ולחצי <strong>"הגדר את השלוחה אצלי בימות"</strong> — זה יכתוב את <code dir="ltr">ext.ini</code> הנכון אוטומטית.</li>
                <li>חייגי שוב — עכשיו תשמעי את ההודעות של האפליקציה במקום הטריוויה של ימות.</li>
              </ol>
            </div>
            <p className="text-xs">
              <strong>דרך מהירה יותר:</strong> ההגדרה האוטומטית למטה דורסת את קובץ <code dir="ltr">ext.ini</code> בשלוחה הנבחרת. אם הטריוויה הוגדרה רק על ידי קובץ <code dir="ltr">ext.ini</code> בשלוחה זו — לחיצה אחת תספיק. אם היא הוגדרה כמודול ייעודי בפאנל — צריך קודם להסיר את הגדרת המודול בפאנל.
            </p>
          </div>
        </Card>

        {/* API permissions verification — explains exactly what to enable in Yemot */}
        <ApiPermissionsChecklist />

        {/* Step-by-step call test wizard */}
        <CallTestWizard />

        {/* Auto setup */}
        <Card className="p-5 border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-bold text-foreground">הגדרה אוטומטית (מומלץ)</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            לחיצה אחת תיצור/תעדכן עבורך את קובץ <code dir="ltr">ext.ini</code> בשלוחה הנבחרת ישירות בימות המשיח, באמצעות מפתח ה-API שכבר שמרת.
          </p>
          <div className="flex gap-2 items-center">
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
              הגדר את השלוחה אצלי בימות
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
                  <><ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> השלוחה מחוברת בצורה תקינה לימות</>
                ) : checkResult.exists ? (
                  <><AlertCircle className="w-4 h-4 text-destructive" /> נמצאו בעיות בקובץ ext.ini</>
                ) : (
                  <><XCircle className="w-4 h-4 text-destructive" /> הקובץ לא נמצא בימות — הרץ "הגדר את השלוחה" קודם</>
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
              {!checkResult.ok && (
                <div className="pt-2 border-t border-border/40 space-y-1.5">
                  <p className="text-xs text-foreground">
                    {checkResult.exists
                      ? "נראה ש-ext.ini בימות לא תקין. לחץ כאן כדי לדרוס אותו עם ההגדרות הנכונות:"
                      : "השלוחה עוד לא הוגדרה בימות. לחץ כאן כדי להגדיר אותה עכשיו:"}
                  </p>
                  <Button
                    type="button"
                    onClick={runAutoSetup}
                    disabled={autoLoading}
                    size="sm"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {autoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    הגדר את שלוחה {extension || "1"} עכשיו
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    אם בטלפון נשמע "חסר לינק" — זה בדיוק התיקון שצריך.
                  </p>
                </div>
              )}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            זה יעדכן את הנתיב <code dir="ltr">ivr2:/{extension || "1"}/ext.ini</code> במערכת שלך.
          </p>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">תצוגה מקדימה של תוכן ext.ini שייכתב:</div>
            <pre className="rounded-md border border-border bg-muted/60 p-3 font-mono text-[11px] sm:text-xs whitespace-pre-wrap break-all text-foreground" dir="ltr">
{`type=api
api_link=${WEBHOOK_URL}?secret=${secret ? "•".repeat(Math.min(secret.length, 12)) + "  (הסוד יוזרק בצד השרת)" : "<YEMOT_WEBHOOK_SECRET מהשרת>"}
api_add_0=ApiPhone
api_add_1=ApiDID
api_add_2=ApiExtension
api_000=none
api_extension_send=yes
api_call_id_send=yes
hangup_insert_file=no
say_error_message=no`}
            </pre>
            <p className="text-[11px] text-muted-foreground">
              הסוד עצמו לא נחשף כאן — הוא נשלף מצד השרת בעת ההעלאה לימות.
            </p>
          </div>

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

        {/* Troubleshooting: "Security Error" when calling */}
        <Card className="p-5 border-2 border-destructive/40 bg-destructive/5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h2 className="font-bold text-foreground">קיבלתי "שגיאת אבטחה" כשחייגתי לשלוחה</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              ההודעה <em>"השלוחה אינה ניתנת להפעלה עקב חוסר בהגדרות"</em> מגיעה מימות עצמה — לא מהאפליקציה.
              בדקנו בלוגים שלנו: <strong>הבקשה לא הגיעה לשרת בכלל</strong>, ימות חוסמת אותה לפני יציאה.
              סיבות אפשריות (לפי הסדר):
            </p>
            <ol className="list-decimal pr-5 space-y-2 text-foreground">
              <li>
                <strong>נסי שלוחה אחרת.</strong> לפעמים שלוחה 1 שמורה כשלוחת ברירת מחדל מיוחדת. שני את המספר ל-<code dir="ltr">2</code> למעלה, לחצי "הגדר את השלוחה אצלי בימות", וחייגי לשלוחה 2.
              </li>
              <li>
                <strong>הרשאת "API יוצא" לא מופעלת בחשבון.</strong> זו הרשאה ברמת חשבון שצריך לבקש מתמיכת ימות (לא ניתן להפעיל מהפאנל).
              </li>
            </ol>
            <div className="bg-background/80 border border-border rounded-md p-3 space-y-2">
              <div className="font-semibold text-foreground text-sm">הודעה מוכנה לשליחה לתמיכת ימות:</div>
              <div className="text-xs text-muted-foreground">
                שלחי במייל ל-<code dir="ltr">support@call2all.co.il</code> או חייגי <code dir="ltr">077-2222-100</code>.
              </div>
              <CopyBox
                value={`שלום,
יש לי שלוחה מסוג type=api (שלוחה ${extension || "1"}) שאמורה לקרוא ל-webhook חיצוני בכתובת:
${WEBHOOK_URL}

כשמתקשרים לשלוחה אני מקבל הודעת "שגיאת אבטחה - השלוחה אינה ניתנת להפעלה עקב חוסר בהגדרות".
אנא הפעילו עבור החשבון שלי הרשאת API יוצא (outbound API) לדומיין supabase.co.

מספר מערכת: 0772267604
תודה!`}
                label="טקסט מלא להעתקה:"
              />
            </div>
          </div>
        </Card>

        {/* Quick URL */}
        <Card className="p-5 border-2 border-primary/40 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">כתובת ה-API להדבקה</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            הזן את הסוד שהגדרת (YEMOT_WEBHOOK_SECRET). הוא יישמר במכשיר זה ויוטמע אוטומטית בכתובת בכל פעם שתחזור לעמוד הזה.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="הסוד שלך…"
              className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-mono"
              dir="ltr"
            />
            {secret && (
              <Button type="button" variant="outline" size="sm" onClick={clearSecret} className="shrink-0 gap-1">
                <Trash2 className="w-4 h-4" />
                נקה
              </Button>
            )}
          </div>
          {savedAt && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Save className="w-3 h-3" />
              נשמר במכשיר זה — יטען אוטומטית בביקור הבא
            </div>
          )}
          <CopyBox value={fullUrl} label="api_link" />
        </Card>

        {/* Steps */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
            שלבי ההגדרה בפאנל ימות
          </h2>

          <Step n={1} title="התחבר לפאנל ימות המשיח">
            <p>
              היכנס לאתר{" "}
              <a href="https://www.call2all.co.il" target="_blank" rel="noreferrer" className="text-primary underline" dir="ltr">
                www.call2all.co.il
              </a>{" "}
              והתחבר עם מספר המערכת והסיסמה שלך.
            </p>
          </Step>

          <Step n={2} title="פתח את ניהול הקבצים">
            <p>בתפריט הראשי לחץ על <strong>"ניהול מערכת"</strong> ← <strong>"ימות לעורכי תוכן"</strong> ← <strong>"קבצים"</strong>.</p>
            <p className="text-xs">
              לחלופין: ניתן לעבוד דרך <strong>FTP</strong> בכתובת <code dir="ltr" className="bg-muted px-1 rounded">ym2.call2all.co.il</code> עם שם משתמש = מספר המערכת וסיסמת ה-FTP שלך.
            </p>
          </Step>

          <Step n={3} title="בחר את השלוחה הרצויה">
            <p>
              נווט לתיקיית השלוחה שתשמש להצטרפות למשחק. למשל לשלוחה <code className="bg-muted px-1 rounded">1</code> הנתיב יהיה:
            </p>
            <CopyBox value="/ivr2:1/" />
            <p className="text-xs">אם אין תיקייה כזו, צור אותה ישירות מתפריט הקבצים.</p>
          </Step>

          <Step n={4} title="צור או ערוך את הקובץ ext.ini">
            <p>
              בתוך תיקיית השלוחה צור קובץ בשם <code className="bg-muted px-1 rounded">ext.ini</code> (בדיוק כך, אותיות קטנות).
              העתק לתוכו את התוכן הבא:
            </p>
            <div className="rounded-md border border-border bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap break-all" dir="ltr">
{iniContent}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(iniContent);
                toast.success("תוכן הקובץ הועתק");
              }}
              className="gap-1"
            >
              <Copy className="w-3 h-3" />
              העתק את כל התוכן
            </Button>
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-amber-700 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                החלף את <code dir="ltr">YOUR_SECRET</code> בסוד שהגדרת. אם הזנת אותו למעלה — התוכן כבר כולל אותו.
              </span>
            </div>
          </Step>

          <Step n={5} title="שמור ובדוק">
            <p>שמור את הקובץ. כעת חייג למערכת והקש את מספר השלוחה (למשל 1).</p>
            <p>
              אם הכל תקין — תשמע: <em>"הצטרפת בהצלחה. אתה רשום בשם מתקשר ####. ממתין לתחילת המשחק."</em>
            </p>
            <p>במהלך שאלה פעילה תקבל הקראה של מספר השאלה ותתבקש להקיש ספרה בין 1 ל-4.</p>
          </Step>
        </Card>

        {/* How it works */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">איך זה עובד?</h2>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pr-5 leading-relaxed">
            <li>בכל פעולה ימות שולחת בקשה ל-Edge Function שלנו (ה-URL למעלה).</li>
            <li>בכניסה ראשונה — נוצר אוטומטית שחקן בשם <strong>"מתקשר ####"</strong> (4 ספרות אחרונות של הטלפון).</li>
            <li>כשהמסך הראשי במצב <strong>שאלה</strong> — המתקשר מתבקש להקיש 1-4. תשובה ננעלת כשהזמן נגמר.</li>
            <li>בין שאלות (לוח תוצאות / לובי) — המערכת מקריאה הודעת המתנה וחוזרת לבדוק שוב.</li>
            <li>בסיום המשחק — מושמע "המשחק הסתיים" והשיחה מנותקת.</li>
          </ul>
        </Card>

        {/* Troubleshooting */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">פתרון תקלות</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-foreground">"שגיאת אבטחה" בהאזנה</div>
              <div className="text-muted-foreground text-xs">הסוד ב-URL לא תואם ל-YEMOT_WEBHOOK_SECRET. ערוך את ext.ini עם הסוד הנכון.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">"אין משחק פעיל כרגע"</div>
              <div className="text-muted-foreground text-xs">פתח משחק חדש מהדאשבורד והשאר אותו במצב לובי, ואז המתקשר יוכל להצטרף.</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">לא נשמע כלום / שגיאה כללית</div>
              <div className="text-muted-foreground text-xs">בדוק שהשלוחה מוגדרת כ-<code dir="ltr">type=api</code>, שה-<code dir="ltr">api_link</code> תקין, ושקיימות שורות <code dir="ltr">api_add</code> לשליחת מספר הטלפון.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
