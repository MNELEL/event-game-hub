import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Question } from "@/types/game";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  onImport: (questions: Question[]) => void;
  onReplace: (questions: Question[]) => void;
};

const EXAMPLE = `מה הצבע האהוב על חיוש?
* ורוד
תכלת
ירוק
צהוב

באיזו עיר חיוש גרה?
ירושלים
* תל אביב
חיפה`;

function cleanLine(line: string): { text: string; correct: boolean } {
  let s = line.trim();
  let correct = false;
  if (/^[*+]\s*/.test(s)) {
    correct = true;
    s = s.replace(/^[*+]\s*/, "");
  }
  // Strip prefixes like "1.", "1)", "א.", "א)"
  s = s.replace(/^[0-9]+[.)]\s*/, "");
  s = s.replace(/^[א-ת][.)]\s*/, "");
  if (/^[*+]\s*/.test(s)) {
    correct = true;
    s = s.replace(/^[*+]\s*/, "");
  }
  return { text: s.trim(), correct };
}

export function parseQuestionsText(input: string): { questions: Question[]; errors: string[] } {
  const errors: string[] = [];
  const questions: Question[] = [];
  const blocks = input
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  blocks.forEach((block, idx) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) {
      errors.push(`בלוק ${idx + 1}: דרושות לפחות שאלה ושתי תשובות`);
      return;
    }
    const text = lines[0].replace(/^[0-9]+[.)]\s*/, "").trim();
    const optionLines = lines.slice(1);
    const parsed = optionLines.map(cleanLine).filter((o) => o.text.length > 0);
    if (parsed.length < 2) {
      errors.push(`בלוק ${idx + 1}: דרושות לפחות שתי תשובות`);
      return;
    }
    if (parsed.length > 4) parsed.length = 4;
    let correctIndex = parsed.findIndex((o) => o.correct);
    if (correctIndex < 0) correctIndex = 0;
    questions.push({
      id: `text-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      type: "text",
      category: "general",
      text,
      options: parsed.map((o) => o.text),
      correctAnswer: correctIndex,
      timeLimit: 15,
      points: 100,
    });
  });

  return { questions, errors };
}

export function QuestionTextImport({ onImport, onReplace }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const { questions, errors } = useMemo(() => parseQuestionsText(text), [text]);

  const handleAppend = () => {
    if (questions.length === 0) {
      toast.error("לא זוהו שאלות תקינות");
      return;
    }
    onImport(questions);
    toast.success(`נוספו ${questions.length} שאלות`);
    setText("");
    setOpen(false);
  };

  const handleReplace = () => {
    if (questions.length === 0) {
      toast.error("לא זוהו שאלות תקינות");
      return;
    }
    onReplace(questions);
    toast.success(`הוחלפו כל השאלות ב-${questions.length} שאלות חדשות`);
    setText("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 ml-1" />
          הדבקת שאלות מטקסט
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ייבוא שאלות ממלל חופשי</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              כתבו או הדביקו שאלות. כל שאלה מופרדת בשורה ריקה. השורה הראשונה היא השאלה,
              השורות הבאות הן התשובות (2-4). סמנו את התשובה הנכונה בכוכבית <code>*</code> בתחילת השורה.
            </span>
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          className="min-h-[260px] font-mono text-sm"
          dir="rtl"
        />

        <div className="text-sm text-muted-foreground">
          זוהו <strong>{questions.length}</strong> שאלות תקינות
          {errors.length > 0 && (
            <ul className="mt-2 text-xs text-destructive list-disc pr-5">
              {errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
          <Button variant="secondary" onClick={handleAppend} disabled={questions.length === 0}>
            הוסף לשאלות הקיימות
          </Button>
          <Button variant="destructive" onClick={handleReplace} disabled={questions.length === 0}>
            החלף את כל השאלות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
