import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ArrowLeft, ArrowRight, Loader2, CheckCircle2, XCircle, AlertCircle, ShieldCheck, PhoneCall, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CheckItem = { key: string; ok: boolean; detail: string };
type CheckResult = {
  ok: boolean;
  exists: boolean;
  path: string;
  checks: CheckItem[];
  message?: string;
} | null;

const STORAGE = { phone: "yemot_target_phone", ext: "yemot_extension" };

export function CallTestWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE.phone) || "" : ""
  );
  const [ext, setExt] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE.ext) || "1" : "1"
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult>(null);

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const cleanExt = ext.replace(/[^0-9]/g, "");

  const goCheck = async () => {
    if (cleanPhone.length < 4) { toast.error("הזן מספר יעד תקין"); return; }
    if (!cleanExt) { toast.error("הזן מספר שלוחה"); return; }
    localStorage.setItem(STORAGE.phone, cleanPhone);
    localStorage.setItem(STORAGE.ext, cleanExt);
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-yemot-extension", {
        body: { extension: cleanExt },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as CheckResult);
      setStep(3);
    } catch (e: any) {
      toast.error(e?.message || "בדיקת התצורה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setStep(1); };

  return (
    <Card className="p-5 border-2 border-sky-500/40 bg-sky-500/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="font-bold text-foreground">אשף בדיקת חיוג</h2>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step === n
                  ? "bg-sky-600 text-white"
                  : step > n
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > n ? <CheckCircle2 className="w-3 h-3" /> : n}
            </span>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ספר/י לי לאן את/ה מחייג/ת. נבדוק שהיעד הזה באמת מחובר נכון לימות.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">מספר היעד שאתה מחייג אליו</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="לדוגמה: 0772267604"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-mono"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">מספר השלוחה שאתה מקיש אחרי החיוג</label>
            <input
              type="text"
              inputMode="numeric"
              value={ext}
              onChange={(e) => setExt(e.target.value)}
              placeholder="1"
              className="w-24 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-mono text-center"
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">
              ברירת מחדל: שלוחה 1. אם הגדרת קובץ ext.ini בשלוחה אחרת — הזן אותה כאן.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!cleanPhone || !cleanExt} className="gap-1">
              המשך
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-foreground">סיכום מה שתחייג:</p>
          <div className="rounded-md border border-border bg-background/80 p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-600" />
              <span className="text-muted-foreground">חייג למספר:</span>
              <span className="font-mono font-bold" dir="ltr">{cleanPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-flex items-center justify-center text-sky-600 font-bold">#</span>
              <span className="text-muted-foreground">לאחר החיוג הקש שלוחה:</span>
              <span className="font-mono font-bold" dir="ltr">{cleanExt}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            עכשיו נריץ בדיקה אם השלוחה <code dir="ltr">{cleanExt}</code> אכן מחוברת נכון אל המערכת.
          </p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
              <ArrowRight className="w-4 h-4" />
              חזור
            </Button>
            <Button onClick={goCheck} disabled={loading} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              בדוק את השלוחה עכשיו
            </Button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-3">
          <div
            className={`rounded-md border p-3 space-y-2 ${
              result.ok
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-destructive/40 bg-destructive/5"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {result.ok ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  השלוחה {cleanExt} מחוברת נכון לימות
                </>
              ) : result.exists ? (
                <>
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  נמצאו בעיות בקובץ ext.ini של שלוחה {cleanExt}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-destructive" />
                  לא קיים קובץ ext.ini בשלוחה {cleanExt}
                </>
              )}
            </div>
            {result.checks?.length > 0 && (
              <ul className="space-y-1 text-xs">
                {result.checks.map((c) => (
                  <li key={c.key} className="flex items-start gap-2">
                    {c.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-foreground">{c.key}</div>
                      <div className="text-[11px] text-muted-foreground font-mono break-all" dir="ltr">
                        {c.detail}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {result.message && <div className="text-xs text-muted-foreground">{result.message}</div>}
          </div>

          {/* Tailored next steps */}
          <div className="rounded-md border border-border bg-background/80 p-3 space-y-2 text-sm">
            <div className="font-semibold text-foreground">מה עכשיו?</div>
            {!result.exists && (
              <ol className="list-decimal pr-5 space-y-1 text-xs text-muted-foreground">
                <li>חזור לכרטיס "הגדרה אוטומטית" למעלה והקלד שלוחה <code dir="ltr">{cleanExt}</code>.</li>
                <li>לחץ "הגדר את השלוחה אצלי בימות" — זה יצור עבורך את ext.ini.</li>
                <li>חזור לכאן והרץ את הבדיקה שוב.</li>
              </ol>
            )}
            {result.exists && !result.ok && (
              <ol className="list-decimal pr-5 space-y-1 text-xs text-muted-foreground">
                <li>הרץ שוב "הגדר את השלוחה אצלי בימות" כדי לדרוס את הקובץ עם הערכים הנכונים.</li>
                <li>אם זה לא נפתר — בדוק שאתה אכן עורך את שלוחה <code dir="ltr">{cleanExt}</code> בימות (לא שלוחה אחרת).</li>
                <li>הרץ את הבדיקה שוב; כל הסעיפים צריכים להיות ירוקים.</li>
              </ol>
            )}
            {result.ok && (
              <ol className="list-decimal pr-5 space-y-1 text-xs text-muted-foreground">
                <li>ודא שיש משחק במצב <strong>לובי</strong> (פתח משחק חדש מהדאשבורד אם אין).</li>
                <li>
                  חייג ל-<span className="font-mono font-bold" dir="ltr">{cleanPhone}</span> והקש{" "}
                  <span className="font-mono font-bold" dir="ltr">{cleanExt}</span>.
                </li>
                <li>אמור להישמע: "ברוכים הבאים למשחק. הרשמתך התקבלה. אתה רשום בשם מתקשר ####".</li>
                <li>אם בכל זאת שקט — סביר שמספר היעד עצמו לא מנותב למערכת ימות שלך. ודא בפאנל ימות שזהו המספר הראשי של המערכת.</li>
              </ol>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={reset} className="gap-1">
              <ArrowRight className="w-4 h-4" />
              התחל מחדש
            </Button>
            <Button onClick={goCheck} disabled={loading} variant="secondary" className="gap-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              בדוק שוב
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
