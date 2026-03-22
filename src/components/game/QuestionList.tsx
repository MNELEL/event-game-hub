import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Question, DEFAULT_CATEGORIES } from "@/types/game";
import { Trash2, Search, Filter, Pencil, Check, Clock, Star, GripVertical, BarChart2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

type Props = {
  questions: Question[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Question>) => void;
};

const categoryColor: Record<string, string> = {
  general: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  science:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  history:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  geography:"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  entertainment:"bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  sports:   "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  food:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  jewish:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  passover: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  family:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  fun:      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const answerColors = [
  "border-red-300 bg-red-50 dark:bg-red-950/30",
  "border-blue-300 bg-blue-50 dark:bg-blue-950/30",
  "border-amber-300 bg-amber-50 dark:bg-amber-950/30",
  "border-green-300 bg-green-50 dark:bg-green-950/30",
];
const answerColorsActive = [
  "border-red-500 bg-red-100 ring-2 ring-red-400/40 dark:bg-red-900/40",
  "border-blue-500 bg-blue-100 ring-2 ring-blue-400/40 dark:bg-blue-900/40",
  "border-amber-500 bg-amber-100 ring-2 ring-amber-400/40 dark:bg-amber-900/40",
  "border-green-500 bg-green-100 ring-2 ring-green-400/40 dark:bg-green-900/40",
];

export function QuestionList({ questions, onRemove, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const filtered = questions.filter(q => {
    const matchSearch = q.text.includes(search) || q.options.some(o => o.includes(search));
    const matchCategory = filterCategory === "all" || q.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryName = (id: string) => DEFAULT_CATEGORIES.find(c => c.id === id)?.name || id;

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

  const isPoll = editingQuestion?.type === "poll";

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש שאלות..."
            className="pr-10 rounded-xl bg-card"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 rounded-xl bg-card">
            <Filter className="w-3.5 h-3.5 ml-1.5 shrink-0" />
            <SelectValue placeholder="קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {DEFAULT_CATEGORIES.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>{filtered.length} שאלות מוצגות</span>
        {filterCategory !== "all" && <span>· {getCategoryName(filterCategory)}</span>}
        {search && <span>· חיפוש: "{search}"</span>}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground rounded-2xl">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium">לא נמצאו שאלות</p>
          <p className="text-sm mt-1">נסה לשנות את החיפוש</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((q, idx) => (
            <Card
              key={q.id}
              className="rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className="flex items-center gap-3 p-3 sm:p-4">
                {/* Index */}
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {idx + 1}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug line-clamp-2">{q.text}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${categoryColor[q.category] ?? "bg-muted text-muted-foreground"}`}>
                      {getCategoryName(q.category)}
                    </span>
                    {q.type === "poll" && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" />סקר
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{q.timeLimit}ש
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="w-3 h-3" />{q.points}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary"
                    onClick={() => setEditingQuestion({ ...q })}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                    onClick={() => onRemove(q.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Sheet (mobile-friendly full-height panel) */}
      <Sheet open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl overflow-y-auto" dir="rtl">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-right">
              {editingQuestion?.type === "poll" ? (
                <><BarChart2 className="w-5 h-5 text-purple-500" />עריכת סקר</>
              ) : (
                <><Pencil className="w-5 h-5 text-primary" />עריכת שאלה</>
              )}
            </SheetTitle>
          </SheetHeader>

          {editingQuestion && (
            <div className="space-y-5 py-5">

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">סוג</Label>
                  <Select value={editingQuestion.type} onValueChange={v => setEditingQuestion({ ...editingQuestion, type: v as any })}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">טקסט</SelectItem>
                      <SelectItem value="poll">
                        <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-purple-500" />סקר</span>
                      </SelectItem>
                      <SelectItem value="image">תמונה</SelectItem>
                      <SelectItem value="audio">שמע</SelectItem>
                      <SelectItem value="video">וידאו</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">קטגוריה</Label>
                  <Select value={editingQuestion.category} onValueChange={v => setEditingQuestion({ ...editingQuestion, category: v })}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Question text */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  {isPoll ? "טקסט הסקר" : "טקסט השאלה"}
                </Label>
                <textarea
                  value={editingQuestion.text}
                  onChange={e => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={isPoll ? "מה השאלה לסקר?" : "מה השאלה?"}
                />
              </div>

              {/* Media URL */}
              {editingQuestion.type !== "text" && editingQuestion.type !== "poll" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">כתובת מדיה</Label>
                  <Input value={editingQuestion.mediaUrl || ""} onChange={e => setEditingQuestion({ ...editingQuestion, mediaUrl: e.target.value })} placeholder="https://..." dir="ltr" className="rounded-xl" />
                </div>
              )}

              {/* Answers */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  {isPoll ? "אפשרויות בסקר (אין תשובה נכונה)" : "תשובות — לחץ על הנכונה"}
                </Label>
                <div className="space-y-2">
                  {editingQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        !isPoll && editingQuestion.correctAnswer === i
                          ? answerColorsActive[i]
                          : answerColors[i]
                      }`}
                      onClick={() => !isPoll && setEditingQuestion({ ...editingQuestion, correctAnswer: i })}
                    >
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-sm transition-colors ${
                        !isPoll && editingQuestion.correctAnswer === i
                          ? "bg-green-500 text-white"
                          : "bg-white/70 text-muted-foreground border border-border"
                      }`}>
                        {!isPoll && editingQuestion.correctAnswer === i ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <Input
                        value={opt}
                        onChange={e => {
                          const newOpts = [...editingQuestion.options];
                          newOpts[i] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm px-1 h-8"
                        placeholder={`אפשרות ${i + 1}`}
                        onClick={e => e.stopPropagation()}
                      />
                      {!isPoll && editingQuestion.correctAnswer === i && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0">✓ נכונה</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Time + Points */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />זמן (שניות)
                  </Label>
                  <Input
                    type="number" min={5} max={120}
                    value={editingQuestion.timeLimit}
                    onChange={e => setEditingQuestion({ ...editingQuestion, timeLimit: Number(e.target.value) })}
                    className="rounded-xl text-center text-lg font-bold h-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />נקודות
                  </Label>
                  <Input
                    type="number" min={10} step={10}
                    value={editingQuestion.points}
                    onChange={e => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })}
                    className="rounded-xl text-center text-lg font-bold h-12"
                  />
                </div>
              </div>

              {/* Quick point presets */}
              <div className="flex gap-2">
                {[50, 100, 150, 200].map(p => (
                  <button
                    key={p}
                    onClick={() => setEditingQuestion({ ...editingQuestion, points: p })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      editingQuestion.points === p
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SheetFooter className="flex-row gap-3 pt-4 border-t border-border sticky bottom-0 bg-background pb-safe">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditingQuestion(null)}>ביטול</Button>
            <Button className="flex-1 rounded-xl" onClick={handleSaveEdit}>
              <Check className="w-4 h-4 ml-1.5" />שמור שינויים
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
