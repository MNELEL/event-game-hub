import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { defaultQuestions } from "@/data/defaultQuestions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { QuestionEditor } from "@/components/game/QuestionEditor";
import { QuestionList } from "@/components/game/QuestionList";
import { GameSettingsPanel } from "@/components/game/GameSettingsPanel";
import { TutorialDialog } from "@/components/game/TutorialDialog";
import { QuestionImportExport } from "@/components/game/QuestionImportExport";
import { Play, HelpCircle, Settings, List, Plus, Home, LogOut, Loader2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const store = useSupabaseQuestions();
  const [showTutorial, setShowTutorial] = useState(false);

  if (store.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">🧠 מגה מוח - ממשק ניהול</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-xs text-muted-foreground hidden md:inline">{user.email}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
              <HelpCircle className="w-4 h-4 ml-1" />
              הדרכה
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate("/host")}>
              <Play className="w-4 h-4 ml-1" />
              הפעלת משחק
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-1" />
              יציאה
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
            <div className="flex justify-end mb-4">
              <QuestionImportExport
                questions={store.questions}
                onImport={(imported) => store.updateQuestions([...store.questions, ...imported])}
              />
            </div>
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
              onResetQuestions={() => store.updateQuestions(defaultQuestions)}
            />
          </TabsContent>
        </Tabs>
      </main>

      <TutorialDialog open={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default Admin;
