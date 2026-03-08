import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Question, DEFAULT_CATEGORIES } from "@/types/game";
import { Trash2, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  questions: Question[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Question>) => void;
};

export function QuestionList({ questions, onRemove, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const filtered = questions.filter(q => {
    const matchSearch = q.text.includes(search) || q.options.some(o => o.includes(search));
    const matchCategory = filterCategory === "all" || q.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryName = (id: string) => DEFAULT_CATEGORIES.find(c => c.id === id)?.name || id;

  const typeLabels: Record<string, string> = { text: "טקסט", image: "תמונה", audio: "שמע", video: "וידאו" };

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
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(q.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
