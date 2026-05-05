import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, AlertCircle, KeyRound, RefreshCcw, Save, Eye, EyeOff, Wand2 } from "lucide-react";
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
  const [busy, setBusy] = useState<"save" | "verify" | "rotate" | "rotate_apply" | null>(null);
  const [state, setState] = useState<CredsState | null>(null);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [showSecret, setShowSecret] = useState(false);

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
    if (!token.trim()) { toast.error("הזן אסימון API מימות"); return; }
    setBusy("save");
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "save", yemot_username: username.trim(), yemot_api_token: token.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("האסימון אומת ונשמר בהצלחה");
      setToken("");
      await load();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "שמירת האסימון נכשלה");
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    setBusy("verify");
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "verify" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any).ok) toast.success("האסימון תקין מול ימות");
      else toast.error((data as any).message || "האסימון לא תקין");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "אימות נכשל");
    } finally {
      setBusy(null);
    }
  };

  const rotate = async () => {
    if (!confirm("ליצור webhook secret חדש? לאחר מכן יש להריץ 'הגדר את השלוחה' כדי לעדכן את ext.ini בימות.")) return;
    setBusy("rotate");
    try {
      const { data, error } = await supabase.functions.invoke("yemot-credentials", {
        body: { action: "rotate_secret" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("נוצר secret חדש. הרץ עכשיו 'הגדר את השלוחה' כדי שימות ידע עליו.");
      await load();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "סיבוב הסוד נכשל");
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
              <input
                type={showSecret ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={state?.configured ? "(השאר ריק כדי לשמור את הקיים)" : "הדבק כאן את האסימון מפאנל ימות"}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono"
                dir="ltr"
              />
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
            <Button variant="outline" onClick={verify} disabled={!state?.configured || busy === "verify"} className="gap-2">
              {busy === "verify" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              בדוק חיבור
            </Button>
            <Button variant="outline" onClick={rotate} disabled={!state?.configured || busy === "rotate"} className="gap-2">
              {busy === "rotate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              צור webhook secret חדש
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
