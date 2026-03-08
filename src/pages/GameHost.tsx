import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/hooks/useGameStore";
import { GameLobby } from "@/components/game/GameLobby";
import { GameQuestionDisplay } from "@/components/game/GameQuestionDisplay";
import { GameResults } from "@/components/game/GameResults";
import { GameLeaderboard } from "@/components/game/GameLeaderboard";
import { GameFinished } from "@/components/game/GameFinished";
import { Home, ArrowRight } from "lucide-react";

const GameHost = () => {
  const navigate = useNavigate();
  const store = useGameStore();
  const { gameState } = store;

  // Timer
  useEffect(() => {
    if (gameState.status !== "question" || gameState.timeRemaining <= 0) return;
    const interval = setInterval(() => store.tick(), 1000);
    return () => clearInterval(interval);
  }, [gameState.status, gameState.timeRemaining, store.tick]);

  // Auto show results when timer ends
  useEffect(() => {
    if (gameState.status === "question" && gameState.timeRemaining <= 0) {
      store.showResults();
    }
  }, [gameState.timeRemaining, gameState.status]);

  return (
    <div className="min-h-screen game-gradient relative overflow-hidden" dir="rtl">
      {/* Minimal top bar */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Button variant="ghost" size="icon" className="text-primary-foreground/50 hover:text-primary-foreground" onClick={() => navigate("/")}>
          <Home className="w-5 h-5" />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {gameState.status === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameLobby
              gameCode={gameState.gameCode}
              players={gameState.players}
              onAddPlayer={store.addPlayer}
              onStart={() => {
                store.startGame();
                setTimeout(() => store.showQuestion(), 100);
              }}
              questionsCount={store.questions.length}
            />
          </motion.div>
        )}

        {gameState.status === "question" && (
          <motion.div key="question" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <GameQuestionDisplay
              question={gameState.questions[gameState.currentQuestionIndex]}
              questionNumber={gameState.currentQuestionIndex + 1}
              totalQuestions={gameState.questions.length}
              timeRemaining={gameState.timeRemaining}
              onTimeUp={store.showResults}
            />
          </motion.div>
        )}

        {gameState.status === "results" && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameResults
              question={gameState.questions[gameState.currentQuestionIndex]}
              players={gameState.players}
              onNext={() => {
                if (gameState.settings.showLeaderboardAfterEach) {
                  store.showLeaderboard();
                } else {
                  store.nextQuestion();
                  setTimeout(() => store.showQuestion(), 100);
                }
              }}
            />
          </motion.div>
        )}

        {gameState.status === "leaderboard" && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameLeaderboard
              players={gameState.players}
              onNext={() => {
                store.nextQuestion();
                setTimeout(() => {
                  if (store.gameState.status !== "finished") store.showQuestion();
                }, 100);
              }}
              isFinal={false}
            />
          </motion.div>
        )}

        {gameState.status === "finished" && (
          <motion.div key="finished" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameFinished
              players={gameState.players}
              onRestart={store.resetGame}
              onHome={() => navigate("/")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameHost;
