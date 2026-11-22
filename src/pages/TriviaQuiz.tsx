import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Check, X, RotateCcw, PlayCircle, Phone,
  BookOpen, Globe, Trophy, ArrowRight,
} from "lucide-react";

type SampleQuestion = {
  category: "judaism" | "general";
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
};

const QUESTIONS: SampleQuestion[] = [
  // יהדות
  { category: "judaism", question: "כמה ספרים יש בתנ\"ך?", options: ["24", "39", "27", "12"], correct: 0, explanation: "התנ\"ך מכיל 24 ספרים: תורה, נביאים וכתובים." },
  { category: "judaism", question: "באיזה חודש חל חג הסוכות?", options: ["ניסן", "תשרי", "אדר", "סיוון"], correct: 1, explanation: "סוכות חל בט\"ו בתשרי, ארבעה ימים אחרי יום כיפור." },
  { category: "judaism", question: "כמה משניות יש בשישה סדרי משנה?", options: ["שישה סדרים", "חמישה סדרים", "שבעה סדרים", "ארבעה סדרים"], correct: 0, explanation: "זרעים, מועד, נשים, נזיקין, קדשים וטהרות — שישה סדרים." },
  { category: "judaism", question: "מי היה אביו של המלך שלמה?", options: ["שאול", "דוד", "שמואל", "יהושפט"], correct: 1, explanation: "שלמה המלך היה בנו של דוד המלך ובת שבע." },
  { category: "judaism", question: "מהי הברכה על לחם?", options: ["בורא פרי העץ", "שהכל נהיה בדברו", "המוציא לחם מן הארץ", "בורא מיני מזונות"], correct: 2 },
  { category: "judaism", question: "באיזה יום בחודש חל ראש השנה?", options: ["י' בתשרי", "א' בתשרי", "ט\"ו בשבט", "י\"ד בניסן"], correct: 1 },
  // ידע כללי
  { category: "general", question: "מהי בירת יפן?", options: ["קיוטו", "אוסקה", "טוקיו", "נגויה"], correct: 2 },
  { category: "general", question: "כמה יבשות יש בעולם?", options: ["5", "6", "7", "8"], correct: 2 },
  { category: "general", question: "מהו הכוכב הקרוב ביותר לכדור הארץ?", options: ["הירח", "נוגה", "השמש", "מאדים"], correct: 2, explanation: "השמש היא כוכב — והיא הכוכב הקרוב ביותר אלינו." },
  { category: "general", question: "כמה דקות יש בשעתיים?", options: ["100", "120", "140", "90"], correct: 1 },
  { category: "general", question: "איזה ים הוא המלוח ביותר בעולם?", options: ["ים התיכון", "הים השחור", "ים המלח", "הים האדום"], correct: 2 },
  { category: "general", question: "כמה צבעים יש בקשת?", options: ["5", "6", "7", "8"], correct: 2 },
];

const CATEGORIES = [
  { key: "judaism" as const, label: "יהדות", icon: BookOpen },
  { key: "general" as const, label: "ידע כללי", icon: Globe },
];

export default function TriviaQuiz() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<"judaism" | "general" | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const questions = useMemo(
    () => QUESTIONS.filter((q) => q.category === category),
    [category]
  );
  const current = questions[index];

  const start = (c: "judaism" | "general") => {
    setCategory(c);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === current.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  return (
    <main className="min-h-screen game-gradient relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-game-glow/10"
            style={{
              width: 80 + (i * 17) % 140,
              height: 80 + (i * 23) % 140,
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6 + (i % 4), repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>

      {/* HERO */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-double border-game-border-gold/60 bg-game-parchment/70 px-4 py-1.5 text-sm text-game-dark-gold/80 mb-6">
            <Sparkles className="w-4 h-4 text-game-gold" /> חידון טריוויה לדוגמה — בחינם, בלי הרשמה
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-game-dark-gold leading-tight mb-5">
            חידון טריוויה בעברית — שאלות לדוגמה ביהדות ובידע כללי
          </h1>
          <p className="text-lg md:text-xl text-game-dark-gold/75 leading-relaxed max-w-2xl mx-auto mb-8">
            ככה נראה חידון חיוש מבפנים: בחרו נושא, ענו על שאלות לדוגמה וקבלו ציון מיידי.
            באירוע אמיתי כל האורחים עונים בו־זמנית מהטלפון, והמסך הגדול מציג את הטבלה החיה.
          </p>
        </motion.div>
      </section>

      {/* QUIZ */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {!category && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid sm:grid-cols-2 gap-5"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => start(c.key)}
                  className="rounded-3xl border-2 border-double border-game-border-gold bg-game-parchment/90 backdrop-blur p-8 text-center shadow-lg hover:scale-[1.02] transition-transform"
                >
                  <c.icon className="w-10 h-10 text-game-gold mx-auto mb-3" />
                  <span className="font-display text-2xl font-bold text-game-dark-gold block mb-1">{c.label}</span>
                  <span className="text-sm text-game-dark-gold/70">
                    {QUESTIONS.filter((q) => q.category === c.key).length} שאלות לדוגמה
                  </span>
                </button>
              ))}
            </motion.div>
          )}

          {category && !done && current && (
            <motion.div
              key={`q-${category}-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border-2 border-double border-game-border-gold bg-game-parchment/90 backdrop-blur p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4 text-sm text-game-dark-gold/70">
                <span>שאלה {index + 1} מתוך {questions.length}</span>
                <span>ניקוד: {score}</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-game-dark-gold mb-6 leading-snug">
                {current.question}
              </h2>
              <div className="grid gap-3">
                {current.options.map((opt, i) => {
                  const isCorrect = picked !== null && i === current.correct;
                  const isWrong = picked === i && i !== current.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      disabled={picked !== null}
                      className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-right text-lg transition-colors ${
                        isCorrect
                          ? "border-green-600 bg-green-50 text-green-900"
                          : isWrong
                            ? "border-red-500 bg-red-50 text-red-900"
                            : "border-game-border-gold/50 bg-game-parchment/60 text-game-dark-gold hover:border-game-gold"
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrect && <Check className="w-5 h-5 shrink-0" />}
                      {isWrong && <X className="w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {picked !== null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
                  {current.explanation && (
                    <p className="text-sm text-game-dark-gold/75 mb-4">{current.explanation}</p>
                  )}
                  <Button variant="game" size="lg" onClick={next} className="w-full gap-2">
                    {index + 1 >= questions.length ? "לציון הסופי" : "לשאלה הבאה"} <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {done && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border-2 border-double border-game-border-gold bg-game-parchment/90 backdrop-blur p-10 text-center shadow-xl"
            >
              <Trophy className="w-14 h-14 text-game-gold mx-auto mb-4" />
              <h2 className="font-display text-3xl font-bold text-game-dark-gold mb-2">
                עניתם נכון על {score} מתוך {questions.length} שאלות
              </h2>
              <p className="text-game-dark-gold/75 mb-7">
                באירוע אמיתי הניקוד מצטבר בין כל האורחים, עם בונוס על מהירות וטבלת מובילים חיה.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="game" size="xl" onClick={() => setCategory(null)} className="gap-2">
                  <RotateCcw className="w-5 h-5" /> נושא אחר
                </Button>
                <Button variant="gold" size="xl" onClick={() => navigate("/play")} className="gap-2">
                  <PlayCircle className="w-5 h-5" /> למשחק מלא
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-3xl border-2 border-double border-game-border-gold bg-game-parchment/90 backdrop-blur p-10 text-center shadow-xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-game-dark-gold mb-3">
            רוצים חידון כזה באירוע שלכם?
          </h2>
          <p className="text-game-dark-gold/75 mb-7 text-lg">
            בונים חידון ממותג עם השאלות שלכם — או מייצרים שאלות אוטומטית בעזרת AI — ומפעילים אותו בכיתה, בחתונה או במסיבת סיום.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="game" size="xl" onClick={() => navigate("/play")} className="gap-2">
              <PlayCircle className="w-5 h-5" /> נסו דמו חי
            </Button>
            <Button variant="gold" size="xl" asChild className="gap-2">
              <a href="tel:077-2267604"><Phone className="w-5 h-5" /> 077-2267604</a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-10 text-center text-sm text-game-dark-gold/60 border-t border-game-border-gold/30">
        <button onClick={() => navigate("/")} className="hover:text-game-dark-gold">חזרה לדף הבית</button>
      </footer>
    </main>
  );
}
