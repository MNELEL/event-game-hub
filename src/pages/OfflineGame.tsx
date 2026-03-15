import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/hooks/useGameStore";
import { GameQuestionDisplay } from "@/components/game/GameQuestionDisplay";
import { GameFinished } from "@/components/game/GameFinished";
import { Home, WifiOff, Play, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

const OfflineGame = () => {
  const navigate = useNavigate();
  const store = useGameStore();
  const { gameState } = store;
  const [playerName, setPlayerName] = useState("");
  const [started, setStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Timer
  useEffect(() => {
    if (gameState.status !== "question" || gameState.timeRemaining <= 0 || showAnswer) return;
    const interval = setInterval(() => store.tick(), 1000);
    return () => clearInterval(interval);
  }, [gameState.status, gameState.timeRemaining, showAnswer, store.tick]);

  // Auto show answer when timer ends
  useEffect(() => {
    if (gameState.status === "question" && gameState.timeRemaining <= 0 && !showAnswer) {
      setShowAnswer(true);
    }
  }, [gameState.timeRemaining, gameState.status, showAnswer]);

  const handleStart = () => {
    if (!playerName.trim()) return;
    store.addPlayer(playerName.trim());
    store.startGame();
    setStarted(true);
    setTimeout(() => store.showQuestion(), 100);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
    store.submitAnswer(gameState.players[0]?.id || "", answerIndex);
    setShowAnswer(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowAnswer(false);
    store.nextQuestion();
    setTimeout(() => {
      if (store.gameState.status !== "finished") {
        store.showQuestion();
      }
    }, 100);
  };

  // No cached questions
  if (store.questions.length === 0) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <WifiOff className="w-16 h-16 text-game-gold mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-game-dark-gold mb-2">אין שאלות שמורות</h2>
          <p className="text-game-dark-gold/60 mb-6">יש להתחבר לאינטרנט ולפתוח את ממשק הניהול כדי לטעון שאלות</p>
          <Button variant="gold" onClick={() => navigate("/")}>חזרה לדף הבית</Button>
        </motion.div>
      </div>
    );
  }

  // Pre-game: enter name
  if (!started) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div
          className="parchment-card parchment-border-double rounded-2xl p-8 max-w-sm w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <WifiOff className="w-5 h-5 text-game-dark-gold/60" />
            <span className="text-game-dark-gold/60 text-sm">מצב אופליין</span>
          </div>
          <h1 className="font-serif text-3xl text-game-dark-gold text-center mb-2">🧠 מגה מוח</h1>
          <div className="w-24 mx-auto border-t-2 border-double border-game-border-gold mb-4" />
          <p className="text-game-dark-gold/60 text-center mb-4">
            {store.questions.length} שאלות שמורות במכשיר
          </p>
          <Input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="השם שלך"
            className="bg-white/60 border-game-border-gold/40 text-game-dark-gold text-center text-lg h-12 mb-4"
            onKeyDown={e => e.key === "Enter" && handleStart()}
          />
          <Button variant="gold" size="lg" className="w-full gap-2" onClick={handleStart} disabled={!playerName.trim()}>
            <Play className="w-5 h-5" />
            התחל משחק
          </Button>
        </motion.div>
      </div>
    );
  }

  // Finished
  if (gameState.status === "finished") {
    return (
      <GameFinished
        players={gameState.players}
        questions={gameState.questions}
        onRestart={() => {
          setStarted(false);
          setSelectedAnswer(null);
          setShowAnswer(false);
          store.resetGame();
        }}
        onHome={() => navigate("/")}
      />
    );
  }

  // Playing - show question with inline answer selection
  if (gameState.status === "question") {
    const currentQ = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQ) return null;

    const answerClasses = [
      "game-answer-1",
      "game-answer-2",
      "game-answer-3",
      "game-answer-4",
    ];

    return (
      <div className="min-h-screen game-gradient relative overflow-hidden" dir="rtl">
        <div className="absolute top-4 left-4 z-50">
          <Button variant="ghost" size="icon" className="text-game-dark-gold/50 hover:text-game-dark-gold" onClick={() => navigate("/")}>
            <Home className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {/* Question info */}
          <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-game-dark-gold/60 font-serif">
              שאלה {gameState.currentQuestionIndex + 1} מתוך {gameState.questions.length}
            </p>
            <div className="flex items-center justify-center gap-2 text-game-gold font-mono text-2xl mt-1">
              ⏱ {gameState.timeRemaining}
            </div>
          </motion.div>

          {/* Question text */}
          <motion.div
            className="parchment-card rounded-2xl p-6 max-w-lg w-full mb-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={currentQ.id}
          >
            <h2 className="font-serif text-xl md:text-2xl text-game-dark-gold leading-relaxed">
              {currentQ.text}
            </h2>
            {currentQ.mediaUrl && (
              <img src={currentQ.mediaUrl} alt="" className="mt-4 rounded-lg max-h-48 mx-auto" />
            )}
          </motion.div>

          {/* Answer options */}
          <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
            {currentQ.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === currentQ.correctAnswer;
              let extraClass = "";
              if (showAnswer) {
                if (isCorrect) extraClass = "ring-4 ring-green-400 scale-105";
                else if (isSelected && !isCorrect) extraClass = "ring-4 ring-red-400 opacity-70";
                else extraClass = "opacity-50";
              }

              return (
                <motion.button
                  key={i}
                  className={`${answerClasses[i]} rounded-xl p-4 text-white font-bold text-lg shadow-lg transition-all ${extraClass}`}
                  whileTap={!showAnswer ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswer(i)}
                  disabled={showAnswer}
                >
                  <span className="flex items-center justify-center gap-2">
                    {showAnswer && isCorrect && <CheckCircle className="w-5 h-5" />}
                    {showAnswer && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                    {option}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Next button */}
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Button variant="gold" size="lg" className="gap-2" onClick={handleNext}>
                  <ArrowLeft className="w-5 h-5" />
                  {gameState.currentQuestionIndex + 1 >= gameState.questions.length ? "סיום" : "שאלה הבאה"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineGame;
