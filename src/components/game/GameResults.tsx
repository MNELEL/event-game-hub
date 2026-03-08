import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Question, Player } from "@/types/game";
import { ArrowLeft, Check, X } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";
import { fireCorrectBurst } from "@/hooks/useConfetti";

type Props = {
  question: Question;
  players: Player[];
  onNext: () => void;
};

const answerColors = [
  "from-red-500 to-red-600",
  "from-blue-500 to-blue-600",
  "from-yellow-500 to-yellow-600",
  "from-green-500 to-green-600",
];

export function GameResults({ question, players, onNext }: Props) {
  useEffect(() => {
    SoundEffects.correct();
    fireCorrectBurst();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.h2
        className="font-display text-4xl text-primary-foreground mb-8 text-shadow-game"
        initial={{ opacity: 0, y: -30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        התשובה הנכונה! 🎉
      </motion.h2>

      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full mb-10">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctAnswer;
          return (
            <motion.div
              key={i}
              className={`bg-gradient-to-br ${answerColors[i]} rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-lg relative ${!isCorrect ? "opacity-40 grayscale" : "glow-correct"}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: isCorrect ? [0.9, 1.1, 1.05] : 0.9,
                opacity: isCorrect ? 1 : 0.4,
              }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <span className="font-display text-xl md:text-2xl text-primary-foreground font-bold flex-1">
                {opt}
              </span>
              {isCorrect && (
                <motion.div
                  className="bg-success rounded-full p-2"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.5 }}
                >
                  <Check className="w-6 h-6 text-success-foreground" />
                </motion.div>
              )}
              {!isCorrect && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.3 }}
                >
                  <X className="w-6 h-6 text-primary-foreground/40" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
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
