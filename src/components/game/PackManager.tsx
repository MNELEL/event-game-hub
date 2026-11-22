import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Trash2, Play, Flag } from "lucide-react";
import { QUESTION_PACKS } from "@/data/questionPacks";
import type { Question } from "@/types/game";

type Props = {
  questions: Question[];
  onUpdate: (id: string, updates: Partial<Question>) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
};

/** Pick one question pack and review only its questions: approve, flag, remove, or use for the next game. */
export function PackManager({ questions, onUpdate, onRemove }: Props) {
  const [packId, setPackId] = useState(QUESTION_PACKS[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const pack = QUESTION_PACKS.find((p) => p.id === packId);
  const inPack = useMemo(() => questions.filter((q) => q.source === `pack:${packId}`), [questions, packId]);

  const bulk = async (label: string, fn: (q: Question) => Promise<void> | void, list = inPack) => {
    if (!list.length) return toast.info("אין שאלות מהחבילה הזו במאגר");
    setBusy(true);
    for (const q of list) await fn(q);
    setBusy(false);
    toast.success(`${label}: ${list.length} שאלות`);
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-display text-xl font-bold">ניהול לפי חבילה</h2>
      <div className="flex flex-wrap gap-2">
        {QUESTION_PACKS.map((p) => {
          const n = questions.filter((q) => q.source === `pack:${p.id}`).length;
          return (
            <Button key={p.id} size="sm" variant={p.id === packId ? "default" : "outline"} onClick={() => setPackId(p.id)}>
              {p.icon} {p.name} ({n})
            </Button>
          );
        })}
      </div>
      {pack && <p className="text-sm text-muted-foreground">{pack.description} · {inPack.length} שאלות מהחבילה במאגר</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} className="gap-1" onClick={() => bulk("אושרו", (q) => onUpdate(q.id, { reviewStatus: "approved" }))}>
          <Check className="w-4 h-4" /> אשר את כל החבילה
        </Button>
        <Button size="sm" variant="outline" disabled={busy} className="gap-1"
          onClick={() => bulk("נבחרו למשחק הבא", (q) => onUpdate(q.id, { inNextGame: true, reviewStatus: "approved" }))}>
          <Play className="w-4 h-4" /> הכן משחק מהחבילה
        </Button>
        <Button size="sm" variant="destructive" disabled={busy} className="gap-1"
          onClick={() => { if (confirm(`למחוק את כל ${inPack.length} השאלות של החבילה מהמאגר?`)) bulk("נמחקו", (q) => onRemove(q.id)); }}>
          <Trash2 className="w-4 h-4" /> נקה את החבילה מהמאגר
        </Button>
      </div>
      <ul className="space-y-2">
        {inPack.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
            <div className="min-w-0">
              <div className="font-medium">{q.text}</div>
              <div className="text-xs text-muted-foreground">
                {q.reviewStatus === "approved" ? "מאושרת" : q.reviewStatus === "flagged" ? "סומנה כלא מתאימה" : "ממתינה"}
                {q.inNextGame ? " · במשחק הבא" : ""}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="outline" aria-label="אשר" onClick={() => onUpdate(q.id, { reviewStatus: "approved" })}><Check className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline" aria-label="סמן כלא מתאימה" onClick={() => onUpdate(q.id, { reviewStatus: "flagged", inNextGame: false })}><Flag className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline" aria-label="מחק" onClick={() => onRemove(q.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
