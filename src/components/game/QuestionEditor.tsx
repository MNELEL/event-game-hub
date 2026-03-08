import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question, QuestionType, DEFAULT_CATEGORIES } from "@/types/game";
import { Plus } from "lucide-react";

type Props = { onAdd: (q: Question) => void };

export function QuestionEditor({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [category, setCategory] = useState("general");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [points, setPoints] = useState(100);
  const [mediaUrl, setMediaUrl] = useState("");

  const handleAdd = () => {
    if (!text.trim() || options.some(o => !o.trim())) return;
    onAdd({
      id: Date.now().toString(),
      type, category, text,
      options: [...options],
      correctAnswer, timeLimit, points,
      mediaUrl: mediaUrl || undefined,
    });
    setText("");
    setOptions(["", "", "", ""]);
    setMediaUrl("");
  };

  const colors = ["bg-destructive/10 border-destructive/30", "bg-primary/10 border-primary/30", "bg-warning/10 border-warning/30", "bg-success/10 border-success/30"];

  return (
    <Card className="p-6 space-y-5">
      <h2 className="font-display text-xl font-bold">הוספת שאלה חדשה</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>סוג שאלה</Label>
          <Select value={type} onValueChange={(v: QuestionType) => setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">טקסט</SelectItem>
              <SelectItem value="image">תמונה</SelectItem>
              <SelectItem value="audio">שמע</SelectItem>
              <SelectItem value="video">וידאו</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>קטגוריה</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEFAULT_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>זמן (שניות)</Label>
            <Input type="number" value={timeLimit} onChange={e => setTimeLimit(+e.target.value)} min={5} max={60} />
          </div>
          <div>
            <Label>ניקוד</Label>
            <Input type="number" value={points} onChange={e => setPoints(+e.target.value)} min={10} step={10} />
          </div>
        </div>
      </div>

      <div>
        <Label>טקסט השאלה</Label>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="הקלידו את השאלה כאן..." className="text-lg h-12" />
      </div>

      {type !== "text" && (
        <div>
          <Label>כתובת מדיה (URL)</Label>
          <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="הכניסו קישור לתמונה/שמע/וידאו" />
        </div>
      )}

      <div className="space-y-3">
        <Label>תשובות (לחצו על התשובה הנכונה)</Label>
        {options.map((opt, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${correctAnswer === i ? colors[i] + " ring-2 ring-offset-1" : "border-border"}`} onClick={() => setCorrectAnswer(i)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${correctAnswer === i ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </div>
            <Input
              value={opt}
              onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
              placeholder={`תשובה ${i + 1}`}
              className="flex-1 border-0 bg-transparent"
              onClick={e => e.stopPropagation()}
            />
            {correctAnswer === i && <span className="text-success font-bold text-sm">✓ נכונה</span>}
          </div>
        ))}
      </div>

      <Button onClick={handleAdd} size="lg" className="w-full gap-2" disabled={!text.trim() || options.some(o => !o.trim())}>
        <Plus className="w-5 h-5" />
        הוספת שאלה
      </Button>
    </Card>
  );
}
