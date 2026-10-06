import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Trophy, RotateCcw } from "lucide-react";

type Q = { text: string; options: string[]; correct: number };
type EventKind = { id: string; name: string; icon: string; points: number; note: string; questions: Q[] };

const EVENTS: EventKind[] = [
  { id: "masechet", name: "סיום מסכת", icon: "📜", points: 150, note: "ניקוד גבוה – שאלות בלימוד", questions: [
    { text: "מה אומרים בסיום מסכת?", options: ["הדרן עלך", "חזק ונתחזק", "לשנה הבאה", "מזל טוב"], correct: 0 },
    { text: "באיזו מסכת פותח התלמוד הבבלי?", options: ["שבת", "ברכות", "בבא קמא", "פסחים"], correct: 1 },
    { text: "כמה סדרים יש במשנה?", options: ["4", "5", "6", "7"], correct: 2 },
    { text: "איזה קדיש אומרים בסיום מסכת?", options: ["קדיש יתום", "קדיש דרבנן", "קדיש הגדול (דאתחדתא)", "חצי קדיש"], correct: 2 },
    { text: "כמה דפים בערך יש בש\"ס בבלי?", options: ["1,200", "2,711", "4,000", "900"], correct: 1 },
  ]},
  { id: "year", name: "סיום שנת לימודים", icon: "🎓", points: 100, note: "ניקוד רגיל – לכל המשפחה", questions: [
    { text: "באיזה חודש מסתיימת בדרך כלל שנת הלימודים?", options: ["ניסן", "תמוז", "אלול", "טבת"], correct: 1 },
    { text: "כמה ספרים בחומש?", options: ["3", "5", "7", "24"], correct: 1 },
    { text: "מי היה הרבי של רבי עקיבא?", options: ["רבי אליעזר ורבי יהושע", "הלל", "רבי מאיר", "רבי יהודה הנשיא"], correct: 0 },
    { text: "מה הברכה על לחם?", options: ["בורא פרי האדמה", "המוציא לחם מן הארץ", "שהכל", "בורא מיני מזונות"], correct: 1 },
    { text: "כמה פרקים יש בפרקי אבות?", options: ["4", "5", "6", "10"], correct: 2 },
  ]},
  { id: "cheder", name: "סיום בתלמוד תורה", icon: "🧒", points: 50, note: "ניקוד נמוך ושאלות קלות לילדים", questions: [
    { text: "מה האות הראשונה באלף-בית?", options: ["ב", "א", "ג", "ש"], correct: 1 },
    { text: "כמה ימים ברא ה' את העולם?", options: ["5", "6", "7", "10"], correct: 1 },
    { text: "מי בנה את התיבה?", options: ["אברהם", "נח", "משה", "דוד"], correct: 1 },
    { text: "באיזה חג אוכלים מצה?", options: ["סוכות", "פסח", "שבועות", "חנוכה"], correct: 1 },
    { text: "כמה דיברות קיבלנו בהר סיני?", options: ["5", "7", "10", "12"], correct: 2 },
  ]},
];

export default function Siyum() {
  const [kindId, setKindId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const kind = useMemo(() => EVENTS.find(e => e.id === kindId), [kindId]);
  const done = kind && idx >= kind.questions.length;
  const restart = () => { setKindId(null); setIdx(0); setPicked(null); setScore(0); };

  return (
    <main dir="rtl" className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-foreground">חידון סיום – טריוויה למסיבות סיום</h1>
          <Link to="/events" aria-label="חזרה למודעות"><Home className="h-5 w-5 text-muted-foreground" /></Link>
        </header>
        {!kind && (
          <>
            <p className="text-muted-foreground">בחרו את סוג הסיום – השאלות והניקוד יותאמו אליו.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {EVENTS.map(e => (
                <button key={e.id} onClick={() => setKindId(e.id)} className="rounded-lg border-4 border-double border-primary/40 bg-card p-4 text-right hover:bg-accent">
                  <div className="text-3xl">{e.icon}</div>
                  <div className="font-bold">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.note} · {e.points} נק' לשאלה</div>
                </button>
              ))}
            </div>
          </>
        )}
        {kind && !done && (() => { const q = kind.questions[idx]; return (
          <Card className="p-6 space-y-4 border-4 border-double border-primary/40">
            <div className="flex justify-between text-sm text-muted-foreground"><span>{kind.icon} {kind.name} · שאלה {idx + 1}/{kind.questions.length}</span><span>ניקוד: {score}</span></div>
            <h2 className="font-display text-2xl">{q.text}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, i) => (
                <Button key={i} size="lg" disabled={picked !== null}
                  variant={picked === null ? "outline" : i === q.correct ? "default" : i === picked ? "destructive" : "outline"}
                  onClick={() => { setPicked(i); if (i === q.correct) setScore(s => s + kind.points); }}>{o}</Button>
              ))}
            </div>
            {picked !== null && <Button className="w-full" onClick={() => { setIdx(idx + 1); setPicked(null); }}>לשאלה הבאה</Button>}
          </Card>
        ); })()}
        {done && (
          <Card className="p-8 text-center space-y-3 border-4 border-double border-primary/40">
            <Trophy className="mx-auto h-12 w-12 text-primary" />
            <h2 className="font-display text-2xl">כל הכבוד! הדרן עלך</h2>
            <p className="text-lg">צברתם {score} מתוך {kind!.points * kind!.questions.length} נקודות</p>
            <div className="flex justify-center gap-2">
              <Button onClick={restart} className="gap-1"><RotateCcw className="h-4 w-4" />סיום אחר</Button>
              <Button asChild variant="outline"><Link to="/app">למשחק החי עם כל האורחים</Link></Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
