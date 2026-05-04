import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TestTube2, Loader2, Phone, CheckCircle2, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SimResult = {
  ok: true;
  simulated: boolean;
  phone_tail: string;
  game: {
    id: string;
    status: string;
    question_index: number;
    question_total: number;
    start_at: string | null;
  };
  joiner: { kind: "normal" | "recovery" | "late" | "absent"; description: string };
  first_decision: { kind: string; text: string; seconds?: number };
  second_decision: { kind: string; text: string; seconds?: number } | null;
};

const SAMPLE_PHONE = "0500000000";

function joinerBadge(kind: SimResult["joiner"]["kind"]) {
  switch (kind) {
    case "normal":
      return (
        <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300/60 hover:bg-emerald-100">
          <CheckCircle2 className="w-3 h-3 ml-1" /> מתקשר רגיל
        </Badge>
      );
    case "recovery":
      return (
        <Badge className="bg-sky-100 text-sky-900 border border-sky-300/60 hover:bg-sky-100">
          <Sparkles className="w-3 h-3 ml-1" /> שוחזר ✓
        </Badge>
      );
    case "late":
      return (
        <Badge className="bg-amber-100 text-amber-900 border border-amber-300/60 hover:bg-amber-100">
          <Clock className="w-3 h-3 ml-1" /> מאוחר
        </Badge>
      );
    case "absent":
      return (
        <Badge variant="outline">
          <Phone className="w-3 h-3 ml-1" /> טרם חייג
        </Badge>
      );
  }
}

function decisionLabel(kind: string): string {
  switch (kind) {
    case "wait":         return "השמעת הודעה והמתנה";
    case "answer":       return "השמעת שאלה וקבלת ספרה";
    case "silent":       return "שתיקה (סקר רקע)";
    case "hangup":       return "ניתוק שיחה";
    case "submitAnswer": return "שליחת תשובה לציון";
    default:             return kind;
  }
}

export function IvrTestCallButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(SAMPLE_PHONE);
  const [action, setAction] = useState<"join" | "answer">("join");
  const [digit, setDigit] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke<SimResult>(
        "yemot-ivr-simulate",
        { body: { phone, action, digit: action === "answer" ? digit : undefined } },
      );
      if (invokeErr) throw invokeErr;
      if (!data || (data as { error?: string }).error) {
        throw new Error((data as { error?: string })?.error || "שגיאה בלתי צפויה");
      }
      setResult(data);
      toast.success("בדיקת חיוג הסתיימה");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "שגיאה בבדיקה";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className="text-game-dark-gold/70 hover:text-game-dark-gold gap-1"
          title="בדיקת חיוג IVR — הצגת ההודעה שהמתקשר היה שומע"
        >
          <TestTube2 className="w-4 h-4" />
          {!compact && <span>בדיקת חיוג</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-game-gold" />
            בדיקת חיוג IVR
          </DialogTitle>
          <DialogDescription>
            סימולציה של חיוג למערכת — מציגה את ההודעה המדויקת שהמתקשר היה שומע, בלי לבצע חיוג אמיתי.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">מספר טלפון לבדיקה</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-mono"
              dir="ltr"
              placeholder={SAMPLE_PHONE}
            />
            <p className="text-[11px] text-muted-foreground">
              ברירת המחדל היא מספר Sandbox. אם הוזן מספר של מתקשר אמיתי שכבר חייג — הסימולציה תשתמש במצב שלו ב-DB.
            </p>
          </div>

          <Tabs value={action} onValueChange={(v) => setAction(v as "join" | "answer")}>
            <TabsList className="w-full">
              <TabsTrigger value="join" className="flex-1">תרחיש: הצטרפות</TabsTrigger>
              <TabsTrigger value="answer" className="flex-1">תרחיש: שליחת תשובה</TabsTrigger>
            </TabsList>
            <TabsContent value="answer" className="pt-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">ספרת תשובה</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((d) => (
                    <Button
                      key={d}
                      type="button"
                      variant={digit === d ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDigit(d as 1 | 2 | 3 | 4)}
                      className="w-12"
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={runTest}
            disabled={loading}
            className="w-full gap-2 bg-game-gold hover:bg-game-dark-gold text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
            הרץ בדיקה
          </Button>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3 rounded-lg border border-game-border-gold/40 bg-game-cream/40 p-4"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">סיווג:</span>
                  {joinerBadge(result.joiner.kind)}
                  {result.simulated && (
                    <Badge variant="outline" className="text-[10px]">סימולציה (לא רשום ב-DB)</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{result.joiner.description}</p>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    מצב משחק: <span className="font-mono text-foreground">{result.game.status}</span>
                    {" · "}שאלה {result.game.question_index + 1}/{result.game.question_total}
                  </div>
                </div>

                <div className="rounded-md border border-border bg-background p-3 space-y-1">
                  <div className="text-[11px] text-muted-foreground">
                    🔊 פעולה: <span className="font-bold">{decisionLabel(result.first_decision.kind)}</span>
                    {result.first_decision.seconds != null && ` · ${result.first_decision.seconds}ש'`}
                  </div>
                  <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {result.first_decision.text}
                  </div>
                </div>

                {result.second_decision && (
                  <div className="rounded-md border border-emerald-300/40 bg-emerald-50/60 p-3 space-y-1">
                    <div className="text-[11px] text-emerald-800">
                      ➜ פעולה שנייה: <span className="font-bold">{decisionLabel(result.second_decision.kind)}</span>
                      {result.second_decision.seconds != null && ` · ${result.second_decision.seconds}ש'`}
                    </div>
                    <div className="text-sm leading-relaxed text-emerald-900 whitespace-pre-wrap">
                      {result.second_decision.text}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
