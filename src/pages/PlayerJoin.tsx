import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayerGame } from "@/hooks/usePlayerGame";
import { Phone, Wifi, Loader2, CheckCircle, Clock, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PlayerJoin = () => {
  const [name, setName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);
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

  const answerColors = [
    "bg-destructive hover:bg-destructive/90",
    "bg-primary hover:bg-primary/90",
    "bg-[hsl(45_90%_50%)] hover:bg-[hsl(45_90%_45%)]",
    "bg-[hsl(170_70%_45%)] hover:bg-[hsl(170_70%_40%)]",
  ];
  const answerLabels = ["1", "2", "3", "4"];

  // Not connected yet - show join form
  if (!state.connected) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div
          className="bg-game-surface/80 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full border border-game-glow/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl text-game-gold text-center mb-2">🧠 מגה מוח</h1>
          <p className="text-primary-foreground/60 text-center mb-6">הכניסו קוד משחק ושם כדי להצטרף</p>
          
          <div className="space-y-3 mb-4">
            <Input
              value={gameCode}
              onChange={e => setGameCode(e.target.value.toUpperCase())}
              placeholder="קוד משחק"
              className="bg-game-bg/50 border-game-glow/30 text-primary-foreground text-center text-lg h-12 font-mono tracking-widest"
              maxLength={6}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
            />
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="השם שלך"
              className="bg-game-bg/50 border-game-glow/30 text-primary-foreground text-center text-lg h-12"
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
          <h2 className="font-display text-3xl text-game-gold mb-2">!{state.playerName} 👋 שלום</h2>
          <p className="text-primary-foreground/60 text-lg mb-6">מחכים שהמשחק יתחיל...</p>
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
            <h2 className="font-display text-xl text-game-gold">שאלה {state.currentQuestionIndex + 1}</h2>
            <div className="flex items-center gap-1 text-primary-foreground/60">
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
              <p className="text-primary-foreground font-display text-2xl">תשובה נשלחה!</p>
              <p className="text-primary-foreground/60 mt-2">מחכים לתוצאות...</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {answerLabels.map((label, i) => (
                <motion.button
                  key={i}
                  className={`${answerColors[i]} rounded-2xl h-28 text-4xl font-display font-bold text-primary-foreground shadow-lg active:scale-95 transition-transform`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
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

  // Results / Leaderboard / Finished
  if (state.gameStatus === "results" || state.gameStatus === "leaderboard") {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Trophy className="w-16 h-16 text-game-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl text-primary-foreground mb-2">
            {state.gameStatus === "results" ? "תוצאות" : "טבלת מובילים"}
          </h2>
          <p className="text-primary-foreground/60">הסתכלו על המסך הראשי!</p>
        </motion.div>
      </div>
    );
  }

  if (state.gameStatus === "finished") {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="font-display text-4xl text-game-gold mb-4">🎉 המשחק נגמר!</h2>
          <p className="text-primary-foreground/60 text-lg">תודה שהשתתפת, {state.playerName}!</p>
        </motion.div>
      </div>
    );
  }

  // Playing / other states
  return (
    <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-primary-foreground/60 font-display text-xl">המשחק מתחיל בקרוב...</p>
      </motion.div>
    </div>
  );
};

export default PlayerJoin;
