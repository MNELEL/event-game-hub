import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Question } from "@/types/game";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  questions: Question[];
  onImport: (questions: Question[]) => void;
  onReplace: (questions: Question[]) => void;
};

export function QuestionImportExport({ questions, onImport, onReplace }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Question[] | null>(null);

  const handleExport = () => {
    const data = JSON.stringify(questions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mega-moach-questions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`יוצאו ${questions.length} שאלות בהצלחה`);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          toast.error("הקובץ חייב להכיל מערך של שאלות");
          return;
        }
        const valid = parsed.every(
          (q: any) => q.text && Array.isArray(q.options) && q.options.length >= 2 && typeof q.correctAnswer === "number"
        );
        if (!valid) {
          toast.error("חלק מהשאלות בקובץ אינן תקינות");
          return;
        }
        const normalized: Question[] = parsed.map((q: any, i: number) => ({
          id: q.id || `imported-${Date.now()}-${i}`,
          type: q.type || "text",
          category: q.category || "general",
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          timeLimit: q.timeLimit || 15,
          points: q.points || 100,
          mediaUrl: q.mediaUrl,
        }));
        setPendingImport(normalized);
      } catch {
        toast.error("שגיאה בקריאת הקובץ - ודא שזהו קובץ JSON תקין");
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAppend = () => {
    if (pendingImport) {
      onImport(pendingImport);
      toast.success(`נוספו ${pendingImport.length} שאלות`);
      setPendingImport(null);
    }
  };

  const handleReplace = () => {
    if (pendingImport) {
      onReplace(pendingImport);
      toast.success(`הוחלפו כל השאלות ב-${pendingImport.length} שאלות חדשות`);
      setPendingImport(null);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 ml-1" />
          ייצוא JSON
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 ml-1" />
          ייבוא JSON
        </Button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>

      <Dialog open={!!pendingImport} onOpenChange={(open) => !open && setPendingImport(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ייבוא שאלות</DialogTitle>
            <DialogDescription>
              נמצאו {pendingImport?.length} שאלות בקובץ. מה תרצה לעשות?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPendingImport(null)}>ביטול</Button>
            <Button variant="secondary" onClick={handleAppend}>הוסף לשאלות הקיימות</Button>
            <Button variant="destructive" onClick={handleReplace}>החלף את כל השאלות</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
