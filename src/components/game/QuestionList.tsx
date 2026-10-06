import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Question, DEFAULT_CATEGORIES } from "@/types/game";
import { Trash2, Search, Filter, Pencil, Sparkles, CheckCircle2, Flag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Props = {
  questions: Question[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Question>) => void;
};

export function QuestionList({ questions, onRemove, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [view, setView] = useState<"all" | "picked" | "unpicked">("all");

  const categoryIds = Array.from(new Set([...DEFAULT_CATEGORIES.map(c => c.id), ...questions.map(q => q.category)]));
  const pickedCount = questions.filter(q => q.inNextGame).length;

  const filtered = questions.filter(q => {
    const matchSearch = q.text.includes(search) || q.options.some(o => o.includes(search));
    const matchCategory = filterCategory === "all" || q.category === filterCategory;
    const matchDiff = filterDifficulty === "all" || (filterDifficulty === "none" ? !q.difficulty : q.difficulty === filterDifficulty);
    const d = q.createdAt ? q.createdAt.slice(0, 10) : "";
    const matchDate = (!fromDate || (d && d >= fromDate)) && (!toDate || (d && d <= toDate));
    const matchView = view === "all" || (view === "picked" ? q.inNextGame : !q.inNextGame);
    return matchSearch && matchCategory && matchDiff && matchDate && matchView;
  });

  const diffLabels: Record<string, string> = { easy: "קל", medium: "בינוני", hard: "קשה" };

  const getCategoryName = (id: string) => DEFAULT_CATEGORIES.find(c => c.id === id)?.name || id;

  const typeLabels: Record<string, string> = { text: "טקסט", image: "תמונה", audio: "שמע", video: "וידאו" };

  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    onUpdate(editingQuestion.id, {
      text: editingQuestion.text,
      options: editingQuestion.options,
      correctAnswer: editingQuestion.correctAnswer,
      category: editingQuestion.category,
      timeLimit: editingQuestion.timeLimit,
      points: editingQuestion.points,
      type: editingQuestion.type,
      mediaUrl: editingQuestion.mediaUrl,
    });
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {([["pending", `ממתינות לאישור (${questions.filter(q => q.reviewStatus === "pending").length})`], ["flagged", `סומנו כשגויות (${questions.filter(q => q.reviewStatus === "flagged").length})`], ["all", `כל השאלות (${questions.length})`], ["picked", `נבחרו למשחק הבא (${pickedCount})`], ["unpicked", `לא נבחרו (${questions.length - pickedCount})`]] as const).map(([v, l]) => (
          <Button key={v} size="sm" variant={view === v ? "default" : "outline"} onClick={() => setView(v)}>{l}</Button>
        ))}
        {pickedCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => questions.filter(q => q.inNextGame).forEach(q => onUpdate(q.id, { inNextGame: false }))}>נקה בחירה</Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {pickedCount > 0 ? `המשחק הבא ישתמש רק ב-${pickedCount} השאלות שנבחרו.` : "לא נבחרו שאלות – המשחק הבא יבחר שאלות לפי ההגדרות."}
      </p>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש שאלות..." className="pr-10" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categoryIds.map(id => (
              <SelectItem key={id} value={id}>{getCategoryName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל רמות הקושי</SelectItem>
            <SelectItem value="easy">קל</SelectItem>
            <SelectItem value="medium">בינוני</SelectItem>
            <SelectItem value="hard">קשה</SelectItem>
            <SelectItem value="none">ללא רמה</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1 text-sm">מתאריך<Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" aria-label="מתאריך" /></label>
        <label className="flex items-center gap-1 text-sm">עד<Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" aria-label="עד תאריך" /></label>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <p className="text-lg">לא נמצאו שאלות</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((q, idx) => (
            <Card key={q.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <Checkbox checked={!!q.inNextGame} onCheckedChange={(v) => onUpdate(q.id, { inNextGame: !!v })} aria-label="בחר למשחק הבא" />
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{q.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{getCategoryName(q.category)}</Badge>
                  <Badge variant="outline" className="text-xs">{typeLabels[q.type]}</Badge>
                  {q.difficulty && <Badge variant="outline" className="text-xs">{diffLabels[q.difficulty]}</Badge>}
                  {q.source === "ai" && <Badge variant="outline" className="text-xs gap-1"><Sparkles className="w-3 h-3" />AI</Badge>}
                  <span className="text-xs text-muted-foreground">{q.timeLimit}s · {q.points}pts</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingQuestion({ ...q })}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(q.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת שאלה</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div>
                <Label>טקסט השאלה</Label>
                <Input
                  value={editingQuestion.text}
                  onChange={e => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>קטגוריה</Label>
                  <Select value={editingQuestion.category} onValueChange={v => setEditingQuestion({ ...editingQuestion, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>סוג</Label>
                  <Select value={editingQuestion.type} onValueChange={v => setEditingQuestion({ ...editingQuestion, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">טקסט</SelectItem>
                      <SelectItem value="image">תמונה</SelectItem>
                      <SelectItem value="audio">שמע</SelectItem>
                      <SelectItem value="video">וידאו</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editingQuestion.type !== "text" && (
                <div>
                  <Label>כתובת מדיה</Label>
                  <Input
                    value={editingQuestion.mediaUrl || ""}
                    onChange={e => setEditingQuestion({ ...editingQuestion, mediaUrl: e.target.value })}
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <Label>תשובות (לחץ על התשובה הנכונה)</Label>
                <div className="space-y-2 mt-1">
                  {editingQuestion.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant={editingQuestion.correctAnswer === i ? "default" : "outline"}
                        className="w-8 h-8 p-0 shrink-0"
                        onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: i })}
                      >
                        {i + 1}
                      </Button>
                      <Input
                        value={opt}
                        onChange={e => {
                          const newOpts = [...editingQuestion.options];
                          newOpts[i] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>מגבלת זמן (שניות)</Label>
                  <Input
                    type="number"
                    value={editingQuestion.timeLimit}
                    onChange={e => setEditingQuestion({ ...editingQuestion, timeLimit: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>נקודות</Label>
                  <Input
                    type="number"
                    value={editingQuestion.points}
                    onChange={e => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>ביטול</Button>
            <Button onClick={handleSaveEdit}>שמירה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
