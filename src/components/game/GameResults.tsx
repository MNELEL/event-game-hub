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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.h2
        className="font-serif text-4xl text-game-dark-gold mb-8 text-shadow-game"
        initial={{ opacity: 0, y: -30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        ✨ התשובה הנכונה!
      </motion.h2>

      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full mb-10">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctAnswer;
          return (
            <motion.div
              key={i}
              className={`${answerClasses[i]} rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-lg relative border border-white/20 ${!isCorrect ? "opacity-30 grayscale" : "glow-correct"}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: isCorrect ? [0.9, 1.1, 1.05] : 0.9,
                opacity: isCorrect ? 1 : 0.3,
              }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <span className="font-display text-xl md:text-2xl text-white font-bold flex-1">
                {opt}
              </span>
              {isCorrect && (
                <motion.div
                  className="bg-game-correct rounded-full p-2"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.5 }}
                >
                  <Check className="w-6 h-6 text-white" />
                </motion.div>
              )}
              {!isCorrect && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.3 }}
                >
                  <X className="w-6 h-6 text-white/40" />
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
