import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Question } from "@/types/game";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

type Props = {
  questions: Question[];
  onImport: (questions: Question[]) => void;
};

export function QuestionImportExport({ questions, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          toast.error("הקובץ חייב להכיל מערך של שאלות");
          return;
        }

        const valid = parsed.every(
          (q: any) =>
            q.text &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            typeof q.correctAnswer === "number"
        );

        if (!valid) {
          toast.error("חלק מהשאלות בקובץ אינן תקינות");
          return;
        }

        // Normalize imported questions
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

        onImport(normalized);
        toast.success(`יובאו ${normalized.length} שאלות בהצלחה`);
      } catch {
        toast.error("שגיאה בקריאת הקובץ - ודא שזהו קובץ JSON תקין");
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="w-4 h-4 ml-1" />
        ייצוא JSON
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload className="w-4 h-4 ml-1" />
        ייבוא JSON
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}
