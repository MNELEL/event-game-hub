import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Question, Player } from "@/types/game";
import { ArrowLeft, Check, X, Sparkles } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";
import { fireCorrectBurst } from "@/hooks/useConfetti";

type Props = {
  question: Question;
  players: Player[];
  onNext: () => void;
};

const answerClasses = [
  "game-answer-1",
  "game-answer-2",
  "game-answer-3",
  "game-answer-4",
];

const answerShapes = ["◆", "▲", "■", "●"];

export function GameResults({ question, players, onNext }: Props) {
  useEffect(() => {
    SoundEffects.correct();
    fireCorrectBurst();
  }, []);

  // Count how many players answered each option
  const answerCounts = question.options.map((_, i) =>
    players.filter(p => {
      const ans = p.answers.find(a => a.questionId === question.id);
      return ans?.answer === i;
    }).length
  );
  const totalAnswered = answerCounts.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Celebration particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -60], rotate: [0, 180] }}
          transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.5, repeat: 2, repeatDelay: Math.random() * 2 }}
        >
          <Sparkles className="w-4 h-4 text-game-gold" />
        </motion.div>
      ))}

      {/* Title */}
      <motion.div className="mb-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.h2
          className="font-serif text-4xl md:text-5xl text-game-dark-gold text-shadow-game"
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 12 }}
        >
          ✨ התשובה הנכונה!
        </motion.h2>
        <motion.div
          className="flex items-center justify-center gap-3 mt-3"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-game-border-gold" />
          <motion.span className="text-game-gold" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>✦</motion.span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-game-border-gold" />
        </motion.div>
      </motion.div>

      {/* Answer cards with distribution */}
      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full mb-6">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctAnswer;
          const count = answerCounts[i];
          const pct = totalAnswered > 0 ? count / totalAnswered : 0;

          return (
            <motion.div
              key={i}
              className={`${answerClasses[i]} rounded-2xl overflow-hidden shadow-lg relative border border-white/20`}
              style={{ minHeight: 90 }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: isCorrect ? 1.04 : 0.92,
                opacity: isCorrect ? 1 : 0.5,
                filter: isCorrect ? "none" : "grayscale(60%)",
              }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
            >
              {/* Fill bar animation - shows distribution */}
              <motion.div
                className="absolute inset-0 bg-black/20"
                style={{ transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
              />

              {/* Victory shimmer */}
              {isCorrect && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                  animate={{ x: ["-150%", "250%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                />
              )}

              {/* Glow ring */}
              {isCorrect && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-4 border-white/60 pointer-events-none"
                  initial={{ opacity: 0, scale: 1.2 }}
                  animate={{ opacity: [0, 1, 0.5], scale: [1.1, 1, 1] }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 p-4 md:p-6 flex items-center gap-3">
                <span className="text-2xl opacity-60 text-white">{answerShapes[i]}</span>
                <span className="font-display text-lg md:text-xl text-white font-bold flex-1">{opt}</span>
                <div className="flex flex-col items-center min-w-[40px]">
                  {isCorrect ? (
                    <motion.div
                      className="bg-white/30 rounded-full p-1"
                      initial={{ scale: 0, rotate: -270 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.6, stiffness: 300 }}
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.4 }}>
                      <X className="w-5 h-5 text-white/70" />
                    </motion.div>
                  )}
                  {/* Count badge */}
                  <motion.span
                    className="text-white font-bold text-sm mt-1 bg-black/20 rounded-full px-2 py-0.5"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
                  >
                    {count}
                  </motion.span>
                </div>
              </div>

              {/* Percentage bar at bottom */}
              <div className="relative z-10 px-4 pb-3">
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <motion.span
                  className="text-white/70 text-xs mt-1 block text-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  {Math.round(pct * 100)}%
                </motion.span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stats summary */}
      {totalAnswered > 0 && (
        <motion.div
          className="text-game-dark-gold/60 text-sm mb-4 font-serif"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
        >
          {players.filter(p => p.answers.find(a => a.questionId === question.id && a.correct)).length} מתוך {totalAnswered} ענו נכון
        </motion.div>
      )}

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 150 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
      >
        <Button variant="gold" size="xl" onClick={() => { SoundEffects.click(); onNext(); }} className="gap-3">
          <ArrowLeft className="w-5 h-5" />
          המשך
        </Button>
      </motion.div>
    </div>
  );
}
