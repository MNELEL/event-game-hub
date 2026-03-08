import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { GameSettings, Question, DEFAULT_CATEGORIES } from "@/types/game";
import { RotateCcw } from "lucide-react";

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
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">הגדרות משחק</h2>

        <div>
          <Label>שם המשחק</Label>
          <Input value={settings.title} onChange={e => onUpdate({ ...settings, title: e.target.value })} className="text-lg h-12" />
        </div>

        <div>
          <Label>מספר שאלות במשחק: {settings.questionsPerGame}</Label>
          <Slider
            value={[settings.questionsPerGame]}
            onValueChange={([v]) => onUpdate({ ...settings, questionsPerGame: v })}
            min={3} max={Math.max(questions.length, 5)} step={1}
            className="mt-2"
          />
        </div>

        <div>
          <Label>זמן ברירת מחדל לשאלה: {settings.defaultTimeLimit} שניות</Label>
          <Slider
            value={[settings.defaultTimeLimit]}
            onValueChange={([v]) => onUpdate({ ...settings, defaultTimeLimit: v })}
            min={5} max={60} step={5}
            className="mt-2"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>ערבוב שאלות</Label>
          <Switch checked={settings.shuffleQuestions} onCheckedChange={v => onUpdate({ ...settings, shuffleQuestions: v })} />
        </div>

        <div className="flex items-center justify-between">
          <Label>הצגת טבלת דירוג אחרי כל שאלה</Label>
          <Switch checked={settings.showLeaderboardAfterEach} onCheckedChange={v => onUpdate({ ...settings, showLeaderboardAfterEach: v })} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">קטגוריות</h2>
        <p className="text-sm text-muted-foreground">בחרו קטגוריות למשחק (השאירו ריק לכל הקטגוריות)</p>
        <div className="flex flex-wrap gap-2">
          {categoryCounts.map(c => {
            const selected = settings.selectedCategories.includes(c.id);
            return (
              <Badge
                key={c.id}
                variant={selected ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3 transition-all"
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
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">איפוס</h2>
        <Button variant="outline" onClick={onResetQuestions} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          איפוס לשאלות ברירת מחדל
        </Button>
      </Card>
    </div>
  );
}
