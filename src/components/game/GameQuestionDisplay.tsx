import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Question, DEFAULT_CATEGORIES } from "@/types/game";
import { SoundEffects } from "@/hooks/useSoundEffects";

type Props = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  onTimeUp: () => void;
};

const answerColors = [
  "from-red-500 to-red-600",
  "from-blue-500 to-blue-600",
  "from-yellow-500 to-yellow-600",
  "from-green-500 to-green-600",
];

const answerShapes = ["▲", "◆", "●", "■"];

export function GameQuestionDisplay({ question, questionNumber, totalQuestions, timeRemaining, onTimeUp }: Props) {
  const category = DEFAULT_CATEGORIES.find(c => c.id === question.category);
  const percentage = (timeRemaining / question.timeLimit) * 100;
  const hasPlayedReveal = useRef(false);

  // Play reveal sound on mount
  useEffect(() => {
    if (!hasPlayedReveal.current) {
      SoundEffects.questionReveal();
      hasPlayedReveal.current = true;
    }
  }, []);

  // Timer tick sounds
  useEffect(() => {
    if (timeRemaining <= 0) {
      SoundEffects.timeUp();
    } else if (timeRemaining <= 3) {
      SoundEffects.timerUrgent();
    } else if (timeRemaining <= 5) {
      SoundEffects.timerTick();
    }
  }, [timeRemaining]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <motion.span
          className="text-primary-foreground/60 font-display text-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          שאלה {questionNumber}/{totalQuestions}
        </motion.span>
        {category && (
          <motion.span
            className="bg-game-surface/60 text-primary-foreground/80 px-4 py-1 rounded-full text-sm font-medium"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {category.name}
          </motion.span>
        )}
      </div>

      {/* Timer with enhanced animation */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.div
          animate={timeRemaining <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeRemaining <= 5 ? Infinity : 0 }}
        >
          <svg className="w-28 h-28" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(250 50% 30%)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={timeRemaining <= 5 ? "hsl(0 80% 55%)" : "hsl(45 100% 50%)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * percentage / 100)}
              transform="rotate(-90 50 50)"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className={`font-display text-4xl font-bold ${timeRemaining <= 5 ? "text-game-wrong" : "text-game-gold"}`}
              key={timeRemaining}
              initial={{ scale: 1.3, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {timeRemaining}
            </motion.span>
          </div>
        </motion.div>
      </motion.div>

      {/* Question with enhanced entrance */}
      <motion.div
        className="bg-game-surface/60 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-4xl w-full mb-10 border border-game-glow/30"
        initial={{ opacity: 0, y: 50, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      >
        {question.mediaUrl && question.type === "image" && (
          <motion.img
            src={question.mediaUrl}
            alt=""
            className="max-h-60 mx-auto mb-6 rounded-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          />
        )}
        <h2 className="font-display text-3xl md:text-5xl text-primary-foreground text-center text-shadow-game leading-tight">
          {question.text}
        </h2>
      </motion.div>

      {/* Answers with staggered bounce */}
      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full">
        {question.options.map((opt, i) => (
          <motion.div
            key={i}
            className={`bg-gradient-to-br ${answerColors[i]} rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-lg cursor-default`}
            initial={{ opacity: 0, scale: 0.5, rotate: i % 2 === 0 ? -5 : 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              delay: 0.5 + i * 0.12,
              type: "spring",
              stiffness: 300,
              damping: 15,
            }}
            whileHover={{ scale: 1.03, y: -4 }}
          >
            <motion.span
              className="text-3xl opacity-60"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            >
              {answerShapes[i]}
            </motion.span>
            <span className="font-display text-xl md:text-2xl text-primary-foreground font-bold">
              {opt}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Timer bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-game-bg">
        <motion.div
          className={`h-full ${timeRemaining <= 5 ? "bg-game-wrong" : "bg-game-gold"}`}
          style={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>
    </div>
  );
}
