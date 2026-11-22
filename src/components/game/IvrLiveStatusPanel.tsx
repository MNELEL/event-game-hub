import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  Radio,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Hourglass,
  HelpCircle,
} from "lucide-react";
import type { PhonePlayerRow } from "@/hooks/usePhonePlayers";

type IvrMode = "lobby" | "question" | "between" | "finished";

type Props = {
  gameStatus: "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished";
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining?: number;
  phonePlayers: PhonePlayerRow[];
  startAt: string | null;
};

type CallState =
  | "lobby_wait"        // המתנה ללובי
  | "answered"          // ענה לשאלה הנוכחית
  | "awaiting_answer"   // שאלה פתוחה — עוד לא ענה
  | "between"           // בין שאלות
  | "recovery"          // נכנס בחלון grace, חוזר לשאלה הראשונה
  | "late"              // הגיע מאוחר מדי
  | "ended";            // המשחק הסתיים

function deriveIvrMode(status: Props["gameStatus"]): IvrMode {
  if (status === "lobby") return "lobby";
  if (status === "question") return "question";
  if (status === "finished") return "finished";
  return "between";
}

function classifyCall(
  row: PhonePlayerRow,
  status: Props["gameStatus"],
  currentQuestionIndex: number,
  startAt: string | null,
): CallState {
  if (status === "finished") return "ended";
  if (!row.joined_in_lobby) return "late";

  const startMs = startAt ? new Date(startAt).getTime() : 0;
  const createdMs = new Date(row.created_at).getTime();
  if (
    (status === "question" || status === "playing") &&
    currentQuestionIndex === 0 &&
    startMs > 0 &&
    createdMs >= startMs
  ) {
    return "recovery";
  }

  if (status === "lobby" || status === "playing") return "lobby_wait";
  if (status === "question") {
    return row.last_question_index >= currentQuestionIndex ? "answered" : "awaiting_answer";
  }
  return "between";
}

const STATE_META: Record<
  CallState,
  { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  lobby_wait:      { label: "ממתין בלובי",        icon: Hourglass,   cls: "bg-slate-100 text-slate-800 border-slate-300/60" },
  answered:        { label: "ענה ✓",              icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-900 border-emerald-300/60" },
  awaiting_answer: { label: "מאזין לשאלה",         icon: HelpCircle,   cls: "bg-blue-100 text-blue-900 border-blue-300/60" },
  between:         { label: "בין שאלות",           icon: Clock,       cls: "bg-violet-100 text-violet-900 border-violet-300/60" },
  recovery:        { label: "שוחזר ✓",             icon: Sparkles,    cls: "bg-sky-100 text-sky-900 border-sky-300/60" },
  late:            { label: "מאוחר (לא יכול לענות)", icon: Clock,    cls: "bg-amber-100 text-amber-900 border-amber-300/60" },
  ended:           { label: "המשחק הסתיים",         icon: Clock,      cls: "bg-stone-100 text-stone-800 border-stone-300/60" },
};

const MODE_META: Record<IvrMode, { label: string; cls: string; pulse: boolean }> = {
  lobby:    { label: "מצב לובי — ממתין להפעלה",       cls: "bg-amber-50 text-amber-900 border-amber-300", pulse: true  },
  question: { label: "מצב שאלה פעילה",                  cls: "bg-emerald-50 text-emerald-900 border-emerald-300", pulse: true },
  between:  { label: "בין שאלות (תוצאות/דירוג)",         cls: "bg-violet-50 text-violet-900 border-violet-300", pulse: false },
  finished: { label: "המשחק הסתיים",                    cls: "bg-stone-100 text-stone-800 border-stone-300", pulse: false },
};

function formatAgo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `לפני ${s}ש'`;
  const m = Math.floor(s / 60);
  if (m < 60) return `לפני ${m} דק'`;
  const h = Math.floor(m / 60);
  return `לפני ${h} שעות`;
}

export function IvrLiveStatusPanel({
  gameStatus,
  currentQuestionIndex,
  totalQuestions,
  timeRemaining,
  phonePlayers,
  startAt,
}: Props) {
  const [open, setOpen] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const mode = deriveIvrMode(gameStatus);
  const modeMeta = MODE_META[mode];

  const calls = useMemo(() => {
    return phonePlayers
      .map((p) => ({
        row: p,
        state: classifyCall(p, gameStatus, currentQuestionIndex, startAt),
      }))
      // Eligible callers (lobby/recovery/awaiting/between/answered) first, late callers last.
      .sort((a, b) => {
        const order: CallState[] = [
          "awaiting_answer",
          "recovery",
          "answered",
          "between",
          "lobby_wait",
          "late",
          "ended",
        ];
        return order.indexOf(a.state) - order.indexOf(b.state);
      });
  }, [phonePlayers, gameStatus, currentQuestionIndex, startAt]);

  const counts = useMemo(() => {
    const c: Record<CallState, number> = {
      lobby_wait: 0, answered: 0, awaiting_answer: 0, between: 0,
      recovery: 0, late: 0, ended: 0,
    };
    for (const { state } of calls) c[state] += 1;
    return c;
  }, [calls]);

  return (
    <div className="rounded-2xl border-2 border-game-border-gold/50 bg-game-cream/50 backdrop-blur-sm shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-game-cream/70 transition"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-game-dark-gold" />
            {modeMeta.pulse && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-game-dark-gold">מצב IVR בזמן אמת</div>
            <div className={`text-xs px-2 py-0.5 rounded-full border inline-block mt-0.5 ${modeMeta.cls}`}>
              {modeMeta.label}
              {mode === "question" && (
                <span className="font-mono mr-1">
                  · שאלה {currentQuestionIndex + 1}/{totalQuestions}
                  {typeof timeRemaining === "number" && ` · ${timeRemaining}ש'`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-game-dark-gold/70 font-mono">
            <PhoneCall className="w-3.5 h-3.5 inline ml-1" />
            {calls.length}
          </span>
          {open ? <ChevronLeft className="w-4 h-4 text-game-dark-gold/60" /> : <ChevronRight className="w-4 h-4 text-game-dark-gold/60" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-game-border-gold/30"
          >
            <div className="p-4 space-y-3">
              {/* summary chips */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(counts) as CallState[])
                  .filter((s) => counts[s] > 0)
                  .map((s) => {
                    const meta = STATE_META[s];
                    const Icon = meta.icon;
                    return (
                      <span key={s} className={`text-[11px] px-2 py-1 rounded-full border inline-flex items-center gap-1 ${meta.cls}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}: {counts[s]}
                      </span>
                    );
                  })}
                {calls.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">אין שיחות פעילות כרגע</span>
                )}
              </div>

              {/* per-call list */}
              {calls.length > 0 && (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {calls.map(({ row, state }) => {
                    const meta = STATE_META[state];
                    const Icon = meta.icon;
                    const last = row.last_poll_at || row.last_answer_at || row.created_at;
                    const ago = formatAgo(now - new Date(last).getTime());
                    return (
                      <div
                        key={row.phone}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/70 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PhoneCall className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-sm" dir="ltr">
                            ***{row.phone.slice(-4)}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${meta.cls}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono shrink-0">
                          {ago}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
