import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameStore } from "@/hooks/useGameStore";
import { QuestionEditor } from "@/components/game/QuestionEditor";
import { QuestionList } from "@/components/game/QuestionList";
import { GameSettingsPanel } from "@/components/game/GameSettingsPanel";
import { TutorialDialog } from "@/components/game/TutorialDialog";
import { ArrowRight, Play, HelpCircle, Settings, List, Plus, Home } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const store = useGameStore();
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">🧠 מגה מוח - ממשק ניהול</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
              <HelpCircle className="w-4 h-4 ml-1" />
              הדרכה
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate("/host")}>
              <Play className="w-4 h-4 ml-1" />
              הפעלת משחק
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="questions" className="gap-2 font-display">
              <List className="w-4 h-4" />
              שאלות ({store.questions.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2 font-display">
              <Plus className="w-4 h-4" />
              הוספת שאלה
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 font-display">
              <Settings className="w-4 h-4" />
              הגדרות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <QuestionList
              questions={store.questions}
              onRemove={store.removeQuestion}
              onUpdate={store.updateQuestion}
            />
          </TabsContent>

          <TabsContent value="add">
            <QuestionEditor onAdd={store.addQuestion} />
          </TabsContent>

          <TabsContent value="settings">
            <GameSettingsPanel
              settings={store.settings}
              onUpdate={store.updateSettings}
              questions={store.questions}
              onResetQuestions={() => {
                const { defaultQuestions } = require("@/data/defaultQuestions");
                store.updateQuestions(defaultQuestions);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      <TutorialDialog open={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default Admin;
