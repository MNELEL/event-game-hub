import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Question, QuestionType, DEFAULT_CATEGORIES } from "@/types/game";
import { Plus, Check, BarChart3, HelpCircle, Trash2, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = { onAdd: (q: Question) => void };

const ANSWER_COLORS = [
  "bg-red-500/15 border-red-400/50 hover:bg-red-500/25",
  "bg-blue-500/15 border-blue-400/50 hover:bg-blue-500/25",
  "bg-amber-500/15 border-amber-400/50 hover:bg-amber-500/25",
  "bg-green-500/15 border-green-400/50 hover:bg-green-500/25",
];
const ANSWER_CORRECT_COLORS = [
  "bg-red-500/30 border-red-500 ring-2 ring-red-400/50",
  "bg-blue-500/30 border-blue-500 ring-2 ring-blue-400/50",
  "bg-amber-500/30 border-amber-500 ring-2 ring-amber-400/50",
  "bg-green-500/30 border-green-500 ring-2 ring-green-400/50",
];
const ANSWER_LABELS = ["א", "ב", "ג", "ד"];

export function QuestionEditor({ onAdd }: Props) {
  const [mode, setMode] = useState<"trivia" | "poll">("trivia");
  const [text, setText] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [category, setCategory] = useState("general");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [points, setPoints] = useState(100);
  const [mediaUrl, setMediaUrl] = useState("");
  const [numOptions, setNumOptions] = useState(4);

  const handleAdd = () => {
    const activeOptions = options.slice(0, numOptions);
    if (!text.trim() || activeOptions.some(o => !o.trim())) return;
    onAdd({
      id: Date.now().toString(),
      type, category, text,
      options: [...activeOptions],
      correctAnswer: mode === "poll" ? -1 : correctAnswer,
      timeLimit, points,
      mediaUrl: mediaUrl || undefined,
    });
    setText("");
    setOptions(["", "", "", ""]);
    setMediaUrl("");
    setCorrectAnswer(0);
  };

  const allFilled = text.trim() && options.slice(0, numOptions).every(o => o.trim());

  return (
    <Card className="p-5 space-y-5 border-border">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold">
          {mode === "trivia" ? "➕ הוספת שאלה" : "📊 הוספת סקר"}
        </h2>
        {/* Mode tabs */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          <button
            onClick={() => setMode("trivia")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all ${
              mode === "trivia" ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> טריוויה
          </button>
          <button
            onClick={() => { setMode("poll"); setCorrectAnswer(-1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all ${
              mode === "poll" ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> סקר
          </button>
        </div>
      </div>

      {mode === "poll" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          💡 בסקר אין תשובה נכונה — כולם מצביעים ורואים את התוצאות
        </div>
      )}

      {/* Type, Category, Time, Points */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs mb-1 block">סוג</Label>
          <Select value={type} onValueChange={(v: QuestionType) => setType(v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">📝 טקסט</SelectItem>
              <SelectItem value="image">🖼️ תמונה</SelectItem>
              <SelectItem value="audio">🎵 שמע</SelectItem>
              <SelectItem value="video">🎬 וידאו</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">קטגוריה</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEFAULT_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">זמן (שניות)</Label>
          <Input type="number" value={timeLimit} onChange={e => setTimeLimit(+e.target.value)} min={5} max={120} className="h-9" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">ניקוד</Label>
          <Input type="number" value={points} onChange={e => setPoints(+e.target.value)} min={10} step={10} className="h-9" disabled={mode === "poll"} />
        </div>
      </div>

      {/* Question text */}
      <div>
        <Label className="text-xs mb-1 block">טקסט השאלה</Label>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={mode === "poll" ? "שאלת הסקר (למשל: מה האוכל האהוב עליכם?)" : "הקלידו את השאלה כאן..."}
          className="text-base min-h-[72px] resize-none"
          rows={2}
        />
      </div>

      {/* Media URL */}
      {type !== "text" && (
        <div>
          <Label className="text-xs mb-1 block">כתובת מדיה (URL)</Label>
          <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." dir="ltr" className="h-9" />
        </div>
      )}

      {/* Number of options selector */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">מספר אפשרויות:</Label>
        {[2, 3, 4].map(n => (
          <button
            key={n}
            onClick={() => setNumOptions(n)}
            className={`w-8 h-8 rounded-lg text-sm font-bold border transition-all ${
              numOptions === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Answer options */}
      <div className="space-y-2.5">
        <Label className="text-xs block">
          {mode === "trivia" ? "תשובות — לחץ על המספר לבחירת תשובה נכונה" : "אפשרויות הסקר"}
        </Label>
        <AnimatePresence>
          {options.slice(0, numOptions).map((opt, i) => {
            const isCorrect = correctAnswer === i && mode === "trivia";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  mode === "trivia"
                    ? isCorrect ? ANSWER_CORRECT_COLORS[i] : ANSWER_COLORS[i]
                    : "border-border hover:border-primary/40 bg-muted/20"
                }`}
                onClick={() => mode === "trivia" && setCorrectAnswer(i)}
              >
                <button
                  type="button"
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 transition-all ${
                    isCorrect ? "bg-green-500 text-white shadow-md" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={e => { e.stopPropagation(); if (mode === "trivia") setCorrectAnswer(i); }}
                >
                  {isCorrect ? <Check className="w-4 h-4" /> : ANSWER_LABELS[i]}
                </button>
                <Input
                  value={opt}
                  onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                  placeholder={mode === "poll" ? `אפשרות ${i + 1}` : `תשובה ${i + 1}`}
                  className="flex-1 border-0 bg-transparent h-8 focus-visible:ring-0 text-sm"
                  onClick={e => e.stopPropagation()}
                />
                {isCorrect && mode === "trivia" && (
                  <Badge variant="secondary" className="text-xs text-green-700 bg-green-100 shrink-0">✓ נכונה</Badge>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Button
        onClick={handleAdd}
        size="lg"
        className="w-full gap-2 h-12 text-base"
        disabled={!allFilled || (mode === "trivia" && correctAnswer >= numOptions)}
      >
        <Plus className="w-5 h-5" />
        {mode === "trivia" ? "הוספת שאלה" : "הוספת סקר"}
      </Button>
    </Card>
  );
}
