import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player, Question } from "@/types/game";
import { Trophy, RotateCcw, Home, BarChart3, Zap, Target, Clock } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";
import { fireConfetti } from "@/hooks/useConfetti";
import { GameStatsPanel } from "./GameStatsPanel";

type Props = {
  players: Player[];
  questions: Question[];
  onRestart: () => void;
  onHome: () => void;
};

export function GameFinished({ players, questions, onRestart, onHome }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const medals = ["🥇", "🥈", "🥉"];
  const [showStats, setShowStats] = useState(false);
  const [phase, setPhase] = useState<"intro" | "podium" | "stats" | "buttons">("intro");

  useEffect(() => {
    SoundEffects.victory();
    fireConfetti();
    // Sequence the reveal
    setTimeout(() => setPhase("podium"), 1200);
    setTimeout(() => setPhase("stats"), 2800);
    setTimeout(() => setPhase("buttons"), 4000);
  }, []);

  // Find fastest correct answerer
  const fastestPlayer = players.reduce<{name: string; avgTime: number} | null>((best, p) => {
    const correctAnswers = p.answers.filter(a => a.correct);
    if (correctAnswers.length === 0) return best;
    const avg = correctAnswers.reduce((s, a) => s + a.time, 0) / correctAnswers.length;
    if (!best || avg < best.avgTime) return { name: p.name, avgTime: avg };
    return best;
  }, null);

  // Most correct answers
  const mostCorrect = players.reduce<{name: string; count: number} | null>((best, p) => {
    const count = p.answers.filter(a => a.correct).length;
    if (!best || count > best.count) return { name: p.name, count };
    return best;
  }, null);

  if (showStats) {
    return (
      <div className="min-h-screen game-gradient" dir="rtl">
        <GameStatsPanel players={players} questions={questions} onClose={() => setShowStats(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      {/* Floating confetti */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl pointer-events-none select-none"
          style={{ left: `${Math.random() * 100}%`, top: -20 }}
          animate={{ y: ["0vh", "110vh"], x: [0, (i % 2 === 0 ? 1 : -1) * 40, 0], rotate: [0, 360], opacity: [0, 1, 0.5, 0] }}
          transition={{ duration: 3 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity, repeatDelay: Math.random() * 3 }}
        >
          {["🌟", "✨", "🎉", "🏆", "💫", "🎊"][i % 6]}
        </motion.div>
      ))}

      {/* INTRO - Winner announcement */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="text-8xl mb-4"
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
            >
              🏆
            </motion.div>
            <motion.h1
              className="font-serif text-4xl md:text-6xl text-game-dark-gold text-shadow-game"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {winner ? `${winner.name} ניצח!` : "המשחק הסתיים!"}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PODIUM */}
      <AnimatePresence>
        {(phase === "podium" || phase === "stats" || phase === "buttons") && (
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Title */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring" }}
            >
              <h1 className="font-serif text-4xl text-game-dark-gold text-shadow-game mb-1">🎉 כל הכבוד אלופים!</h1>
              <p className="text-game-dark-gold/60 font-serif text-lg">המשחק הסתיים — הנה התוצאות הסופיות</p>
            </motion.div>

            {/* Podium */}
            <div className="space-y-3 mb-6">
              {sorted.slice(0, Math.min(sorted.length, 5)).map((player, idx) => (
                <motion.div
                  key={player.id}
                  className={`parchment-card rounded-2xl p-4 flex items-center gap-4 ${idx === 0 ? "border-2 border-game-gold shadow-lg" : ""}`}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -60 : 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15, type: "spring", stiffness: 200 }}
                >
                  <span className="text-3xl">{medals[idx] || `${idx + 1}.`}</span>
                  <div className="flex-1">
                    <div className="font-serif text-xl text-game-dark-gold font-bold">{player.name}</div>
                    <div className="text-game-dark-gold/50 text-sm">
                      {player.answers.filter(a => a.correct).length} תשובות נכונות מתוך {player.answers.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.div
                      className="font-display text-2xl text-game-gold font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + idx * 0.15, type: "spring", stiffness: 300 }}
                    >
                      {player.score}
                    </motion.div>
                    <div className="text-game-dark-gold/40 text-xs">נקודות</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats cards */}
            <AnimatePresence>
              {(phase === "stats" || phase === "buttons") && (
                <motion.div
                  className="grid grid-cols-2 gap-3 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {fastestPlayer && (
                    <motion.div
                      className="parchment-card rounded-xl p-3 text-center"
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Zap className="w-6 h-6 text-game-gold mx-auto mb-1" />
                      <div className="text-xs text-game-dark-gold/50 mb-1">הכי מהיר</div>
                      <div className="font-serif text-game-dark-gold font-bold text-sm">{fastestPlayer.name}</div>
                      <div className="text-game-dark-gold/40 text-xs">{fastestPlayer.avgTime.toFixed(1)}ש׳ ממוצע</div>
                    </motion.div>
                  )}
                  {mostCorrect && mostCorrect.count > 0 && (
                    <motion.div
                      className="parchment-card rounded-xl p-3 text-center"
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    >
                      <Target className="w-6 h-6 text-game-gold mx-auto mb-1" />
                      <div className="text-xs text-game-dark-gold/50 mb-1">הכי מדויק</div>
                      <div className="font-serif text-game-dark-gold font-bold text-sm">{mostCorrect.name}</div>
                      <div className="text-game-dark-gold/40 text-xs">{mostCorrect.count} תשובות נכונות</div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <AnimatePresence>
              {phase === "buttons" && (
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button variant="gold" size="xl" onClick={() => { SoundEffects.click(); setShowStats(true); }} className="gap-3">
                    <BarChart3 className="w-5 h-5" />
                    סטטיסטיקות
                  </Button>
                  <Button variant="game" size="xl" onClick={() => { SoundEffects.click(); onRestart(); }} className="gap-3">
                    <RotateCcw className="w-5 h-5" />
                    משחק חדש
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => { SoundEffects.click(); onHome(); }} className="gap-3">
                    <Home className="w-5 h-5" />
                    בית
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
