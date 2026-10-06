import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Loader2, Package } from "lucide-react";
import { QUESTION_PACKS } from "@/data/questionPacks";
import type { Question } from "@/types/game";

type Props = { onAdd: (q: Question) => Promise<void> | void; existingTexts: string[]; defaultTimeLimit: number };

export function QuestionPacks({ onAdd, existingTexts, defaultTimeLimit }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const addPack = async (id: string) => {
    const pack = QUESTION_PACKS.find((p) => p.id === id)!;
    const existing = new Set(existingTexts.map((t) => t.trim()));
    const fresh = pack.questions.filter((q) => !existing.has(q.text.trim()));
    if (!fresh.length) return toast.info("כל השאלות בחבילה הזו כבר במאגר");
    setBusy(id);
    for (const q of fresh) {
      await onAdd({
        id: crypto.randomUUID().slice(0, 8), type: "text", category: "general",
        text: q.text, options: [...q.options], correctAnswer: q.correctAnswer,
        timeLimit: defaultTimeLimit, points: 100, difficulty: q.difficulty, source: `pack:${pack.id}`,
      });
    }
    setBusy(null);
    toast.success(`נוספו ${fresh.length} שאלות מחבילת "${pack.name}"`);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold">מאגר שאלות ידועות ומאושרות</h2>
      </div>
      <p className="text-sm text-muted-foreground">הוסיפו חבילה שלמה למאגר בלחיצה אחת. השאלות מאושרות מראש ותמיד זמינות למשחק, ואפשר לערוך או לשנות אותן בלשונית "שאלות". שאלות שכבר קיימות לא יוכפלו.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {QUESTION_PACKS.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border-2 border-double border-border p-3">
            <div className="min-w-0">
              <div className="font-bold">{p.icon} {p.name}</div>
              <div className="text-xs text-muted-foreground">{p.description} · {p.questions.length} שאלות</div>
            </div>
            <Button size="sm" onClick={() => addPack(p.id)} disabled={!!busy} className="gap-1 shrink-0">
              {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              הוסף
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
