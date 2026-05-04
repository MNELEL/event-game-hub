import { useEffect, useState } from "react";
import { useBranding, BrandingValues } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { BrandingImageUpload } from "./BrandingImageUpload";

const FIELDS: Array<{
  key: keyof BrandingValues;
  label: string;
  hint?: string;
  textarea?: boolean;
}> = [
  { key: "name", label: "שם האפליקציה" },
  { key: "shortName", label: "שם קצר (להתקנה / PWA)" },
  { key: "fullName", label: "שם מלא (כותרת דף)" },
  { key: "phone", label: "מספר טלפון בלובי" },
  { key: "iconPrimary", label: "אייקון ראשי", hint: "אימוג'י יחיד" },
  { key: "iconFestive", label: "אייקונים חגיגיים", hint: "שילוב אימוג'ים" },
  { key: "tagline", label: "סלוגן (Tagline)" },
  { key: "heroSubtitle", label: "כותרת משנה - דף בית" },
  { key: "lobbySubtitle", label: "כותרת משנה - לובי" },
  { key: "aboutDescription", label: "תיאור בדף האודות", textarea: true },
];

export function BrandingEditor() {
  const { branding, save, refresh, loading } = useBranding();
  const [draft, setDraft] = useState<BrandingValues>(branding);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(branding);
  }, [branding]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(branding);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await save(draft);
    setSaving(false);
    if (error) toast.error("שמירה נכשלה: " + error);
    else toast.success("המיתוג נשמר בהצלחה");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">עריכת מיתוג</h2>
          <p className="text-sm text-muted-foreground mt-1">
            שינויים נשמרים בענן ומתעדכנים בכל המסכים אוטומטית.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refresh()} disabled={loading}>
            <RotateCcw className="w-4 h-4 ml-1" />
            רענן
          </Button>
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Save className="w-4 h-4 ml-1" />}
            שמור שינויים
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-xl border-2 border-double border-game-border-gold bg-game-parchment/30 p-6 text-center">
        <div className="text-5xl mb-2">{draft.iconFestive}</div>
        <h3 className="font-display text-3xl text-game-dark-gold mb-1">{draft.name}</h3>
        <p className="text-sm text-game-dark-gold/70">{draft.tagline}</p>
        <p className="text-xs text-game-dark-gold/60 mt-2">{draft.phone}</p>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-4 bg-card/50">
        <div>
          <h3 className="font-display text-lg text-foreground">תמונות מיתוג</h3>
          <p className="text-xs text-muted-foreground">הלוגו, תמונת הכותרת ותמונת הרקע יוצגו אוטומטית במסכי הבית והלובי.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <BrandingImageUpload
            label="לוגו"
            hint="מומלץ ריבועי PNG שקוף"
            value={draft.logoUrl}
            onChange={(url) => setDraft({ ...draft, logoUrl: url })}
            aspect="square"
          />
          <BrandingImageUpload
            label="תמונת כותרת (Hero)"
            hint="פס רחב מעל הכותרת"
            value={draft.heroImageUrl}
            onChange={(url) => setDraft({ ...draft, heroImageUrl: url })}
            aspect="wide"
          />
          <BrandingImageUpload
            label="תמונת רקע"
            hint="תוצג דהויה כרקע"
            value={draft.backgroundImageUrl}
            onChange={(url) => setDraft({ ...draft, backgroundImageUrl: url })}
            aspect="tall"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.textarea ? "md:col-span-2" : ""}>
            <Label htmlFor={f.key} className="mb-1 block">
              {f.label}
              {f.hint && <span className="text-xs text-muted-foreground mr-2">({f.hint})</span>}
            </Label>
            {f.textarea ? (
              <Textarea
                id={f.key}
                value={draft[f.key]}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                rows={3}
              />
            ) : (
              <Input
                id={f.key}
                value={draft[f.key]}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Save className="w-4 h-4 ml-1" />}
          שמור שינויים
        </Button>
      </div>
    </div>
  );
}
