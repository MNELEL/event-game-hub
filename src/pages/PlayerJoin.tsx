import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Wifi, ArrowLeft } from "lucide-react";

const PlayerJoin = () => {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleJoin = () => {
    if (name.trim()) setJoined(true);
  };

  const answerColors = [
    "bg-destructive hover:bg-destructive/90",
    "bg-primary hover:bg-primary/90",
    "bg-warning hover:bg-warning/90",
    "bg-success hover:bg-success/90",
  ];
  const answerLabels = ["1", "2", "3", "4"];

  if (!joined) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center p-4" dir="rtl">
        <motion.div
          className="bg-game-surface/80 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full border border-game-glow/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl text-game-gold text-center mb-2">🧠 מגה מוח</h1>
          <p className="text-primary-foreground/60 text-center mb-6">הכניסו את השם שלכם כדי להצטרף</p>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="השם שלך"
            className="bg-game-bg/50 border-game-glow/30 text-primary-foreground text-center text-lg h-12 mb-4"
            onKeyDown={e => e.key === "Enter" && handleJoin()}
          />
          <Button variant="gold" size="lg" className="w-full" onClick={handleJoin} disabled={!name.trim()}>
            הצטרפות למשחק
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-gradient flex flex-col items-center justify-center p-4" dir="rtl">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="font-display text-2xl text-game-gold text-center mb-2">שלום {name}! 👋</h2>
        <p className="text-primary-foreground/60 text-center mb-8">בחרו את התשובה שלכם</p>
        <div className="grid grid-cols-2 gap-4">
          {answerLabels.map((label, i) => (
            <motion.button
              key={i}
              className={`${answerColors[i]} rounded-2xl h-28 text-4xl font-display font-bold text-primary-foreground shadow-lg active:scale-95 transition-transform ${selectedAnswer === i ? "ring-4 ring-game-gold" : ""}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedAnswer(i)}
            >
              {label}
            </motion.button>
          ))}
        </div>
        {selectedAnswer !== null && (
          <motion.p
            className="text-center text-primary-foreground/60 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            בחרת תשובה {selectedAnswer + 1} ✓
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default PlayerJoin;
