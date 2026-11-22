import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, Music, Trash2, Play, Pause, CheckCircle2 } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";

type Track = {
  id: string;
  name: string;
  url: string;
  storage_path: string;
  is_active: boolean;
  created_at: string;
};

export function BackgroundMusicManager() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("background_music")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("שגיאה בטעינת מוזיקה");
    else setTracks((data as Track[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("אנא בחר קובץ אודיו");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי (מקסימום 20MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp3";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("background-music")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("background-music").getPublicUrl(path);
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insErr } = await (supabase as any).from("background_music").insert({
        name: name || file.name,
        url: pub.publicUrl,
        storage_path: path,
        is_active: false,
        uploaded_by: user?.id,
      });
      if (insErr) throw insErr;
      toast.success("המוזיקה הועלתה בהצלחה");
      setName("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err: any) {
      toast.error(err?.message || "שגיאה בהעלאה");
    } finally {
      setUploading(false);
    }
  };

  const setActive = async (track: Track) => {
    // Deactivate others, activate this one
    await (supabase as any).from("background_music").update({ is_active: false }).neq("id", track.id);
    const { error } = await (supabase as any)
      .from("background_music")
      .update({ is_active: true })
      .eq("id", track.id);
    if (error) {
      toast.error("שגיאה בהפעלת המוזיקה");
      return;
    }
    SoundEffects.setCustomMusicUrl(track.url);
    toast.success(`"${track.name}" הוגדרה כמוזיקת רקע`);
    await load();
  };

  const disableAll = async () => {
    await (supabase as any).from("background_music").update({ is_active: false }).neq("id", "");
    SoundEffects.setCustomMusicUrl(null);
    toast.success("חזרנו למוזיקה הסינתטית");
    await load();
  };

  const remove = async (track: Track) => {
    if (!confirm(`למחוק את "${track.name}"?`)) return;
    await supabase.storage.from("background-music").remove([track.storage_path]);
    await (supabase as any).from("background_music").delete().eq("id", track.id);
    if (track.is_active) SoundEffects.setCustomMusicUrl(null);
    toast.success("המוזיקה נמחקה");
    await load();
  };

  const togglePreview = (track: Track) => {
    if (previewId === track.id) {
      audioRef.current?.pause();
      setPreviewId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(track.url);
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => toast.error("לא ניתן להשמיע"));
    audioRef.current.onended = () => setPreviewId(null);
    setPreviewId(track.id);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="parchment-card parchment-border-double p-6">
        <h3 className="font-display text-xl font-bold text-game-dark-gold mb-1 flex items-center gap-2">
          <Music className="w-5 h-5" /> העלאת מוזיקת רקע
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          העלה קובץ אודיו (MP3, WAV, OGG) שישמש כמוזיקת רקע באפליקציה. עד 20MB.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="music-name">שם השיר (אופציונלי)</Label>
            <Input
              id="music-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: ניגון פתיחה"
              className="mt-1"
            />
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={handleUpload}
              className="hidden"
              id="music-file"
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> מעלה...</>
              ) : (
                <><Upload className="w-4 h-4 ml-2" /> בחר קובץ והעלה</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="parchment-card parchment-border-double p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-game-dark-gold flex items-center gap-2">
            <Music className="w-5 h-5" /> ספריית מוזיקה
          </h3>
          {tracks.some((t) => t.is_active) && (
            <Button variant="outline" size="sm" onClick={disableAll}>
              חזור למוזיקה ברירת מחדל
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-game-dark-gold" />
          </div>
        ) : tracks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            אין שירים. העלה את הראשון!
          </p>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  track.is_active
                    ? "border-game-gold bg-game-gold/10"
                    : "border-border bg-card"
                }`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePreview(track)}
                >
                  {previewId === track.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name}</p>
                  {track.is_active && (
                    <p className="text-xs text-game-dark-gold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> פעיל כעת
                    </p>
                  )}
                </div>
                {!track.is_active && (
                  <Button size="sm" variant="outline" onClick={() => setActive(track)}>
                    הפעל
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(track)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
