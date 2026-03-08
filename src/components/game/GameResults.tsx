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

export function GameResults({ question, players, onNext }: Props) {
  useEffect(() => {
    SoundEffects.correct();
    fireCorrectBurst();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Celebration particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -60],
            rotate: [0, 180],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: Math.random() * 0.5,
            repeat: 2,
            repeatDelay: Math.random() * 2,
          }}
        >
          <Sparkles className="w-4 h-4 text-game-gold" />
        </motion.div>
      ))}

      {/* Title with dramatic reveal */}
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.h2
          className="font-serif text-4xl md:text-5xl text-game-dark-gold text-shadow-game"
          initial={{ opacity: 0, y: -50, scale: 0.3, rotateX: 90 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 12 }}
        >
          ✨ התשובה הנכונה!
        </motion.h2>

        {/* Decorative line */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-game-border-gold" />
          <motion.span
            className="text-game-gold"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            ✦
          </motion.span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-game-border-gold" />
        </motion.div>
      </motion.div>

      {/* Answer cards with dramatic correct/wrong reveal */}
      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full mb-10">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctAnswer;
          return (
            <motion.div
              key={i}
              className={`${answerClasses[i]} rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-lg relative border border-white/20 overflow-hidden`}
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: isCorrect ? 1.05 : 0.9,
                opacity: isCorrect ? 1 : 0.25,
                filter: isCorrect ? "none" : "grayscale(100%)",
              }}
              transition={{
                delay: 0.3 + i * 0.1,
                type: "spring",
                stiffness: 200,
              }}
            >
              {/* Victory shimmer on correct answer */}
              {isCorrect && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                  animate={{ x: ["-150%", "250%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                />
              )}

              {/* Glow ring on correct */}
              {isCorrect && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-4 border-game-correct pointer-events-none"
                  initial={{ opacity: 0, scale: 1.2 }}
                  animate={{
                    opacity: [0, 1, 0.5],
                    scale: [1.1, 1, 1],
                  }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                />
              )}

              <span className="font-display text-xl md:text-2xl text-white font-bold flex-1 relative z-10">
                {opt}
              </span>
              {isCorrect && (
                <motion.div
                  className="bg-game-correct rounded-full p-2 relative z-10"
                  initial={{ scale: 0, rotate: -270 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.6, stiffness: 300 }}
                >
                  <Check className="w-6 h-6 text-white" />
                </motion.div>
              )}
              {!isCorrect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <X className="w-6 h-6 text-white/50" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 150 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button variant="gold" size="xl" onClick={() => { SoundEffects.click(); onNext(); }} className="gap-3">
          <ArrowLeft className="w-5 h-5" />
          המשך
        </Button>
      </motion.div>
    </div>
  );
}
