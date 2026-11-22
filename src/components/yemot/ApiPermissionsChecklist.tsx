import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_PROJECT_ID = "wzmspoufqdldcuagsvir";
const SUPABASE_DOMAIN = `${SUPABASE_PROJECT_ID}.supabase.co`;
const WEBHOOK_BASE = `https://${SUPABASE_DOMAIN}/functions/v1/yemot-ivr`;

type Check = { key: string; ok: boolean; detail: string };
type VerifyResult =
  | { ok: boolean; configured: boolean; checks: Check[]; message?: string }
  | null;

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("הועתק");
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-mono text-foreground hover:bg-muted transition-colors"
      dir="ltr"
    >
      <span className="break-all">{value}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 shrink-0" />
      )}
    </button>
  );
}

const WHITELIST_ENTRIES = [
  { val: "ivr2_api", desc: "שירות API יוצא הראשי" },
  { val: "/api/GetIVR2Dir", desc: "קריאה של עץ השלוחות" },
  { val: "/api/UpdateExtension", desc: "עדכון הגדרות שלוחה" },
  { val: "/api/FileAction", desc: "ניהול קבצי שמע" },
  { val: "/api/GetIVR2DirStats", desc: "(אופציונלי) סטטיסטיקות" },
];

const EXT_INI_FIELDS = [
  { k: "type", v: "api", desc: "סוג השלוחה" },
  { k: "api_link", v: WEBHOOK_BASE + "?secret=…", desc: "כתובת ה-API שלך כולל ה-secret" },
  { k: "api_extension_send", v: "yes", desc: "שולח את מספר השלוחה" },
  { k: "api_call_id_send", v: "yes", desc: "שולח את מזהה השיחה" },
  { k: "api_add_0", v: "ApiPhone", desc: "שולח את מספר המתקשר" },
  { k: "hangup_insert_file", v: "no", desc: "מונע ניתוק אוטומטי" },
];

export function ApiPermissionsChecklist({ onAllChecksPassed }: { onAllChecksPassed?: () => void } = {}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult>(null);

  const runVerify = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-yemot-token", {});
      if (error) throw error;
      const r = data as VerifyResult;
      setResult(r);
      if (r?.ok && onAllChecksPassed) {
        toast.success("כל ההרשאות עברו — מריץ בדיקת קצה־לקצה אוטומטית");
        setTimeout(() => onAllChecksPassed(), 600);
      }
    } catch (e: any) {
      toast.error(e?.message || "בדיקה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  const supportText = `שלום,
אני משתמש/ת בחשבון ימות המשיח שלי כדי לחבר את המערכת לאפליקציה חיצונית בענן.
אני מקבל/ת "שגיאת אבטחה" כשמנסים לעבור לשלוחה. אנא הפעילו את ההרשאות הבאות בטוקן ה-API שלי ("לובאבל"):

1. שירות "API יוצא" (ivr2_api) — מאופשר.
2. רשימת whitelist (ws_whitelist) צריכה לכלול:
   - ivr2_api
   - /api/GetIVR2Dir
   - /api/UpdateExtension
   - /api/FileAction
3. הרשו תקשורת יוצאת לדומיין: ${SUPABASE_DOMAIN}
4. ערך default_acl_policy = allow

תודה!`;

  return (
    <Card className="p-5 border-2 border-emerald-500/40 bg-emerald-500/5 space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="font-bold text-foreground">וידוא הרשאות API בימות המשיח</h2>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        אם את/ה מקבל/ת "שגיאת אבטחה" בעת מעבר לשלוחה — סימן שהטוקן בימות המשיח חוסם את התקשורת
        אל Lovable Cloud. המסך הזה מסביר בדיוק מה צריך להיות מאופשר, ומאפשר לבדוק את זה אוטומטית.
      </p>

      {/* SECTION A: Path */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">1. איפה מגדירים בימות?</h3>
        <div className="rounded-md border border-border bg-background/80 p-3 text-xs text-muted-foreground leading-relaxed">
          התחבר/י ל-
          <a
            href="https://www.call2all.co.il/ym/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline mx-1 inline-flex items-center gap-0.5"
          >
            פאנל ימות המשיח
            <ExternalLink className="w-3 h-3" />
          </a>
          ← ניהול מערכת ← API ניהול ← בחר/י את הטוקן{" "}
          <code className="px-1 bg-muted rounded">לובאבל</code> ← לחץ/י "תצוגת JSON" או "הגבלות שירותים".
        </div>
      </div>

      {/* SECTION B: Whitelist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground">2. ערכים שחייבים להיות ב-whitelist</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const json = JSON.stringify(
                {
                  ws_whitelist: WHITELIST_ENTRIES.map((e) => e.val),
                  ws_parms_mismatch_action: "remove",
                  default_acl_policy: "allow",
                },
                null,
                2,
              );
              navigator.clipboard.writeText(json);
              toast.success("הועתק! הדבק/י בשדה 'תצוגת JSON' בימות");
            }}
            className="gap-1"
          >
            <Copy className="w-4 h-4" />
            העתק JSON מלא להדבקה בימות
          </Button>
        </div>
        <div className="rounded-md border border-border bg-background/80 divide-y divide-border">
          <div className="grid grid-cols-[auto_1fr] gap-3 p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
            <div>ערך להוסיף</div>
            <div>למה משמש</div>
          </div>
          {WHITELIST_ENTRIES.map((e) => (
            <div key={e.val} className="grid grid-cols-[auto_1fr] gap-3 p-2.5 items-center">
              <CopyChip value={e.val} />
              <div className="text-xs text-muted-foreground">{e.desc}</div>
            </div>
          ))}
          <div className="grid grid-cols-[auto_1fr] gap-3 p-2.5 items-center">
            <CopyChip value="default_acl_policy = allow" />
            <div className="text-xs text-muted-foreground">מדיניות ברירת מחדל מאפשרת</div>
          </div>
        </div>
      </div>

      {/* SECTION C: Outbound domain */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">3. דומיין יעד שצריך להתיר</h3>
        <div className="rounded-md border border-border bg-background/80 p-3 space-y-2">
          <div className="text-xs text-muted-foreground">דומיין שאליו ימות צריכה לפנות:</div>
          <CopyChip value={SUPABASE_DOMAIN} />
          <div className="text-xs text-muted-foreground pt-1">כתובת מלאה של ה-webhook:</div>
          <CopyChip value={WEBHOOK_BASE} />
        </div>
      </div>

      {/* SECTION D: ext.ini fields */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">4. שדות חובה בקובץ ext.ini</h3>
        <div className="rounded-md border border-border bg-background/80 divide-y divide-border">
          <div className="grid grid-cols-[1fr_1.2fr_1.5fr] gap-3 p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
            <div>שדה</div>
            <div>ערך</div>
            <div>הסבר</div>
          </div>
          {EXT_INI_FIELDS.map((f) => (
            <div key={f.k} className="grid grid-cols-[1fr_1.2fr_1.5fr] gap-3 p-2.5 items-center">
              <code className="text-xs font-mono text-foreground" dir="ltr">{f.k}</code>
              <code className="text-xs font-mono text-emerald-700 dark:text-emerald-400 break-all" dir="ltr">
                {f.v}
              </code>
              <div className="text-xs text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          * הקובץ הזה נוצר אוטומטית כשמפעילים "הגדר את השלוחה אצלי בימות". אין צורך לערוך ידנית.
        </p>
      </div>

      {/* SECTION E: Live verification */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">5. בדיקה חיה של ההרשאות</h3>
        <Button onClick={runVerify} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          בדוק את ההרשאות עכשיו
        </Button>

        {result && (
          <div
            className={`rounded-md border p-3 space-y-2 ${
              result.ok
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-destructive/40 bg-destructive/5"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {result.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
              {result.message}
            </div>
            {result.checks?.length > 0 && (
              <ul className="space-y-1.5 text-xs">
                {result.checks.map((c) => (
                  <li key={c.key} className="flex items-start gap-2">
                    {c.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-foreground font-medium">{c.key}</div>
                      <div className="text-[11px] text-muted-foreground" dir="auto">{c.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* SECTION F: Support template */}
      <details className="rounded-md border border-border bg-background/80 p-3">
        <summary className="text-sm font-bold text-foreground cursor-pointer">
          טקסט מוכן לפנייה לתמיכת ימות (077-2222-100)
        </summary>
        <div className="mt-3 space-y-2">
          <textarea
            readOnly
            value={supportText}
            className="w-full h-44 px-3 py-2 rounded-md border border-border bg-muted/40 text-xs font-mono text-foreground"
            dir="rtl"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(supportText);
              toast.success("הטקסט הועתק");
            }}
            className="gap-1"
          >
            <Copy className="w-4 h-4" />
            העתק את כל ההודעה
          </Button>
        </div>
      </details>
    </Card>
  );
}
