import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Languages, WifiOff, QrCode, Palette, Users, Phone,
  Check, ArrowRight, PlayCircle, Sparkles,
} from "lucide-react";

const comparisons = [
  { pain: "ממשק באנגלית בלבד", ours: "ממשק עברית מלא, RTL מקצה לקצה — גם לשחקנים וגם למארחים" },
  { pain: "דורש אינטרנט יציב באולם", ours: "מצב אופליין מובנה — המשחק ממשיך לרוץ גם כשהחיבור נופל" },
  { pain: "מיתוג גנרי של פלטפורמה בינלאומית", ours: "מיתוג מלא לאירוע שלכם: לוגו, צבעים, תמונות וטקסטים" },
  { pain: "תמיכה מרוחקת באנגלית", ours: "תמיכה בעברית בטלפון, גם ביום האירוע" },
];

const highlights = [
  { icon: Languages, title: "עברית מלאה, RTL אמיתי", desc: "לא תרגום חצאי — כל המסכים, הכפתורים והאנימציות נבנו לעברית מהיסוד." },
  { icon: WifiOff, title: "עובד גם בלי אינטרנט", desc: "אולם עם קליטה חלשה? המשחק רץ אופליין ומתסנכרן כשהחיבור חוזר." },
  { icon: QrCode, title: "הצטרפות בשניות", desc: "אורחים סורקים QR ומשחקים בדפדפן — בלי הורדות ובלי הרשמה." },
  { icon: Users, title: "עד 100 משתתפים", desc: "מנוע זמן אמת שמחזיק כיתה, חתונה או כנס שלם בלי לאגים." },
  { icon: Palette, title: "שאלות משלכם", desc: "עורך שאלות מלא בעברית, כולל שאלות תמונה, וידאו ונכון/לא נכון — וגם יצירת שאלות אוטומטית בעזרת AI." },
  { icon: Phone, title: "משחק גם בשיחת טלפון", desc: "אורחים בלי סמארטפון? מצטרפים בחיוג רגיל ועונים במקשים." },
];

export default function KahootHebrew() {
  const navigate = useNavigate();

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
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-14 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-double border-game-border-gold/60 bg-game-parchment/70 px-4 py-1.5 text-sm text-game-dark-gold/80 mb-6">
            <Sparkles className="w-4 h-4 text-game-gold" /> חיפשתם „קהוט בעברית”? מצאתם משהו טוב יותר
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-game-dark-gold leading-tight mb-5">
            קהוט בעברית — חידון טריוויה חי שבאמת מדבר עברית
          </h1>
          <p className="text-lg md:text-xl text-game-dark-gold/75 leading-relaxed max-w-2xl mx-auto mb-8">
            אם ניסיתם להפעיל קהוט בכיתה, בגיבוש צוות או באירוע משפחתי ונתקלתם בממשק אנגלי,
            בדרישה לאינטרנט יציב ובמיתוג שלא שלכם — חידון חיוש נבנה בדיוק בשבילכם:
            פלטפורמת טריוויה ישראלית, בעברית מלאה, שעובדת גם אופליין.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="game" size="xl" onClick={() => navigate("/play")} className="gap-2">
              <PlayCircle className="w-5 h-5" /> נסו דמו חי
            </Button>
            <Button variant="gold" size="xl" onClick={() => navigate("/")} className="gap-2">
              לדף הבית <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* WHY NOT KAHOOT */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-game-dark-gold text-center mb-8">
          למה משתמשים ישראלים מחפשים חלופה לקהוט?
        </h2>
        <div className="space-y-4">
          {comparisons.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border-2 border-double border-game-border-gold/50 bg-game-parchment/70 backdrop-blur p-5 flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="md:w-2/5 text-game-dark-gold/60 text-sm">
                <span className="font-bold text-game-dark-gold/70 block mb-1">הבעיה בקהוט:</span>
                {c.pain}
              </div>
              <div className="md:w-3/5 flex items-start gap-2 text-game-dark-gold/90">
                <Check className="w-5 h-5 text-game-gold mt-0.5 shrink-0" />
                <span>{c.ours}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-game-dark-gold text-center mb-10">
          מה מקבלים בחידון חיוש
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border-2 border-double border-game-border-gold/50 bg-game-parchment/70 backdrop-blur p-6"
            >
              <h.icon className="w-8 h-8 text-game-gold mb-3" />
              <h3 className="font-display text-xl text-game-dark-gold mb-2">{h.title}</h3>
              <p className="text-sm text-game-dark-gold/75 leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl border-2 border-double border-game-border-gold bg-game-parchment/90 backdrop-blur p-8">
          <h2 className="font-display text-3xl font-bold text-game-dark-gold mb-4 text-center">למי זה מתאים?</h2>
          <ul className="space-y-3 text-game-dark-gold/85">
            {[
              "מורים וגננות שרוצים חידון כיתתי בעברית בלי להסביר לאן ללחוץ באנגלית",
              "מפיקי אירועים — חתונות, בר/בת מצווה, מסיבות סיום — שרוצים משחק ממותג לאירוע",
              "מנהלי HR וגיבוש צוות שצריכים פעילות שעובדת גם באולם עם וויי-פיי חלש",
              "משפחות שרוצות חידון אישי על המשפחה — עם תמונות וסיפורים משלהן",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-game-gold mt-0.5 shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-14">
        <div className="rounded-3xl border-2 border-double border-game-border-gold bg-game-parchment/90 backdrop-blur p-10 text-center shadow-xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-game-dark-gold mb-3">
            מוכנים לחידון בעברית שפשוט עובד?
          </h2>
          <p className="text-game-dark-gold/75 mb-7 text-lg">נסו דמו חי עכשיו, או דברו איתנו על האירוע שלכם.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="game" size="xl" onClick={() => navigate("/play")} className="gap-2">
              <PlayCircle className="w-5 h-5" /> נסו דמו
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
