import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const answerShapes = ["◆", "▲", "■", "●"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.8 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

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
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dramatic entrance overlay */}
      <motion.div
        className="fixed inset-0 bg-game-dark-gold/30 z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <motion.span
          className="text-game-dark-gold/70 font-serif text-lg"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
        >
          שאלה {questionNumber}/{totalQuestions}
        </motion.span>
        {category && (
          <motion.span
            className="bg-game-cream border border-game-border-gold/40 text-game-dark-gold px-4 py-1 rounded-full text-sm font-medium"
            initial={{ opacity: 0, x: 40, scale: 0.5 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          >
            {category.name}
          </motion.span>
        )}
      </div>

      {/* Timer with dramatic entrance */}
      <motion.div
        className="relative mb-8"
        variants={itemVariants}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.div
          animate={timeRemaining <= 5 ? {
            scale: [1, 1.15, 1],
            rotate: [0, -3, 3, 0],
          } : {}}
          transition={{ duration: 0.5, repeat: timeRemaining <= 5 ? Infinity : 0 }}
        >
          <svg className="w-28 h-28" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(38 40% 82%)" strokeWidth="6" />
            <motion.circle
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
            <AnimatePresence mode="popLayout">
              <motion.span
                className={`font-serif text-4xl font-bold ${timeRemaining <= 5 ? "text-game-wrong" : "text-game-dark-gold"}`}
                key={timeRemaining}
                initial={{ scale: 2, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 10 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              >
                {timeRemaining}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Question card with 3D flip-in */}
      <motion.div
        className="parchment-card parchment-border-double rounded-2xl p-8 md:p-12 max-w-4xl w-full mb-10 relative watercolor-corners overflow-hidden"
        initial={{ opacity: 0, rotateX: 90, y: 60 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 80, damping: 14 }}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      >
        {/* Shimmer effect on card */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
          initial={{ x: "-150%" }}
          animate={{ x: "250%" }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
        />

        {question.mediaUrl && question.type === "image" && (
          <motion.img
            src={question.mediaUrl}
            alt=""
            className="max-h-60 mx-auto mb-6 rounded-xl border-4 border-white shadow-lg"
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
          />
        )}
        <motion.h2
          className="font-serif text-3xl md:text-5xl text-game-dark-gold text-center text-shadow-game leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {question.text}
        </motion.h2>
      </motion.div>

      {/* Answers with staggered bounce-in */}
      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full">
        {question.options.map((opt, i) => (
          <motion.div
            key={i}
            className={`${answerClasses[i]} rounded-2xl p-6 md:p-8 flex items-center gap-4 shadow-lg cursor-default border border-white/20`}
            initial={{
              opacity: 0,
              scale: 0,
              x: i % 2 === 0 ? -100 : 100,
              y: i < 2 ? -50 : 50,
              rotate: (i % 2 === 0 ? -15 : 15),
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              rotate: 0,
            }}
            transition={{
              delay: 0.6 + i * 0.12,
              type: "spring",
              stiffness: 250,
              damping: 18,
            }}
            whileHover={{
              scale: 1.05,
              y: -6,
              boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
              transition: { duration: 0.2 },
            }}
          >
            <motion.span
              className="text-3xl opacity-60 text-white"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 6 + i * 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, delay: i * 0.3 },
              }}
            >
              {answerShapes[i]}
            </motion.span>
            <span className="font-display text-xl md:text-2xl text-white font-bold">
              {opt}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Timer bar at bottom with glow */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-game-surface overflow-hidden">
        <motion.div
          className={`h-full ${timeRemaining <= 5 ? "bg-game-wrong" : "bg-game-gold"} relative`}
          style={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "linear" }}
        >
          <motion.div
            className="absolute inset-0 bg-white/30"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
