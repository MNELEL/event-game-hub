import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide" | "tall";
};

const aspectClass = {
  square: "aspect-square max-w-[160px]",
  wide: "aspect-[3/1] w-full",
  tall: "aspect-[4/5] max-w-[200px]",
};

export function BrandingImageUpload({ label, hint, value, onChange, aspect = "wide" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("הקובץ גדול מ-5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("יש להעלות קובץ תמונה");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `branding/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("branding-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      toast.error("העלאה נכשלה: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("branding-assets").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("התמונה הועלתה");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label className="block">
        {label}
        {hint && <span className="text-xs text-muted-foreground mr-2">({hint})</span>}
      </Label>
      <div className={`${aspectClass[aspect]} relative rounded-lg border-2 border-dashed border-game-border-gold/40 bg-game-parchment/30 overflow-hidden flex items-center justify-center`}>
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 bg-background/80 hover:bg-background rounded-full p-1"
              aria-label="הסר תמונה"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">אין תמונה</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 ml-1 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 ml-1" />
          )}
          העלאת תמונה
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
