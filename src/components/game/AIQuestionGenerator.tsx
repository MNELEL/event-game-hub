import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Sparkles, Check } from "lucide-react";

type Gen = { text: string; options: string[]; correctAnswer: number; category: string };

export function AIQuestionGenerator({ onAdd, defaultTimeLimit = 15 }: { onAdd: (q: Question) => Promise<void>; defaultTimeLimit?: number }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Gen[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true); setError(""); setResults([]);
    const { data, error } = await supabase.functions.invoke("generate-questions", { body: { topic, count, difficulty } });
    setLoading(false);
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg || (await (error as any)?.context?.json())?.error; } catch {}
      setError(msg || "יצירת השאלות נכשלה");
      return;
    }
    const qs: Gen[] = data?.questions ?? [];
    setResults(qs);
    setSelected(new Set(qs.map((_, i) => i)));
  };

  const save = async () => {
    setSaving(true);
    let n = 0;
    for (const i of [...selected].sort((a, b) => a - b)) {
      const g = results[i];
      await onAdd({ id: crypto.randomUUID().slice(0, 8), type: "text", category: g.category, text: g.text, options: g.options, correctAnswer: g.correctAnswer, timeLimit: defaultTimeLimit, points: 100 });
      n++;
    }
    setSaving(false);
    toast.success(`נוספו ${n} שאלות למאגר`);
    setResults([]); setSelected(new Set());
  };

  const toggle = (i: number) => setSelected((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div dir="rtl" className="space-y-4 rounded-lg border-4 border-double border-primary/40 bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl">יצירת שאלות עם AI</h2>
      </div>
      <p className="text-sm text-muted-foreground">כתבו נושא (למשל "תולדות ירושלים") או הדביקו טקסט, והמערכת תיצור שאלות עם 4 תשובות.</p>
      <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={4} maxLength={6000} placeholder="נושא או טקסט חופשי..." />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">כמות
          <Input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} className="w-24" />
        </label>
        <div className="flex gap-1">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <Button key={d} type="button" size="sm" variant={difficulty === d ? "default" : "outline"} onClick={() => setDifficulty(d)}>
              {{ easy: "קל", medium: "בינוני", hard: "קשה" }[d]}
            </Button>
          ))}
        </div>
        <Button onClick={generate} disabled={loading || topic.trim().length < 2} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "יוצר שאלות..." : "צור שאלות"}
        </Button>
      </div>
      {error && <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((q, i) => (
            <div key={i} className="flex gap-3 rounded border border-border bg-background p-3">
              <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} className="mt-1" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">{q.category}</div>
                <div className="font-medium">{q.text}</div>
                <ul className="mt-1 grid grid-cols-2 gap-1 text-sm">
                  {q.options.map((o, j) => (
                    <li key={j} className={j === q.correctAnswer ? "flex items-center gap-1 font-semibold text-primary" : "text-muted-foreground"}>
                      {j === q.correctAnswer && <Check className="h-3 w-3" />}{o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <Button onClick={save} disabled={saving || selected.size === 0} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}הוסף {selected.size} שאלות למאגר
          </Button>
        </div>
      )}
    </div>
  );
}
