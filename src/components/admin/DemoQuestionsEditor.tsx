import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save, RotateCcw, Upload, ExternalLink, Loader2 } from "lucide-react";
import {
  loadDemoQuestions, saveDemoQuestions, resetDemoQuestions,
  DEFAULT_DEMO_QUESTIONS, type DemoQuestion, type DemoQType,
} from "@/data/landingDemo";

const TABS: { qid: DemoQType; label: string }[] = [
  { qid: "text", label: "טקסט" },
  { qid: "image", label: "תמונה" },
  { qid: "video", label: "וידאו" },
  { qid: "boolean", label: "נכון / לא נכון" },
];

export function DemoQuestionsEditor() {
  const [questions, setQuestions] = useState<DemoQuestion[]>(() => loadDemoQuestions());
  const [active, setActive] = useState<DemoQType>("text");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setQuestions(loadDemoQuestions());
  }, []);

  const update = (qid: DemoQType, patch: Partial<DemoQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.qid === qid ? { ...q, ...patch } : q)));
  };

  const updateOption = (qid: DemoQType, idx: number, value: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.qid !== qid) return q;
      const opts = [...q.options];
      opts[idx] = value;
      return { ...q, options: opts };
    }));
  };

  const addOption = (qid: DemoQType) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.qid !== qid || q.options.length >= 6) return q;
      return { ...q, options: [...q.options, "אפשרות חדשה"] };
    }));
  };

  const removeOption = (qid: DemoQType, idx: number) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.qid !== qid || q.options.length <= 2) return q;
      const opts = q.options.filter((_, i) => i !== idx);
      let correct = q.correct;
      if (idx === q.correct) correct = 0;
      else if (idx < q.correct) correct = q.correct - 1;
      return { ...q, options: opts, correct };
    }));
  };

  const handleSave = () => {
    // Validate
    for (const q of questions) {
      if (!q.q.trim()) return toast.error(`${q.label}: השאלה ריקה`);
      if (q.options.some((o) => !o.trim())) return toast.error(`${q.label}: יש תשובות ריקות`);
      if (q.correct >= q.options.length) return toast.error(`${q.label}: תשובה נכונה לא חוקית`);
      if ((q.qid === "image" || q.qid === "video") && !q.media?.src?.trim()) {
        return toast.error(`${q.label}: חסר קובץ מדיה`);
      }
    }
    saveDemoQuestions(questions);
    toast.success("שאלות הדמו נשמרו! דף הנחיתה התעדכן.");
  };

  const handleReset = () => {
    if (!confirm("לאפס את שאלות הדמו לברירת מחדל?")) return;
    resetDemoQuestions();
    setQuestions(DEFAULT_DEMO_QUESTIONS);
    toast.success("אופס לברירת מחדל");
  };

  const handleUpload = async (qid: DemoQType, file: File, type: "image" | "video") => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${qid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("demo-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("demo-media").getPublicUrl(path);
      update(qid, { media: { type, src: pub.publicUrl } });
      toast.success("הקובץ הועלה");
    } catch (e: any) {
      toast.error(e.message || "העלאה נכשלה");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl font-bold">עריכת שאלות הדמו בדף הנחיתה</h2>
          <p className="text-sm text-muted-foreground">
            השינויים נשמרים בדפדפן ומתעדכנים מיד בדף הנחיתה.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.open("/#demo", "_blank")} className="gap-1">
            <ExternalLink className="w-4 h-4" /> תצוגה בדף הנחיתה
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="w-4 h-4" /> אפס לברירת מחדל
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1">
            <Save className="w-4 h-4" /> שמור שינויים
          </Button>
        </div>
      </div>

      <Tabs value={active} onValueChange={(v) => setActive(v as DemoQType)}>
        <TabsList className="grid grid-cols-4 w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.qid} value={t.qid}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => {
          const q = questions.find((x) => x.qid === t.qid);
          if (!q) return null;
          return (
            <TabsContent key={t.qid} value={t.qid}>
              <Card className="p-5 space-y-5">
                {/* Question text */}
                <div className="space-y-2">
                  <Label>טקסט השאלה</Label>
                  <Input
                    value={q.q}
                    onChange={(e) => update(t.qid, { q: e.target.value })}
                    placeholder="לדוגמה: מהי בירת ישראל?"
                  />
                </div>

                {/* Media for image/video */}
                {(t.qid === "image" || t.qid === "video") && (
                  <div className="space-y-2">
                    <Label>{t.qid === "image" ? "תמונה" : "וידאו"}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={q.media?.src || ""}
                        onChange={(e) => update(t.qid, {
                          media: { type: t.qid as "image" | "video", src: e.target.value },
                        })}
                        placeholder="הדבק URL או העלה קובץ"
                      />
                      <Button variant="outline" size="sm" asChild className="shrink-0">
                        <label className="cursor-pointer gap-1">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          העלה
                          <input
                            type="file"
                            hidden
                            accept={t.qid === "image" ? "image/*" : "video/*"}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(t.qid, f, t.qid as "image" | "video");
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </Button>
                    </div>
                    {q.media?.src && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border max-w-xs aspect-video bg-muted">
                        {t.qid === "image" ? (
                          <img src={q.media.src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={q.media.src} controls muted className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>תשובות (סמן את הנכונה)</Label>
                    {t.qid !== "boolean" && q.options.length < 6 && (
                      <Button variant="ghost" size="sm" onClick={() => addOption(t.qid)} className="gap-1">
                        <Plus className="w-3 h-3" /> הוסף תשובה
                      </Button>
                    )}
                  </div>
                  <RadioGroup
                    value={String(q.correct)}
                    onValueChange={(v) => update(t.qid, { correct: parseInt(v) })}
                  >
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <RadioGroupItem value={String(i)} id={`${t.qid}-${i}`} />
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(t.qid, i, e.target.value)}
                          className="flex-1"
                        />
                        {t.qid !== "boolean" && q.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(t.qid, i)}
                            className="text-destructive shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
