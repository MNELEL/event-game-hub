import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Users,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import type { PhonePlayerRow } from "@/hooks/usePhonePlayers";
import { getCallerSyncState } from "./IvrSyncIndicator";
import { IvrTestCallButton } from "./IvrTestCallButton";

type GameStatus = "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished";

type Props = {
  gameStatus: GameStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionText?: string;
  timeRemaining?: number;
  screenPlayersCount: number;
  phonePlayers: PhonePlayerRow[];
  startAt: string | null;
};

const STATUS_LABELS: Record<GameStatus, string> = {
  lobby:       "לובי — ממתין להפעלה",
  playing:     "המשחק התחיל",
  question:    "שאלה פעילה",
  results:     "תוצאות שאלה",
  leaderboard: "טבלת מובילים",
  finished:    "המשחק הסתיים",
};

type JoinerKind = "normal" | "recovery" | "late";

/**
 * Mirror of `classifyJoiner` from the IVR — computed locally so the host UI can
 * show real-time grouping without round-tripping through an edge function.
 */
function classifyClientSide(
  row: PhonePlayerRow,
  startAt: string | null,
  status: GameStatus,
  currentQuestionIndex: number,
): JoinerKind {
  if (!row.joined_in_lobby) return "late";
  const startMs = startAt ? new Date(startAt).getTime() : 0;
  const createdMs = new Date(row.created_at).getTime();
  const isFirstQuestionPhase = status === "question" || status === "playing";
  if (
    isFirstQuestionPhase &&
    currentQuestionIndex === 0 &&
    startMs > 0 &&
    createdMs >= startMs
  ) {
    return "recovery";
  }
  return "normal";
}

export function HostLiveStatusPanel({
  gameStatus,
  currentQuestionIndex,
  totalQuestions,
  questionText,
  timeRemaining,
  screenPlayersCount,
  phonePlayers,
  startAt,
}: Props) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const groups = useMemo(() => {
    const normal: PhonePlayerRow[] = [];
    const recovery: PhonePlayerRow[] = [];
    const late: PhonePlayerRow[] = [];
    for (const p of phonePlayers) {
      const k = classifyClientSide(p, startAt, gameStatus, currentQuestionIndex);
      if (k === "recovery") recovery.push(p);
      else if (k === "late") late.push(p);
      else normal.push(p);
    }
    return { normal, recovery, late };
  }, [phonePlayers, startAt, gameStatus, currentQuestionIndex]);

  const totalEligible = groups.normal.length + groups.recovery.length;
  const showRecoveryProof = groups.recovery.length > 0;

  return (
    <>
      {/* Floating tab on the left edge */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-game-gold/90 hover:bg-game-gold text-white px-2 py-3 rounded-l-none rounded-r-md shadow-lg flex flex-col items-center gap-1.5 backdrop-blur"
        aria-label="פתח לוח סטטוס"
        title="לוח סטטוס Live"
      >
        <Activity className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-wider [writing-mode:vertical-rl] [text-orientation:mixed]">
          LIVE
        </span>
        {showRecoveryProof && (
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_8px_2px_rgba(125,211,252,0.7)]"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[min(92vw,420px)] bg-game-cream border-r-4 border-game-border-gold/60 shadow-2xl overflow-y-auto"
              dir="rtl"
            >
              <div className="sticky top-0 bg-game-cream/95 backdrop-blur z-10 border-b border-game-border-gold/40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-game-gold" />
                  <h2 className="font-serif text-lg text-game-dark-gold">לוח סטטוס Live</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-game-dark-gold/60 hover:text-game-dark-gold p-1 rounded"
                  aria-label="סגור"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Game status */}
                <section className="parchment-card rounded-lg p-3">
                  <div className="text-xs text-game-dark-gold/60 mb-1">מצב משחק</div>
                  <div className="font-serif text-lg text-game-dark-gold">
                    {STATUS_LABELS[gameStatus] ?? gameStatus}
                  </div>
                  {(gameStatus === "question" || gameStatus === "results") && (
                    <div className="text-sm text-game-dark-gold/70 mt-1">
                      שאלה {currentQuestionIndex + 1} מתוך {totalQuestions}
                      {timeRemaining != null && gameStatus === "question" && (
                        <span className="mr-2 font-mono">· ⏱ {timeRemaining}ש'</span>
                      )}
                    </div>
                  )}
                </section>

                {/* Current question */}
                {questionText && (gameStatus === "question" || gameStatus === "results") && (
                  <section className="parchment-card rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-4 h-4 text-game-gold" />
                      <span className="text-xs text-game-dark-gold/60">שאלה נוכחית</span>
                    </div>
                    <p className="text-sm text-game-dark-gold leading-relaxed">{questionText}</p>
                  </section>
                )}

                {/* Player counts */}
                <section className="grid grid-cols-2 gap-2">
                  <div className="parchment-card rounded-lg p-3 text-center">
                    <Users className="w-4 h-4 text-game-gold mx-auto mb-1" />
                    <div className="text-2xl font-bold text-game-dark-gold tabular-nums">
                      {screenPlayersCount}
                    </div>
                    <div className="text-[10px] text-game-dark-gold/60">שחקנים במסך</div>
                  </div>
                  <div className="parchment-card rounded-lg p-3 text-center">
                    <Phone className="w-4 h-4 text-game-gold mx-auto mb-1" />
                    <div className="text-2xl font-bold text-game-dark-gold tabular-nums">
                      {totalEligible}
                    </div>
                    <div className="text-[10px] text-game-dark-gold/60">מתקשרים פעילים</div>
                  </div>
                </section>

                {/* IVR caller breakdown */}
                <section className="parchment-card rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-game-gold" />
                      <h3 className="font-serif text-sm text-game-dark-gold">מתקשרי IVR</h3>
                    </div>
                    <span className="text-[11px] text-game-dark-gold/60">
                      {phonePlayers.length} סה"כ
                    </span>
                  </div>

                  {phonePlayers.length === 0 ? (
                    <p className="text-xs text-game-dark-gold/50">אין עדיין מתקשרים.</p>
                  ) : (
                    <div className="space-y-2">
                      <CallerGroup
                        title="רגילים"
                        Icon={CheckCircle2}
                        callers={groups.normal}
                        currentQuestionIndex={currentQuestionIndex}
                        now={now}
                        toneClass="bg-emerald-50/60 border-emerald-300/40 text-emerald-900"
                        dotClass="bg-emerald-500"
                      />
                      <CallerGroup
                        title="שוחזרו (Recovery) — ✓ נכנסו אחרי 'הפעלה'"
                        Icon={Sparkles}
                        callers={groups.recovery}
                        currentQuestionIndex={currentQuestionIndex}
                        now={now}
                        toneClass="bg-sky-50/70 border-sky-300/50 text-sky-900"
                        dotClass="bg-sky-500"
                        emphasize
                      />
                      <CallerGroup
                        title="מאוחרים — ימתינו למשחק הבא"
                        Icon={Clock}
                        callers={groups.late}
                        currentQuestionIndex={currentQuestionIndex}
                        now={now}
                        toneClass="bg-amber-50/70 border-amber-300/50 text-amber-900"
                        dotClass="bg-amber-500"
                      />
                    </div>
                  )}
                </section>

                {/* Tools */}
                <section className="parchment-card rounded-lg p-3 space-y-2">
                  <h3 className="font-serif text-sm text-game-dark-gold mb-1">כלי בדיקה</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <IvrTestCallButton />
                    <a
                      href="https://github.com/lovable-dev/IVR_HEBREW_GUIDE"
                      onClick={(e) => {
                        e.preventDefault();
                        // Try to open the local md doc — falls back to a toast in dev.
                        window.open("/docs/IVR_HEBREW_GUIDE.md", "_blank", "noopener");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-game-dark-gold/80 hover:text-game-dark-gold underline-offset-2 hover:underline"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      מדריך IVR בעברית
                    </a>
                  </div>
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function CallerGroup({
  title,
  Icon,
  callers,
  currentQuestionIndex,
  now,
  toneClass,
  dotClass,
  emphasize,
}: {
  title: string;
  Icon: typeof CheckCircle2;
  callers: PhonePlayerRow[];
  currentQuestionIndex: number;
  now: number;
  toneClass: string;
  dotClass: string;
  emphasize?: boolean;
}) {
  if (callers.length === 0) return null;
  return (
    <div className={`rounded-md border ${toneClass} px-2.5 py-2`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className={`text-[11px] ${emphasize ? "font-bold" : "font-medium"}`}>
          {title} · {callers.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {callers.map((p) => {
          const sync = getCallerSyncState(p, currentQuestionIndex, now);
          const syncDot =
            sync === "synced"
              ? "bg-emerald-500"
              : sync === "lagging"
              ? "bg-amber-500"
              : "bg-rose-500";
          return (
            <span
              key={p.phone}
              className="inline-flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5 text-[11px] font-mono direction-ltr border border-current/10"
              title={`סנכרון IVR: ${sync}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${syncDot}`} />
              …{p.phone.slice(-4)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
