import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Question, Player } from "@/types/game";
import { ArrowLeft, Check, X } from "lucide-react";

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
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.h2
        className="font-display text-4xl text-primary-foreground mb-8 text-shadow-game"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        התשובה הנכונה! 🎉
      </motion.h2>

      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full mb-10">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctAnswer;
          return (
            <motion.div
              key={i}
              className={`bg-gradient-to-br ${answerColors[i]} rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-lg relative ${!isCorrect ? "opacity-40" : "glow-correct"}`}
              initial={{ scale: 0.9 }}
              animate={{ scale: isCorrect ? 1.05 : 0.95 }}
              transition={{ delay: 0.2 }}
            >
              <span className="font-display text-xl md:text-2xl text-primary-foreground font-bold flex-1">
                {opt}
              </span>
              {isCorrect && (
                <motion.div
                  className="bg-success rounded-full p-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.5 }}
                >
                  <Check className="w-6 h-6 text-success-foreground" />
                </motion.div>
              )}
              {!isCorrect && (
                <X className="w-6 h-6 text-primary-foreground/40" />
              )}
            </motion.div>
          );
        })}
      </div>

      <Button variant="gold" size="xl" onClick={onNext} className="gap-3">
        <ArrowLeft className="w-5 h-5" />
        המשך
      </Button>
    </div>
  );
}
