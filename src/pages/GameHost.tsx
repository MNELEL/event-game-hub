import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import { GameLobby } from "@/components/game/GameLobby";
import { GameQuestionDisplay } from "@/components/game/GameQuestionDisplay";
import { GameResults } from "@/components/game/GameResults";
import { GameLeaderboard } from "@/components/game/GameLeaderboard";
import { GameFinished } from "@/components/game/GameFinished";
import { Home, Loader2 } from "lucide-react";

const GameHost = () => {
  const navigate = useNavigate();
  const { questions, settings, loading: questionsLoading } = useSupabaseQuestions();
  const game = useRealtimeGame(questions, settings);
  const { gameState } = game;
  const [gameCreated, setGameCreated] = useState(false);

  // Create game session when questions are loaded
  useEffect(() => {
    if (!questionsLoading && questions.length > 0 && !gameCreated) {
      game.createGame().then(() => setGameCreated(true));
    }
  }, [questionsLoading, questions.length, gameCreated]);

  // Timer
  useEffect(() => {
    if (gameState.status !== "question" || gameState.timeRemaining <= 0) return;
    const interval = setInterval(() => game.tick(), 1000);
    return () => clearInterval(interval);
  }, [gameState.status, gameState.timeRemaining, game.tick]);

  // Auto show results when timer ends
  useEffect(() => {
    if (gameState.status === "question" && gameState.timeRemaining <= 0) {
      game.showResults();
    }
  }, [gameState.timeRemaining, gameState.status]);

  if (questionsLoading || !gameCreated) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="w-12 h-12 text-game-gold animate-spin mx-auto mb-4" />
          <p className="text-game-dark-gold/60 font-serif text-xl">מכין את המשחק...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-gradient relative overflow-hidden" dir="rtl">
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Button variant="ghost" size="icon" className="text-game-dark-gold/50 hover:text-game-dark-gold" onClick={() => navigate("/")}>
          <Home className="w-5 h-5" />
        </Button>
      </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState.status === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameLobby
              gameCode={gameState.gameCode}
              players={gameState.players}
              onAddPlayer={game.addPlayer}
              onStart={() => {
                game.startGame();
                setTimeout(() => game.showQuestion(), 100);
              }}
              questionsCount={gameState.questions.length}
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
              onTimeUp={game.showResults}
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
                  game.showLeaderboard();
                } else {
                  game.nextQuestion();
                  setTimeout(() => game.showQuestion(), 100);
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
                game.nextQuestion();
                setTimeout(() => {
                  if (game.gameState.status !== "finished") game.showQuestion();
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
              onRestart={() => {
                setGameCreated(false);
                game.resetGame();
              }}
              onHome={() => navigate("/")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameHost;
