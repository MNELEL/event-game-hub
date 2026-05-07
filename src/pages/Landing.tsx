import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Users, QrCode, Smartphone, Trophy, Palette,
  ShieldCheck, WifiOff, BarChart3, PartyPopper, Check,
  Phone, Mail, ArrowLeft, PlayCircle,
} from "lucide-react";

const audiences = [
  "חתונות", "בר/בת מצווה", "ימי הולדת", "גיבושי חברה", "כנסים", "מסיבות רווקות/ים",
];

const steps = [
  { icon: Palette, title: "מתאימים את המשחק", desc: "מעלים שאלות, לוגו ותמונות — תוך דקות מקבלים משחק ממותג לאירוע שלכם." },
  { icon: QrCode, title: "אורחים סורקים QR", desc: "בלי הורדות. כל אורח מצטרף מהטלפון בלחיצה אחת — גם 10 וגם 100 משתתפים." },
  { icon: Trophy, title: "מנצחים יחד", desc: "שאלות, אנימציות, צלילים, לוח תוצאות חי ותארים בסוף הערב." },
];

const features = [
  { icon: Users, title: "עד 100 משתתפים בו זמנית", desc: "מנוע סנכרון בזמן אמת ללא לאגים." },
  { icon: Palette, title: "מיתוג מלא לאירוע", desc: "לוגו, צבעים, תמונות וטקסטים — שלכם." },
  { icon: Smartphone, title: "עובד בכל מכשיר", desc: "טלפון, טאבלט, מחשב — בלי התקנה." },
  { icon: WifiOff, title: "מצב אופליין", desc: "המשחק רץ גם כשהאינטרנט גחמני." },
  { icon: BarChart3, title: "ניתוח תוצאות", desc: "סטטיסטיקות, גרפים וייצוא נתונים." },
  { icon: ShieldCheck, title: "מאובטח ופרטי", desc: "כל אירוע מקבל מרחב סגור משלו." },
];

const plans = [
  {
    name: "אירוע יחיד", price: "₪299", desc: "מושלם לחתונה / בר מצווה אחת",
    features: ["עד 100 משתתפים", "מיתוג מלא", "תמיכה ביום האירוע", "עד 50 שאלות"],
    cta: "הזמינו עכשיו", highlight: false,
  },
  {
    name: "מארגני אירועים", price: "₪999", suffix: "/חודש",
    desc: "המומלץ — לעסקים שמפיקים אירועים",
    features: ["אירועים ללא הגבלה", "משתתפים ללא הגבלה", "עד 10 מותגים שונים", "תמיכה מועדפת", "ייצוא דוחות"],
    cta: "התחילו חודש ניסיון", highlight: true,
  },
  {
    name: "התאמה אישית", price: "צרו קשר", desc: "לחברות, מותגים וכנסים בקנה מידה גדול",
    features: ["דומיין מותג משלכם", "אינטגרציות מותאמות", "ליווי הפקה צמוד", "SLA ייעודי"],
    cta: "דברו איתנו", highlight: false,
  },
];

const testimonials = [
  { quote: "הפך את החתונה שלנו לחוויה שכל האורחים עוד מדברים עליה.", author: "נועה ויונתן" },
  { quote: "השתמשנו בכנס שנתי של 80 עובדים — שווה כל שקל. שבר את הקרח בשנייה.", author: "מנהלת HR, חברת הייטק" },
  { quote: "בת מצווה שלא נשכחה. הילדים והמבוגרים שיחקו יחד שעתיים רצוף.", author: "משפחת לוי" },
];

const faqs = [
  { q: "האם צריך להתקין משהו?", a: "לא. אורחים סורקים QR ומשחקים ישירות בדפדפן." },
  { q: "כמה משתתפים יכולים לשחק יחד?", a: "במסלול הסטנדרטי עד 100, בהתאמה אישית — ללא הגבלה." },
  { q: "האם המשחק עובד בעברית?", a: "כן, ממשק עברית מלא RTL, כולל תמיכה בכל כיווני השפה." },
  { q: "מה קורה אם האינטרנט נופל באולם?", a: "יש מצב אופליין מובנה — המשחק ממשיך לרוץ ומתסנכרן כשהחיבור חוזר." },
  { q: "אפשר לשנות את השאלות?", a: "בוודאי. עורך שאלות מלא, יבוא מקובץ, ושכפול שאלות קיימות." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen game-gradient relative overflow-hidden" dir="rtl">
      {/* ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-game-glow/10"
            style={{
              width: 80 + (i * 17) % 140,
              height: 80 + (i * 23) % 140,
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
            }}
            animate={{ y: [0, -30, 0], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      {/* NAV */}
      <header className="relative z-20 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-2xl text-game-dark-gold">
          <span className="text-3xl">👑</span>
          <span>Trivia Live</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-game-dark-gold/80">
          <a href="#how" className="hover:text-game-dark-gold">איך זה עובד</a>
          <a href="#features" className="hover:text-game-dark-gold">תכונות</a>
          <a href="#pricing" className="hover:text-game-dark-gold">מחירים</a>
          <a href="#faq" className="hover:text-game-dark-gold">שאלות</a>
        </nav>
        <Button variant="gold" size="sm" onClick={() => navigate("/play")} className="gap-1">
          <PlayCircle className="w-4 h-4" /> נסו דמו
        </Button>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-double border-game-border-gold/60 bg-game-parchment/70 px-4 py-1 text-xs font-medium text-game-dark-gold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> חוויית האירוע הבאה שלכם מתחילה כאן
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-game-gold text-shadow-game leading-tight mb-5">
            המשחק שהופך<br />כל אירוע לבלתי נשכח
          </h1>
          <p className="text-lg md:text-xl text-game-dark-gold/85 max-w-2xl mx-auto mb-8">
            פלטפורמת טריוויה אינטראקטיבית בזמן אמת — ממותגת לאירוע שלכם.
            אורחים סורקים QR, משחקים מהטלפון, וצוחקים יחד עד סוף הערב.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button variant="game" size="xl" onClick={() => navigate("/play")} className="gap-2 text-xl px-10 py-6">
              <PartyPopper className="w-6 h-6" /> נסו דמו חינם
            </Button>
            <Button variant="gold" size="xl" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 text-xl px-10 py-6">
              הזמינו עכשיו <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <p className="mt-5 text-sm text-game-dark-gold/60">ללא התקנה · ללא חנות אפליקציות · עברית מלאה</p>
        </motion.div>
      </section>

      {/* AUDIENCES BAR */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border-2 border-double border-game-border-gold/50 bg-game-parchment/60 backdrop-blur px-6 py-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm md:text-base text-game-dark-gold font-medium">
            {audiences.map((a, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-game-gold">✦</span> {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-game-dark-gold mb-3">איך זה עובד?</h2>
          <p className="text-game-dark-gold/70">שלושה שלבים מהרגע שאתם מזמינים עד שהאורח הראשון משחק.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border-2 border-double border-game-border-gold/50 bg-game-parchment/70 backdrop-blur p-7 text-center"
            >
              <div className="absolute -top-4 right-1/2 translate-x-1/2 w-9 h-9 rounded-full bg-game-gold text-game-dark-gold font-bold flex items-center justify-center shadow-md">
                {i + 1}
              </div>
              <s.icon className="w-12 h-12 text-game-dark-gold mx-auto mb-3" />
              <h3 className="font-display text-xl text-game-dark-gold mb-2">{s.title}</h3>
              <p className="text-sm text-game-dark-gold/75">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-game-dark-gold mb-3">למה דווקא אנחנו?</h2>
          <p className="text-game-dark-gold/70">כל מה שצריך כדי להפיק חוויה מקצועית — בלי כאב ראש.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="rounded-xl border border-game-border-gold/40 bg-game-parchment/60 backdrop-blur p-5 hover:border-game-border-gold/80 transition-colors"
            >
              <f.icon className="w-8 h-8 text-game-gold mb-3" />
              <h3 className="font-display text-lg text-game-dark-gold mb-1">{f.title}</h3>
              <p className="text-sm text-game-dark-gold/70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-game-dark-gold mb-3">מה לקוחות אומרים</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border-2 border-double border-game-border-gold/50 bg-game-parchment/70 backdrop-blur p-6">
              <div className="text-3xl text-game-gold mb-2">"</div>
              <p className="text-game-dark-gold/85 leading-relaxed mb-4">{t.quote}</p>
              <p className="text-sm text-game-dark-gold/60 font-medium">— {t.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-game-dark-gold mb-3">מחירים פשוטים</h2>
          <p className="text-game-dark-gold/70">בחרו את המסלול שמתאים לכם. ללא הפתעות.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-7 backdrop-blur ${
                p.highlight
                  ? "border-2 border-game-gold bg-game-parchment shadow-2xl scale-[1.02]"
                  : "border-2 border-double border-game-border-gold/50 bg-game-parchment/70"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 right-6 bg-game-gold text-game-dark-gold text-xs font-bold px-3 py-1 rounded-full shadow">
                  הכי פופולרי
                </span>
              )}
              <h3 className="font-display text-2xl text-game-dark-gold mb-1">{p.name}</h3>
              <p className="text-sm text-game-dark-gold/60 mb-4 min-h-[2.5rem]">{p.desc}</p>
              <div className="mb-5">
                <span className="font-display text-4xl font-bold text-game-dark-gold">{p.price}</span>
                {p.suffix && <span className="text-sm text-game-dark-gold/70">{p.suffix}</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-game-dark-gold/85">
                    <Check className="w-4 h-4 text-game-gold mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.highlight ? "game" : "gold"}
                size="lg"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full"
              >
                {p.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-game-dark-gold mb-3">שאלות נפוצות</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-xl border-2 border-double border-game-border-gold/50 bg-game-parchment/70 backdrop-blur p-5">
              <summary className="cursor-pointer font-display text-lg text-game-dark-gold flex justify-between items-center list-none">
                {f.q}
                <span className="text-game-gold group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-game-dark-gold/80">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section id="contact" className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-3xl border-2 border-double border-game-border-gold bg-game-parchment/90 backdrop-blur p-10 text-center shadow-xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-game-dark-gold mb-3">
            מוכנים להפוך את האירוע הבא לבלתי נשכח?
          </h2>
          <p className="text-game-dark-gold/75 mb-7 text-lg">השאירו פרטים ונחזור אליכם תוך 24 שעות.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="game" size="xl" asChild className="gap-2">
              <a href="tel:077-2267604"><Phone className="w-5 h-5" /> 077-2267604</a>
            </Button>
            <Button variant="gold" size="xl" asChild className="gap-2">
              <a href="mailto:hello@trivialive.app"><Mail className="w-5 h-5" /> שלחו מייל</a>
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate("/play")} className="gap-2">
              <PlayCircle className="w-5 h-5" /> נסו דמו
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-10 text-center text-sm text-game-dark-gold/60 border-t border-game-border-gold/30">
        <p>© {new Date().getFullYear()} Trivia Live · משחק טריוויה לאירועים</p>
        <div className="mt-2 flex justify-center gap-4">
          <button onClick={() => navigate("/about")} className="hover:text-game-dark-gold">אודות</button>
          <button onClick={() => navigate("/install")} className="hover:text-game-dark-gold">התקנה</button>
          <button onClick={() => navigate("/host")} className="hover:text-game-dark-gold">כניסת מפעיל</button>
        </div>
      </footer>
    </main>
  );
}
