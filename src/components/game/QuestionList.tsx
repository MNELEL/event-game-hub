import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Question, DEFAULT_CATEGORIES } from "@/types/game";
import { Trash2, Search, Filter, Pencil } from "lucide-react";
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

  const filtered = questions.filter(q => {
    const matchSearch = q.text.includes(search) || q.options.some(o => o.includes(search));
    const matchCategory = filterCategory === "all" || q.category === filterCategory;
    return matchSearch && matchCategory;
  });

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
      <div className="flex gap-3">
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
            {DEFAULT_CATEGORIES.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <p className="text-lg">לא נמצאו שאלות</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((q, idx) => (
            <Card key={q.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{q.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{getCategoryName(q.category)}</Badge>
                  <Badge variant="outline" className="text-xs">{typeLabels[q.type]}</Badge>
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
