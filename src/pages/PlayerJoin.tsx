import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayerGame } from "@/hooks/usePlayerGame";
import { Wifi, Loader2, CheckCircle, Clock, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SoundEffects } from "@/hooks/useSoundEffects";

const answerClasses = [
  "game-answer-1",
  "game-answer-2",
  "game-answer-3",
  "game-answer-4",
];
const answerLabels = ["1", "2", "3", "4"];

const PlayerJoin = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setGameCode(code.toUpperCase());
  }, [searchParams]);
  const { state, joinGame, submitAnswer } = usePlayerGame();
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleJoin = async () => {
    if (!name.trim() || !gameCode.trim()) return;
    setJoining(true);
    const result = await joinGame(gameCode, name.trim());
    setJoining(false);
    if (result.error) {
      toast({ title: "שגיאה", description: result.error, variant: "destructive" });
    }
  };

  // Not connected yet - show join form
  if (!state.connected) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div
          className="parchment-card parchment-border-double rounded-2xl p-8 max-w-sm w-full relative watercolor-corners overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-1">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="font-serif text-3xl text-game-dark-gold text-center mb-2">🧠 מגה מוח</h1>
          <div className="w-24 mx-auto border-t-2 border-double border-game-border-gold mb-4" />
          <p className="text-game-dark-gold/60 text-center mb-6">הכניסו קוד משחק ושם כדי להצטרף</p>
          
          <div className="space-y-3 mb-4">
            <Input
              value={gameCode}
              onChange={e => setGameCode(e.target.value.toUpperCase())}
              placeholder="קוד משחק"
              className="bg-white/60 border-game-border-gold/40 text-game-dark-gold text-center text-lg h-12 font-mono tracking-widest"
              maxLength={6}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
            />
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="השם שלך"
              className="bg-white/60 border-game-border-gold/40 text-game-dark-gold text-center text-lg h-12"
              onKeyDown={e => e.key === "Enter" && handleJoin()}
            />
          </div>
          
          <Button
            variant="gold"
            size="lg"
            className="w-full gap-2"
            onClick={handleJoin}
            disabled={!name.trim() || !gameCode.trim() || joining}
          >
            {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wifi className="w-5 h-5" />}
            {joining ? "מתחבר..." : "הצטרפות למשחק"}
          </Button>
        </motion.div>
      </div>
    );
  }

  // Connected - waiting in lobby
  if (state.gameStatus === "lobby") {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CheckCircle className="w-16 h-16 text-game-gold mx-auto mb-4" />
          <h2 className="font-serif text-3xl text-game-dark-gold mb-2">שלום {state.playerName}! 👋</h2>
          <p className="text-game-dark-gold/60 text-lg mb-6">מחכים שהמשחק יתחיל...</p>
          <motion.div
            className="w-8 h-8 border-4 border-game-gold/30 border-t-game-gold rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  // Game in question mode - show answer buttons
  if (state.gameStatus === "question") {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center p-4" dir="rtl">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-game-dark-gold">שאלה {state.currentQuestionIndex + 1}</h2>
            <div className="flex items-center gap-1 text-game-dark-gold/60">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{state.timeRemaining}</span>
            </div>
          </div>

          {state.answerSubmitted ? (
            <motion.div
              className="text-center py-12"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <CheckCircle className="w-20 h-20 text-game-gold mx-auto mb-4" />
              <p className="text-game-dark-gold font-serif text-2xl">תשובה נשלחה!</p>
              <p className="text-game-dark-gold/60 mt-2">מחכים לתוצאות...</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {answerLabels.map((label, i) => (
                <motion.button
                  key={i}
                  className={`${answerClasses[i]} rounded-2xl h-28 text-4xl font-display font-bold text-white shadow-lg active:scale-95 transition-transform border border-white/20`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    SoundEffects.answerSelect();
                    setSelectedAnswer(i);
                    submitAnswer(i, "", state.timeRemaining);
                  }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Results / Leaderboard
  if (state.gameStatus === "results" || state.gameStatus === "leaderboard") {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Trophy className="w-16 h-16 text-game-gold mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-game-dark-gold mb-2">
            {state.gameStatus === "results" ? "תוצאות" : "טבלת מובילים"}
          </h2>
          <p className="text-game-dark-gold/60">הסתכלו על המסך הראשי!</p>
        </motion.div>
      </div>
    );
  }

  // Finished
  if (state.gameStatus === "finished") {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="font-serif text-4xl text-game-dark-gold mb-4">🎉 המשחק נגמר!</h2>
          <p className="text-game-dark-gold/60 text-lg">תודה שהשתתפת, {state.playerName}!</p>
        </motion.div>
      </div>
    );
  }

  // Playing / other
  return (
    <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-game-dark-gold/60 font-serif text-xl">המשחק מתחיל בקרוב...</p>
      </motion.div>
    </div>
  );
};

export default PlayerJoin;
