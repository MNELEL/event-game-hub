import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, AlertCircle, KeyRound, RefreshCcw, Save, Eye, EyeOff, Wand2, CheckCircle2, XCircle, Copy, Link as LinkIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CredsState = {
  configured: boolean;
  yemot_username: string | null;
  api_token_masked: string;
  webhook_secret: string | null;
  last_verified_at: string | null;
};

export function YemotCredentialsCard({ onChanged, extension }: { onChanged?: () => void; extension?: string }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "verify" | "rotate" | "rotate_apply" | "apply_only" | "check_perm" | null>(null);
  const [state, setState] = useState<CredsState | null>(null);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showUrlSecret, setShowUrlSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [permStatus, setPermStatus] = useState<{ ok: boolean; message: string } | null>(null);
  type InlineError = { source: string; message: string; details?: string } | null;
  const [inlineError, setInlineError] = useState<InlineError>(null);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);

  const setErr = (source: string, e: any, fallback: string) => {
    let message = fallback;
    let details: string | undefined;
    if (typeof e === "string") message = e;
    else if (e?.message) message = e.message;
    if (e?.details) {
      try { details = typeof e.details === "string" ? e.details : JSON.stringify(e.details, null, 2); } catch {}
    } else if (e?.raw) {
      try { details = typeof e.raw === "string" ? e.raw : JSON.stringify(e.raw, null, 2); } catch {}
    }
    setInlineError({ source, message, details });
    setInlineSuccess(null);
  };
  const setOk = (msg: string) => { setInlineSuccess(msg); setInlineError(null); };
  const clearInline = () => { setInlineError(null); setInlineSuccess(null); };

  type LiveStatus = "idle" | "checking" | "valid" | "invalid";
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [liveMessage, setLiveMessage] = useState<string>("");
  const debounceRef = useRef<number | null>(null);
  const lastCheckedTokenRef = useRef<string>("");

  const runLiveCheck = async (candidate: string) => {
    const t = candidate.trim();
    if (!t || t.length < 8) {
      setLiveStatus("idle");
      setLiveMessage("");
      return;
    }
    if (t === lastCheckedTokenRef.current) return;
    lastCheckedTokenRef.current = t;
    setLiveStatus("checking");
    setLiveMessage("בודק מול ימות...");
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "check_token", yemot_api_token: t },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any)?.ok) {
        setLiveStatus("valid");
        setLiveMessage("האסימון תקין — ניתן לשמור");
      } else {
        setLiveStatus("invalid");
        setLiveMessage((data as any)?.message || "האסימון לא תקין מול ימות");
      }
    } catch (e: any) {
      setLiveStatus("invalid");
      setLiveMessage(e?.message || "שגיאה בבדיקת האסימון");
    }
  };

  const onTokenChange = (val: string) => {
    setToken(val);
    setLiveStatus("idle");
    setLiveMessage("");
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!val.trim()) return;
    debounceRef.current = window.setTimeout(() => runLiveCheck(val), 700);
  };

  useEffect(() => () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "get" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setState(data as CredsState);
      setUsername((data as CredsState)?.yemot_username || "");
    } catch (e: any) {
      toast.error(e?.message || "טעינת האסימונים נכשלה");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!token.trim()) { setErr("שמירה", { message: "הזן אסימון API מימות לפני שמירה" }, "חסר אסימון"); return; }
    setBusy("save");
    clearInline();
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "save", yemot_username: username.trim(), yemot_api_token: token.trim() },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw { message: d.error, details: d.details, raw: d.raw };
      setOk("האסימון אומת מול ימות ונשמר בהצלחה");
      toast.success("האסימון אומת ונשמר בהצלחה");
      setToken("");
      await load();
      onChanged?.();
    } catch (e: any) {
      setErr("שמירה ואימות", e, "שמירת האסימון נכשלה");
      toast.error(e?.message || "שמירת האסימון נכשלה");
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    setBusy("verify");
    clearInline();
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "verify" },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw { message: d.error, details: d.details, raw: d.raw };
      if (d.ok) { setOk("האסימון תקין מול ימות (אומת זה עתה)"); toast.success("האסימון תקין מול ימות"); }
      else { setErr("בדיקת חיבור", { message: d.message || "האסימון לא תקין", raw: d }, "האסימון לא תקין"); toast.error(d.message || "האסימון לא תקין"); }
      await load();
    } catch (e: any) {
      setErr("בדיקת חיבור", e, "אימות נכשל");
      toast.error(e?.message || "אימות נכשל");
    } finally {
      setBusy(null);
    }
  };

  const rotate = async () => {
    if (!confirm("ליצור webhook secret חדש? לאחר מכן יש להריץ 'הגדר את השלוחה' כדי לעדכן את ext.ini בימות.")) return;
    setBusy("rotate");
    clearInline();
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "rotate_secret" },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw { message: d.error, details: d.details, raw: d.raw };
      setOk("נוצר secret חדש. הרץ עכשיו 'הגדר את השלוחה' כדי שימות ידע עליו.");
      toast.success("נוצר secret חדש.");
      await load();
      onChanged?.();
    } catch (e: any) {
      setErr("יצירת secret", e, "סיבוב הסוד נכשל");
      toast.error(e?.message || "סיבוב הסוד נכשל");
    } finally {
      setBusy(null);
    }
  };

  const rotateAndApply = async () => {
    const ext = ((extension ?? (typeof window !== "undefined" ? localStorage.getItem("yemot_extension") : null) ?? "1") || "1").replace(/[^0-9]/g, "") || "1";
    setBusy("rotate_apply");
    clearInline();
    try {
      const r1 = await supabase.functions.invoke("yemot-credentials", { body: { action: "rotate_secret" } });
      if (r1.error) throw { source: "יצירת secret", message: r1.error.message };
      const d1 = r1.data as any;
      if (d1?.error) throw { source: "יצירת secret", message: d1.error, details: d1.details, raw: d1.raw };

      const r2 = await supabase.functions.invoke("setup-yemot-extension", { body: { extension: ext } });
      if (r2.error) throw { source: `עדכון ext.ini בשלוחה ${ext}`, message: r2.error.message };
      const d2 = r2.data as any;
      if (d2?.error) throw { source: `עדכון ext.ini בשלוחה ${ext}`, message: d2.error, details: d2.details, raw: d2.raw };

      setOk(`Secret חדש נוצר ושלוחה ${ext} עודכנה אוטומטית בימות`);
      toast.success(`Secret חדש נוצר ושלוחה ${ext} עודכנה אוטומטית בימות`);
      await load();
      onChanged?.();
    } catch (e: any) {
      setErr(e?.source || "תהליך אוטומטי", e, "התהליך האוטומטי נכשל");
      toast.error(e?.message || "התהליך האוטומטי נכשל");
    } finally {
      setBusy(null);
    }
  };

  const ivrUrl = state?.webhook_secret
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/yemot-ivr?secret=${encodeURIComponent(state.webhook_secret)}`
    : null;
  const ivrUrlMasked = state?.webhook_secret
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/yemot-ivr?secret=••••${state.webhook_secret.slice(-4)}`
    : null;

  const copyUrl = async () => {
    if (!ivrUrl) return;
    try {
      await navigator.clipboard.writeText(ivrUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = ivrUrl;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setOk("ה-URL הועתק. הדבק אותו ב-api_link בפאנל ימות, או לחץ 'עדכן בימות אוטומטית'.");
    toast.success("ה-URL הועתק ללוח");
    setTimeout(() => setCopied(false), 2000);
  };

  const applyOnly = async () => {
    const ext = ((extension ?? (typeof window !== "undefined" ? localStorage.getItem("yemot_extension") : null) ?? "1") || "1").replace(/[^0-9]/g, "") || "1";
    setBusy("apply_only");
    clearInline();
    try {
      const r = await supabase.functions.invoke("setup-yemot-extension", { body: { extension: ext } });
      if (r.error) throw { source: `עדכון ext.ini בשלוחה ${ext}`, message: r.error.message };
      const d = r.data as any;
      if (d?.error) throw { source: `עדכון ext.ini בשלוחה ${ext}`, message: d.error, details: d.details, raw: d.raw };
      setOk(`api_link עודכן אוטומטית בשלוחה ${ext} בימות`);
      toast.success(`שלוחה ${ext} עודכנה בימות`);
      onChanged?.();
    } catch (e: any) {
      setErr(e?.source || "עדכון ext.ini", e, "עדכון השלוחה נכשל. ייתכן שלאסימון אין הרשאת UploadTextFile.");
      toast.error(e?.message || "עדכון השלוחה נכשל");
    } finally {
      setBusy(null);
    }
  };

  const checkUploadPermission = async () => {
    const ext = ((extension ?? (typeof window !== "undefined" ? localStorage.getItem("yemot_extension") : null) ?? "1") || "1").replace(/[^0-9]/g, "") || "1";
    setBusy("check_perm");
    clearInline();
    try {
      const r = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "check_upload_permission", extension: ext },
      });
      if (r.error) throw { source: "בדיקת הרשאת UploadTextFile", message: r.error.message };
      const d = r.data as any;
      if (d?.ok) {
        setPermStatus({ ok: true, message: d.message });
        setOk(d.message);
        toast.success("הרשאת כתיבה תקינה");
      } else {
        setPermStatus({ ok: false, message: d?.message || "אין הרשאה" });
        setErr(
          "בדיקת הרשאת UploadTextFile",
          { message: d?.message, details: d?.details, raw: d },
          "אין הרשאת UploadTextFile"
        );
        toast.error(d?.message || "אין הרשאת כתיבה");
      }
    } catch (e: any) {
      setPermStatus({ ok: false, message: e?.message || "בדיקת ההרשאה נכשלה" });
      setErr("בדיקת הרשאת UploadTextFile", e, "בדיקת ההרשאה נכשלה");
      toast.error(e?.message || "בדיקת ההרשאה נכשלה");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5 border-2 border-primary/30 bg-primary/5 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-foreground">חיבור לחשבון ימות שלי</h2>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> טוען...
        </div>
      ) : (
        <>
          <div className={`rounded-md border p-3 text-sm flex items-center gap-2 ${
            state?.configured
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-amber-500/40 bg-amber-500/5"
          }`}>
            {state?.configured ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-foreground">
                  מוגדר{state.yemot_username ? ` למערכת ${state.yemot_username}` : ""} ·
                  אסימון: <span className="font-mono">{state.api_token_masked}</span>
                  {state.last_verified_at && (
                    <span className="text-xs text-muted-foreground"> · נבדק לאחרונה {new Date(state.last_verified_at).toLocaleString("he-IL")}</span>
                  )}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-foreground">עוד לא הוזן אסימון ימות. הזן עכשיו כדי לאפשר הגדרה אוטומטית.</span>
              </>
            )}
          </div>

          <div className="rounded-md border-2 border-primary/40 bg-background/60 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <LinkIcon className="w-4 h-4 text-primary" />
              כתובת Webhook עבור api_link בימות
            </div>
            {!ivrUrl ? (
              <div className="text-xs text-muted-foreground">
                שמור אסימון API קודם — לאחר מכן ייווצר webhook secret וה-URL יוצג כאן.
              </div>
            ) : (
              <>
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={showUrlSecret ? ivrUrl : (ivrUrlMasked ?? "")}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-xs font-mono"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={copyUrl} className="gap-2">
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "הועתק!" : "העתק URL"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={applyOnly}
                    disabled={!state?.configured || !state?.last_verified_at || busy === "apply_only"}
                    title={!state?.last_verified_at ? "שמור ואמת אסימון API קודם" : "מעלה ext.ini אוטומטית לשלוחה הנוכחית"}
                    className="gap-2"
                  >
                    {busy === "apply_only" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    עדכן api_link בימות אוטומטית
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkUploadPermission}
                    disabled={!state?.configured || !state?.last_verified_at || busy === "check_perm"}
                    title="מעלה ומוחק קובץ זמני בשלוחה כדי לוודא הרשאת כתיבה לפני ההטמעה"
                    className="gap-2"
                  >
                    {busy === "check_perm" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : permStatus?.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : permStatus && !permStatus.ok ? (
                      <XCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    בדוק הרשאת UploadTextFile
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowUrlSecret((v) => !v)}
                    className="ms-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {showUrlSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showUrlSecret ? "הסתר secret" : "הצג secret"}
                  </button>
                </div>
                {permStatus && (
                  <p className={`text-xs ${permStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {permStatus.ok ? "✓ " : "✗ "}{permStatus.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  הכפתור האוטומטי דורש אסימון API מאומת עם הרשאת UploadTextFile. אחרת — העתק והדבק ידנית בפאנל ימות.
                </p>
              </>
            )}
          </div>

          {inlineSuccess && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1 text-foreground">{inlineSuccess}</div>
              <button type="button" onClick={() => setInlineSuccess(null)} className="text-xs text-muted-foreground hover:text-foreground">סגור</button>
            </div>
          )}

          {inlineError && (
            <div className="rounded-md border-2 border-destructive/50 bg-destructive/10 p-3 text-sm space-y-2">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-destructive">נכשל: {inlineError.source}</div>
                  <div className="text-foreground mt-0.5 break-words">{inlineError.message}</div>
                </div>
                <button type="button" onClick={() => setInlineError(null)} className="text-xs text-muted-foreground hover:text-foreground">סגור</button>
              </div>
              {inlineError.details && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">פרטים טכניים מימות</summary>
                  <pre className="mt-2 p-2 bg-background/60 rounded border border-border overflow-auto max-h-48 text-[11px] font-mono whitespace-pre-wrap" dir="ltr">{inlineError.details}</pre>
                </details>
              )}
              <div className="text-xs text-muted-foreground border-t border-destructive/20 pt-2">
                טיפים: ודא שהאסימון הועתק במלואו מפאנל ימות (ניהול מערכת ← API), שלא פג תוקפו, ושמספר המערכת תואם לאסימון.
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-[140px_1fr] gap-2 items-start">
            <label className="text-sm pt-2">מספר מערכת</label>
            <input
              type="text"
              inputMode="numeric"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="לדוגמה 0773456789"
              className="px-3 py-2 rounded-md border border-border bg-background text-sm font-mono"
              dir="ltr"
            />

            <label className="text-sm pt-2">אסימון API</label>
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={token}
                  onChange={(e) => onTokenChange(e.target.value)}
                  onBlur={(e) => {
                    if (debounceRef.current) window.clearTimeout(debounceRef.current);
                    runLiveCheck(e.target.value);
                  }}
                  placeholder={state?.configured ? "(השאר ריק כדי לשמור את הקיים)" : "הדבק כאן את האסימון מפאנל ימות"}
                  className={`w-full px-3 py-2 pe-9 rounded-md border bg-background text-sm font-mono ${
                    liveStatus === "valid" ? "border-emerald-500/60" :
                    liveStatus === "invalid" ? "border-destructive/60" :
                    "border-border"
                  }`}
                  dir="ltr"
                />
                <div className="absolute inset-y-0 end-2 flex items-center pointer-events-none">
                  {liveStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {liveStatus === "valid" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  {liveStatus === "invalid" && <XCircle className="w-4 h-4 text-destructive" />}
                </div>
              </div>
              {liveMessage && (
                <p className={`text-xs ${
                  liveStatus === "valid" ? "text-emerald-600 dark:text-emerald-400" :
                  liveStatus === "invalid" ? "text-destructive" :
                  "text-muted-foreground"
                }`}>
                  {liveMessage}
                </p>
              )}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showSecret ? "הסתר" : "הצג"}
                </button>
                <a
                  href="https://www.call2all.co.il/ym/Login"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  איפה משיגים אסימון? (פאנל ימות → ניהול מערכת → API)
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={!token.trim() || busy === "save"} className="gap-2">
              {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              שמור ואמת מול ימות
            </Button>
            <Button
              onClick={rotateAndApply}
              disabled={!state?.configured || busy === "rotate_apply"}
              className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {busy === "rotate_apply" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              סובב Secret והטמע אוטומטית
            </Button>
            <Button variant="outline" onClick={verify} disabled={!state?.configured || busy === "verify"} className="gap-2">
              {busy === "verify" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              בדוק חיבור
            </Button>
            <Button variant="outline" onClick={rotate} disabled={!state?.configured || busy === "rotate"} className="gap-2">
              {busy === "rotate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              צור secret בלבד (ללא הטמעה)
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
