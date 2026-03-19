import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayerGame } from "@/hooks/usePlayerGame";
import { Wifi, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SoundEffects } from "@/hooks/useSoundEffects";

// ─── Constants ──────────────────────────────────────────────────────────────
const ANSWER_COLORS = [
  { bg: "from-red-500 to-red-700", shadow: "shadow-red-500/40", border: "border-red-400/50" },
  { bg: "from-blue-500 to-blue-700", shadow: "shadow-blue-500/40", border: "border-blue-400/50" },
  { bg: "from-amber-500 to-amber-700", shadow: "shadow-amber-500/40", border: "border-amber-400/50" },
  { bg: "from-emerald-500 to-emerald-700", shadow: "shadow-emerald-500/40", border: "border-emerald-400/50" },
];
const ANSWER_SYMBOLS = ["△", "○", "□", "✦"];

type Phase = "countdown" | "answering" | "result";

function getPlayerTitle(score: number, questionCount: number): { title: string; emoji: string; color: string } {
  const avg = questionCount > 0 ? score / questionCount : 0;
  if (avg >= 90) return { title: "מוח-על!", emoji: "🧠", color: "text-yellow-300" };
  if (avg >= 70) return { title: "אלוף הטריוויה", emoji: "🏆", color: "text-amber-400" };
  if (avg >= 50) return { title: "מומחה ידע", emoji: "⭐", color: "text-blue-300" };
  if (avg >= 30) return { title: "שחקן מבטיח", emoji: "🌟", color: "text-purple-300" };
  return { title: "חבר מהנה", emoji: "😄", color: "text-green-300" };
}

// ─── Countdown Overlay ────────────────────────────────────────────────────────
function CountdownOverlay({ num }: { num: number }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Pulsing ring */}
      <motion.div
        className="absolute w-64 h-64 rounded-full border-4 border-white/20"
        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full border-2 border-white/30"
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={num}
          className="relative z-10 flex flex-col items-center gap-4"
          initial={{ scale: 2.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span
            className="text-[10rem] font-black leading-none select-none"
            style={{
              background: num === 1
                ? "linear-gradient(135deg, #ffd700, #ff6b00)"
                : "linear-gradient(135deg, #fff, #aaa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 40px rgba(255,200,0,0.6))",
            }}
          >
            {num}
          </span>
          <p className="text-white/50 text-lg font-medium tracking-widest uppercase">
            {num === 3 ? "מוכנים?" : num === 2 ? "הכינו את עצמכם" : "עכשיו!"}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  return (
    <motion.div
      className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="text-yellow-400 text-sm">⭐</span>
      <span className="text-white font-bold tabular-nums">{score.toLocaleString()}</span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const PlayerJoin = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);
  const { state, joinGame, submitAnswer } = usePlayerGame();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdownNum, setCountdownNum] = useState(3);
  const prevQuestionIdx = useRef<number>(-1);
  const countdownTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setGameCode(code.toUpperCase());
  }, [searchParams]);

  // Trigger countdown when question index changes
  useEffect(() => {
    if (state.gameStatus !== "question") return;
    if (state.currentQuestionIndex === prevQuestionIdx.current) return;

    prevQuestionIdx.current = state.currentQuestionIndex;

    // Clear any running timers
    countdownTimers.current.forEach(clearTimeout);
    countdownTimers.current = [];

    setPhase("countdown");
    setCountdownNum(3);
    SoundEffects.countdown(3);

    const t1 = setTimeout(() => { setCountdownNum(2); SoundEffects.countdown(2); }, 1000);
    const t2 = setTimeout(() => { setCountdownNum(1); SoundEffects.countdown(1); }, 2000);
    const t3 = setTimeout(() => {
      setPhase("answering");
      SoundEffects.questionReveal();
    }, 3000);

    countdownTimers.current = [t1, t2, t3];
    return () => countdownTimers.current.forEach(clearTimeout);
  }, [state.currentQuestionIndex, state.gameStatus]);

  // When answer submitted, transition to result phase
  useEffect(() => {
    if (state.answerSubmitted && phase === "answering") {
      // Small delay for the answer button animation
      const t = setTimeout(() => setPhase("result"), 300);
      return () => clearTimeout(t);
    }
  }, [state.answerSubmitted, phase]);

  // ── Join form ────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!name.trim() || !gameCode.trim()) return;
    setJoining(true);
    const result = await joinGame(gameCode, name.trim());
    setJoining(false);
    if (result.error) {
      toast({ title: "שגיאה", description: result.error, variant: "destructive" });
    }
  };

  if (!state.connected) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div
          className="parchment-card parchment-border-double rounded-2xl p-8 max-w-sm w-full relative watercolor-corners overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-1">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="font-serif text-3xl text-game-dark-gold text-center mb-2">🧠 מגה מוח</h1>
          <div className="w-24 mx-auto border-t-2 border-double border-game-border-gold mb-4" />
          <p className="text-game-dark-gold/60 text-center mb-6">הכניסו קוד משחק ושם כדי להצטרף</p>

          <div className="space-y-3 mb-4">
            <Input
              value={gameCode}
              onChange={e => setGameCode(e.target.value.toUpperCase())}
              placeholder="קוד משחק"
              className="bg-white/60 border-game-border-gold/40 text-game-dark-gold text-center text-lg h-12 font-mono tracking-widest"
              maxLength={6}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
            />
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="השם שלך"
              className="bg-white/60 border-game-border-gold/40 text-game-dark-gold text-center text-lg h-12"
              onKeyDown={e => e.key === "Enter" && handleJoin()}
            />
          </div>

          <Button
            variant="gold"
            size="lg"
            className="w-full gap-2"
            onClick={handleJoin}
            disabled={!name.trim() || !gameCode.trim() || joining}
          >
            {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wifi className="w-5 h-5" />}
            {joining ? "מתחבר..." : "הצטרפות למשחק"}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Lobby waiting ────────────────────────────────────────────────────────
  if (state.gameStatus === "lobby") {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-4xl">🧠</span>
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">שלום {state.playerName}! 👋</h2>
          <p className="text-white/50 text-lg mb-8">מחכים שהמנחה יתחיל...</p>
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-purple-400"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Question phase ────────────────────────────────────────────────────────
  if (state.gameStatus === "question") {
    const isCountdown = phase === "countdown";
    const isResult = phase === "result";

    return (
      <div className="min-h-screen bg-[#0d0d1a] flex flex-col" dir="rtl">
        {/* Countdown overlay */}
        <AnimatePresence>
          {isCountdown && <CountdownOverlay num={countdownNum} />}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-safe">
          <div className="text-white/50 text-sm font-medium">
            שאלה {state.currentQuestionIndex + 1}/{state.questionCount || "?"}
          </div>
          <ScoreBadge score={state.playerScore} />
        </div>

        {/* Timer bar */}
        <div className="mx-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
            style={{ width: `${(state.timeRemaining / 15) * 100}%` }}
            animate={{ width: `${Math.max(0, (state.timeRemaining / 15) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {/* Result screen */}
          <AnimatePresence mode="wait">
            {isResult ? (
              <motion.div
                key="result"
                className="w-full max-w-sm flex flex-col items-center gap-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
              >
                {/* Correct / Wrong indicator */}
                {state.lastAnswerCorrect === null ? (
                  <motion.div className="text-center">
                    <div className="text-6xl mb-3">⏳</div>
                    <p className="text-white/60 text-lg">מחכים לתוצאה...</p>
                  </motion.div>
                ) : state.lastAnswerCorrect ? (
                  <motion.div className="text-center">
                    <motion.div
                      className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/40"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <span className="text-5xl">✓</span>
                    </motion.div>
                    <h3 className="text-3xl font-black text-emerald-400 mb-2">נכון! 🎉</h3>
                    {state.lastPointsEarned > 0 && (
                      <motion.p
                        className="text-yellow-400 text-xl font-bold"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        +{state.lastPointsEarned} נקודות
                      </motion.p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div className="text-center">
                    <motion.div
                      className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/40"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <span className="text-5xl">✗</span>
                    </motion.div>
                    <h3 className="text-3xl font-black text-red-400 mb-2">לא נכון 😔</h3>
                    <p className="text-white/40 text-sm">בפעם הבאה יהיה טוב יותר!</p>
                  </motion.div>
                )}

                {/* Total score card */}
                <motion.div
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-white/40 text-sm mb-1 uppercase tracking-widest">הניקוד שלך</p>
                  <motion.p
                    className="text-5xl font-black text-white tabular-nums"
                    key={state.playerScore}
                    initial={{ scale: 1.3, color: "#ffd700" }}
                    animate={{ scale: 1, color: "#ffffff" }}
                    transition={{ duration: 0.4 }}
                  >
                    {state.playerScore.toLocaleString()}
                  </motion.p>
                </motion.div>

                <p className="text-white/30 text-sm animate-pulse">מחכים לשאלה הבאה...</p>
              </motion.div>
            ) : (
              /* Answer buttons */
              <motion.div
                key="answering"
                className="w-full max-w-sm grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {ANSWER_COLORS.map((color, i) => (
                  <motion.button
                    key={i}
                    className={`bg-gradient-to-br ${color.bg} rounded-3xl h-32 flex flex-col items-center justify-center gap-2 shadow-xl ${color.shadow} border ${color.border} active:scale-95 select-none`}
                    whileTap={{ scale: 0.88, brightness: 1.2 }}
                    whileHover={{ scale: 1.03 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => {
                      SoundEffects.answerSelect();
                      submitAnswer(i, state.currentQuestionId || "", state.timeRemaining);
                    }}
                    disabled={state.answerSubmitted}
                  >
                    <span className="text-3xl text-white/80">{ANSWER_SYMBOLS[i]}</span>
                    <span className="text-4xl font-black text-white">{i + 1}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Results / Leaderboard waiting ─────────────────────────────────────────
  if (state.gameStatus === "results" || state.gameStatus === "leaderboard") {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {state.gameStatus === "leaderboard" ? "🏆" : "📊"}
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {state.gameStatus === "leaderboard" ? "טבלת מובילים" : "תוצאות"}
          </h2>
          <p className="text-white/40">הסתכלו על המסך הראשי!</p>
          <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">הניקוד שלך</p>
            <p className="text-4xl font-black text-yellow-400">{state.playerScore.toLocaleString()}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Finished ──────────────────────────────────────────────────────────────
  if (state.gameStatus === "finished") {
    const { title, emoji, color } = getPlayerTitle(state.playerScore, state.questionCount);
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center p-4 overflow-hidden" dir="rtl">
        {/* Background sparkles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl pointer-events-none"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [-20, -80], opacity: [1, 0], scale: [1, 0.5] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
          >
            {["⭐", "✨", "🌟", "💫"][i % 4]}
          </motion.div>
        ))}

        <motion.div
          className="relative z-10 text-center max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <motion.div
            className="text-8xl mb-4"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {emoji}
          </motion.div>

          <h2 className="text-3xl font-black text-white mb-1">
            {state.playerName}
          </h2>
          <p className={`text-2xl font-bold mb-6 ${color}`}>{title}</p>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-2">ניקוד סופי</p>
            <motion.p
              className="text-6xl font-black text-yellow-400 tabular-nums"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {state.playerScore.toLocaleString()}
            </motion.p>
            <p className="text-white/30 text-sm mt-2">נקודות</p>
          </div>

          <p className="text-white/30 text-sm">תודה שהשתתפת! 🎉</p>
        </motion.div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center p-4" dir="rtl">
      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-white/40 text-xl">המשחק מתחיל בקרוב...</p>
      </motion.div>
    </div>
  );
};

export default PlayerJoin;
