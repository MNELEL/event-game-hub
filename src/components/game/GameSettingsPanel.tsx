import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { GameSettings, Question, DEFAULT_CATEGORIES } from "@/types/game";
import { RotateCcw, Palette } from "lucide-react";
import { ThemePicker } from "./ThemePicker";

type Props = {
  settings: GameSettings;
  onUpdate: (s: GameSettings) => void;
  questions: Question[];
  onResetQuestions: () => void;
};

export function GameSettingsPanel({ settings, onUpdate, questions, onResetQuestions }: Props) {
  const categoryCounts = DEFAULT_CATEGORIES.map(c => ({
    ...c,
    count: questions.filter(q => q.category === c.id).length,
  })).filter(c => c.count > 0 || settings.selectedCategories.includes(c.id));

  return (
    <div className="space-y-5">
      {/* Game settings */}
      <Card className="p-5 space-y-4">
        <h2 className="font-display text-xl font-bold">⚙️ הגדרות משחק</h2>

        <div>
          <Label className="text-sm mb-1.5 block">שם המשחק</Label>
          <Input
            value={settings.title}
            onChange={e => onUpdate({ ...settings, title: e.target.value })}
            className="text-base h-11"
          />
        </div>

        <div>
          <Label className="text-sm mb-1.5 block">
            מספר שאלות במשחק: <span className="font-bold text-primary">{settings.questionsPerGame}</span>
          </Label>
          <Slider
            value={[settings.questionsPerGame]}
            onValueChange={([v]) => onUpdate({ ...settings, questionsPerGame: v })}
            min={3} max={Math.max(questions.length, 5)} step={1}
            className="mt-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>3</span><span>{Math.max(questions.length, 5)}</span>
          </div>
        </div>

        <div>
          <Label className="text-sm mb-1.5 block">
            זמן ברירת מחדל: <span className="font-bold text-primary">{settings.defaultTimeLimit} שניות</span>
          </Label>
          <Slider
            value={[settings.defaultTimeLimit]}
            onValueChange={([v]) => onUpdate({ ...settings, defaultTimeLimit: v })}
            min={5} max={60} step={5}
            className="mt-1"
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm">ערבוב שאלות</Label>
            <p className="text-xs text-muted-foreground">שאלות יוצגו בסדר אקראי</p>
          </div>
          <Switch checked={settings.shuffleQuestions} onCheckedChange={v => onUpdate({ ...settings, shuffleQuestions: v })} />
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm">טבלת דירוג בין שאלות</Label>
            <p className="text-xs text-muted-foreground">הצג דירוג אחרי כל שאלה</p>
          </div>
          <Switch checked={settings.showLeaderboardAfterEach} onCheckedChange={v => onUpdate({ ...settings, showLeaderboardAfterEach: v })} />
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold">🏷️ קטגוריות</h2>
          <p className="text-sm text-muted-foreground">בחרו קטגוריות למשחק (השאירו ריק לכולן)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryCounts.map(c => {
            const selected = settings.selectedCategories.includes(c.id);
            return (
              <Badge
                key={c.id}
                variant={selected ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3 transition-all hover:scale-105 active:scale-95 select-none"
                style={selected ? { backgroundColor: c.color, borderColor: c.color } : {}}
                onClick={() => {
                  const cats = selected
                    ? settings.selectedCategories.filter(id => id !== c.id)
                    : [...settings.selectedCategories, c.id];
                  onUpdate({ ...settings, selectedCategories: cats });
                }}
              >
                {c.name} ({c.count})
              </Badge>
            );
          })}
        </div>
        {settings.selectedCategories.length > 0 && (
          <button
            onClick={() => onUpdate({ ...settings, selectedCategories: [] })}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            נקה בחירה — הצג הכל
          </button>
        )}
      </Card>

      {/* Theme */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-bold">ערכת נושא</h2>
        </div>
        <ThemePicker />
      </Card>

      {/* Reset */}
      <Card className="p-5 space-y-3">
        <h2 className="font-display text-xl font-bold text-destructive">🔄 איפוס</h2>
        <p className="text-sm text-muted-foreground">מחיקת כל השינויים והחזרה לשאלות ברירת המחדל</p>
        <Button
          variant="outline"
          onClick={onResetQuestions}
          className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <RotateCcw className="w-4 h-4" />
          איפוס לשאלות ברירת מחדל
        </Button>
      </Card>
    </div>
  );
}
