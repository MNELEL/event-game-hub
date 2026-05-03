import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Copy, Check, Phone, FileCode, Server, Bug, AlertCircle, Trash2, Save, Wand2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    try {
      const { data, error } = await supabase.functions.invoke("setup-yemot-extension", {
        body: { extension: ext },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`שלוחה ${ext} הוגדרה בהצלחה בימות! חייג למערכת והקש ${ext}.`);
    } catch (e: any) {
      console.error(e);
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

  const iniContent = `type=api_call
api_call_url=${fullUrl}
api_call_method=GET`;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-1">
            <ArrowRight className="w-4 h-4" />
            חזרה לניהול
          </Button>
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
          </div>
          <p className="text-[11px] text-muted-foreground">
            זה יעדכן את הנתיב <code dir="ltr">ivr2:/{extension || "1"}/ext.ini</code> במערכת שלך.
          </p>
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
          <CopyBox value={fullUrl} label="api_call_url" />
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
              <div className="text-muted-foreground text-xs">בדוק שה-`api_call_method` הוא GET ושה-URL מודבק כשורה אחת בלי רווחים.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
