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

const answerClasses = [
  "game-answer-1",
  "game-answer-2",
  "game-answer-3",
  "game-answer-4",
];

const answerShapes = ["▲", "◆", "●", "■"];

export function GameQuestionDisplay({ question, questionNumber, totalQuestions, timeRemaining, onTimeUp }: Props) {
  const category = DEFAULT_CATEGORIES.find(c => c.id === question.category);
  const percentage = (timeRemaining / question.timeLimit) * 100;
  const hasPlayedReveal = useRef(false);

  useEffect(() => {
    if (!hasPlayedReveal.current) {
      SoundEffects.questionReveal();
      hasPlayedReveal.current = true;
    }
  }, []);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <motion.span
          className="text-game-dark-gold/70 font-serif text-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          שאלה {questionNumber}/{totalQuestions}
        </motion.span>
        {category && (
          <motion.span
            className="bg-game-cream border border-game-border-gold/40 text-game-dark-gold px-4 py-1 rounded-full text-sm font-medium"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {category.name}
          </motion.span>
        )}
      </div>

      {/* Timer */}
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
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(38 40% 82%)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={timeRemaining <= 5 ? "hsl(0 70% 50%)" : "hsl(35 55% 53%)"}
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
              className={`font-serif text-4xl font-bold ${timeRemaining <= 5 ? "text-game-wrong" : "text-game-dark-gold"}`}
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

      {/* Question card */}
      <motion.div
        className="parchment-card parchment-border-double rounded-2xl p-8 md:p-12 max-w-4xl w-full mb-10 relative watercolor-corners overflow-hidden"
        initial={{ opacity: 0, y: 50, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      >
        {question.mediaUrl && question.type === "image" && (
          <motion.img
            src={question.mediaUrl}
            alt=""
            className="max-h-60 mx-auto mb-6 rounded-xl border-4 border-white shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          />
        )}
        <h2 className="font-serif text-3xl md:text-5xl text-game-dark-gold text-center text-shadow-game leading-tight">
          {question.text}
        </h2>
      </motion.div>

      {/* Answers */}
      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full">
        {question.options.map((opt, i) => (
          <motion.div
            key={i}
            className={`${answerClasses[i]} rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-lg cursor-default border border-white/20`}
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
              className="text-3xl opacity-60 text-white"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            >
              {answerShapes[i]}
            </motion.span>
            <span className="font-display text-xl md:text-2xl text-white font-bold">
              {opt}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Timer bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-game-surface">
        <motion.div
          className={`h-full ${timeRemaining <= 5 ? "bg-game-wrong" : "bg-game-gold"}`}
          style={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>
    </div>
  );
}
