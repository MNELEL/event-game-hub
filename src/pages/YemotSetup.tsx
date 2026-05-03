import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Copy, Check, Phone, FileCode, Server, Bug, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

export default function YemotSetup() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState("");

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

        {/* Quick URL */}
        <Card className="p-5 border-2 border-primary/40 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">כתובת ה-API להדבקה</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            הזן את הסוד שהגדרת (YEMOT_WEBHOOK_SECRET) כדי לקבל את הכתובת המלאה להעתקה:
          </p>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="הסוד שלך…"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-mono"
            dir="ltr"
          />
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
