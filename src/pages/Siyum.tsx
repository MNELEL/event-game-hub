import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Trophy, RotateCcw, Volume2, VolumeX, BookOpen } from "lucide-react";

type Q = { text: string; options: string[]; correct: number; source: string; explain: string };
type EventKind = { id: string; name: string; icon: string; points: number; note: string; questions: Q[] };

const EVENTS: EventKind[] = [
  { id: "masechet", name: "סיום מסכת", icon: "📜", points: 150, note: "שאלות בלימוד, ניקוד גבוה", questions: [
    { text: "מה אומרים בסיום מסכת?", options: ["הדרן עלך", "חזק ונתחזק", "לשנה הבאה", "מזל טוב"], correct: 0, source: "נוסח הסיום שבסוף כל מסכת", explain: "\"הדרן עלך\" – נחזור אליך. מבטאים שהלימוד לא נגמר, ונשוב למסכת שוב." },
    { text: "באיזו מסכת פותח התלמוד הבבלי?", options: ["שבת", "ברכות", "בבא קמא", "פסחים"], correct: 1, source: "ברכות ב, א", explain: "הגמרא פותחת ב\"מאימתי קורין את שמע בערבית\" – פתיחה בעול מלכות שמים." },
    { text: "כמה סדרים יש במשנה?", options: ["4", "5", "6", "7"], correct: 2, source: "שבת לא, א – \"והיה אמונת עתיך\"", explain: "ששה סדרים: זרעים, מועד, נשים, נזיקין, קדשים, טהרות – ולכן נקרא הש\"ס." },
    { text: "איזה קדיש אומרים בסיום מסכת?", options: ["קדיש יתום", "קדיש דרבנן", "קדיש הגדול (דעתיד לאתחדתא)", "חצי קדיש"], correct: 2, source: "נוסח הסיום, ע\"פ מסכת סופרים", explain: "בסיום אומרים את הקדיש הארוך שמזכיר את תחיית המתים ובניין ירושלים." },
    { text: "מדוע עושים סעודה בסיום מסכת?", options: ["מנהג בלבד", "סעודת מצוה – שמחה של תורה", "כדי לפתוח זמן חדש", "לכבוד המלמד"], correct: 1, source: "שבת קיח, ב – אביי: \"תיתי לי דכי חזינא צורבא מרבנן דשלים מסכתיה עבידנא יומא טבא לרבנן\"", explain: "אביי היה עושה יום טוב לחכמים כשתלמיד סיים מסכת, ומכאן שסעודת סיום היא סעודת מצוה." },
  ]},
  { id: "year", name: "סיום שנת לימודים", icon: "🎓", points: 100, note: "לכל המשפחה", questions: [
    { text: "כמה ספרים בחומש?", options: ["3", "5", "7", "24"], correct: 1, source: "חמשה חומשי תורה", explain: "בראשית, שמות, ויקרא, במדבר ודברים." },
    { text: "מי היו רבותיו של רבי עקיבא?", options: ["רבי אליעזר ורבי יהושע", "הלל ושמאי", "רבי מאיר", "רבי יהודה הנשיא"], correct: 0, source: "אבות דרבי נתן ו", explain: "רבי עקיבא התחיל ללמוד בגיל ארבעים אצל רבי אליעזר ורבי יהושע." },
    { text: "מה הברכה על לחם?", options: ["בורא פרי האדמה", "המוציא לחם מן הארץ", "שהכל", "בורא מיני מזונות"], correct: 1, source: "ברכות לה, א; משנה ברכות ו, א", explain: "על הלחם מברכים \"המוציא\", והיא פוטרת את כל מה שבא בתוך הסעודה." },
    { text: "כמה פרקים יש בפרקי אבות?", options: ["4", "5", "6", "10"], correct: 2, source: "מסכת אבות + פרק קנין תורה", explain: "למסכת אבות חמשה פרקים, ונוהגים להוסיף את \"פרק קנין תורה\" כפרק שישי." },
    { text: "\"לא המדרש עיקר אלא ___\"", options: ["הלימוד", "המעשה", "התפילה", "השמירה"], correct: 1, source: "אבות א, יז", explain: "שמעון בנו של רבן גמליאל מלמד שהלימוד צריך להביא למעשים טובים." },
  ]},
  { id: "cheder", name: "סיום בתלמוד תורה", icon: "🧒", points: 50, note: "שאלות קלות לילדים", questions: [
    { text: "כמה ימים ברא ה' את העולם?", options: ["5", "6", "7", "10"], correct: 1, source: "בראשית א – ב", explain: "בששה ימים ברא ה' את העולם, וביום השביעי שבת." },
    { text: "מי בנה את התיבה?", options: ["אברהם", "נח", "משה", "דוד"], correct: 1, source: "בראשית ו, יד", explain: "ה' אמר לנח: \"עשה לך תבת עצי גפר\"." },
    { text: "באיזה חג אוכלים מצה?", options: ["סוכות", "פסח", "שבועות", "חנוכה"], correct: 1, source: "שמות יב, יח", explain: "בפסח אוכלים מצה זכר ליציאת מצרים, שלא הספיק בצקם להחמיץ." },
    { text: "כמה דיברות קיבלנו בהר סיני?", options: ["5", "7", "10", "12"], correct: 2, source: "שמות כ", explain: "עשרת הדיברות נכתבו על שני לוחות האבן." },
    { text: "מה אומרים כשמסיימים חומש?", options: ["מזל טוב", "חזק חזק ונתחזק", "הדרן עלך", "אמן"], correct: 1, source: "מנהג ישראל בקריאת התורה", explain: "בסיום כל חומש הציבור אומר \"חזק חזק ונתחזק\"." },
  ]},
];

function speak(text: string, on: boolean) {
  if (!on || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "he-IL";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export default function Siyum() {
  const [kindId, setKindId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [audio, setAudio] = useState(true);
  const kind = useMemo(() => EVENTS.find(e => e.id === kindId), [kindId]);
  const done = !!kind && idx >= kind.questions.length;
  const q = kind && !done ? kind.questions[idx] : null;
  const score = kind ? answers.reduce((s, a, i) => s + (a === kind.questions[i].correct ? kind.points : 0), 0) : 0;

  useEffect(() => { if (q && picked === null) speak(`${q.text}. ${q.options.map((o, i) => `${i + 1}: ${o}`).join(". ")}`, audio); }, [q, picked, audio]);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const choose = (i: number) => {
    if (!q) return;
    setPicked(i); setAnswers(a => [...a, i]);
    speak(`${i === q.correct ? "נכון!" : `התשובה הנכונה: ${q.options[q.correct]}.`} ${q.explain} המקור: ${q.source}`, audio);
  };
  const restart = () => { setKindId(null); setIdx(0); setPicked(null); setAnswers([]); window.speechSynthesis?.cancel(); };

  return (
    <main dir="rtl" className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-2">
          <h1 className="font-display text-3xl text-foreground">חידון סיום – טריוויה למסיבות סיום</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => { setAudio(a => !a); window.speechSynthesis?.cancel(); }} aria-label={audio ? "השתקת ההקראה" : "הפעלת הקראה"}>
              {audio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Link to="/events" aria-label="חזרה למודעות"><Home className="h-5 w-5 text-muted-foreground" /></Link>
          </div>
        </header>

        {!kind && (
          <>
            <p className="text-muted-foreground">בחרו את סוג הסיום. כל שאלה מוקראת בקול, ואחרי כל תשובה מופיעים המקור וההסבר.</p>
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

        {q && kind && (
          <Card className="p-6 space-y-4 border-4 border-double border-primary/40">
            <div className="flex justify-between text-sm text-muted-foreground"><span>{kind.icon} {kind.name} · שאלה {idx + 1}/{kind.questions.length}</span><span>ניקוד: {score}</span></div>
            <div className="flex items-start gap-2">
              <h2 className="font-display text-2xl flex-1">{q.text}</h2>
              <Button variant="ghost" size="icon" aria-label="הקרא שוב" onClick={() => speak(q.text, true)}><Volume2 className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, i) => (
                <Button key={i} size="lg" disabled={picked !== null}
                  variant={picked === null ? "outline" : i === q.correct ? "default" : i === picked ? "destructive" : "outline"}
                  onClick={() => choose(i)}>{i + 1}. {o}</Button>
              ))}
            </div>
            {picked !== null && (
              <div className="rounded-md border border-border bg-muted/40 p-4 space-y-2">
                <p className="font-bold">{picked === q.correct ? "✓ נכון!" : `התשובה הנכונה: ${q.options[q.correct]}`}</p>
                <p>{q.explain}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><BookOpen className="h-4 w-4" />מקור: {q.source}</p>
                <Button className="w-full" onClick={() => { setIdx(idx + 1); setPicked(null); }}>
                  {idx + 1 < kind.questions.length ? "לשאלה הבאה" : "לסיכום"}
                </Button>
              </div>
            )}
          </Card>
        )}

        {done && kind && (
          <Card className="p-6 space-y-4 border-4 border-double border-primary/40">
            <div className="text-center space-y-2">
              <Trophy className="mx-auto h-12 w-12 text-primary" />
              <h2 className="font-display text-2xl">הדרן עלך – סיכום החידון</h2>
              <p className="text-lg">ענית נכון על {answers.filter((a, i) => a === kind.questions[i].correct).length} מתוך {kind.questions.length} · {score} נקודות</p>
            </div>
            <ol className="space-y-3">
              {kind.questions.map((qq, i) => (
                <li key={i} className="rounded-md border border-border p-3">
                  <p className="font-medium">{answers[i] === qq.correct ? "✓" : "✗"} {qq.text}</p>
                  <p className="text-sm">תשובה נכונה: <span className="font-bold text-primary">{qq.options[qq.correct]}</span>{answers[i] !== qq.correct && <span className="text-muted-foreground"> (ענית: {qq.options[answers[i]]})</span>}</p>
                  <p className="text-sm">{qq.explain}</p>
                  <p className="text-xs text-muted-foreground">מקור: {qq.source}</p>
                </li>
              ))}
            </ol>
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
