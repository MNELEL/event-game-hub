import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, ExternalLink, Megaphone } from "lucide-react";

export type Announcement = {
  id: string; title: string; phone: string | null; link: string | null;
  event_date: string | null; details: string | null; is_published: boolean; owner_id: string;
};

const schema = z.object({
  title: z.string().trim().min(2, "יש להזין שם משחק").max(120),
  phone: z.string().trim().max(30).regex(/^[0-9+\-\s]*$/, "מספר טלפון לא תקין"),
  link: z.string().trim().max(500).refine((v) => !v || /^https?:\/\//.test(v), "הקישור חייב להתחיל ב-https://"),
  details: z.string().trim().max(1000),
});

const empty = { title: "", phone: "", link: "", event_date: "", details: "" };

export function AnnouncementsEditor() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await (supabase as any).from("announcements").select("*").eq("owner_id", u.user?.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const p = schema.safeParse(form);
    if (!p.success) { toast.error(p.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("announcements").insert({
      title: p.data.title, phone: p.data.phone || null, link: p.data.link || null, details: p.data.details || null,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
    });
    setSaving(false);
    if (error) { toast.error("הפרסום נכשל: " + error.message); return; }
    toast.success("המודעה פורסמה");
    setForm(empty); load();
  };

  const toggle = async (a: Announcement) => {
    await (supabase as any).from("announcements").update({ is_published: !a.is_published }).eq("id", a.id); load();
  };
  const remove = async (a: Announcement) => {
    await (supabase as any).from("announcements").delete().eq("id", a.id); load();
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="rounded-lg border-4 border-double border-primary/40 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />פרסום משחק בלוח המודעות</h2>
          <a href="/events" target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center gap-1">ללוח המודעות <ExternalLink className="h-3 w-3" /></a>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label htmlFor="ann-title">שם המשחק</Label><Input id="ann-title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label htmlFor="ann-phone">מספר טלפון להצטרפות</Label><Input id="ann-phone" value={form.phone} maxLength={30} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label htmlFor="ann-link">קישור להצטרפות</Label><Input id="ann-link" dir="ltr" placeholder="https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
          <div><Label htmlFor="ann-date">מועד (לא חובה)</Label><Input id="ann-date" type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
          <div className="md:col-span-2"><Label htmlFor="ann-details">פרטים נוספים</Label><Textarea id="ann-details" rows={2} maxLength={1000} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></div>
        </div>
        <Button onClick={add} disabled={saving}>פרסם מודעה</Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">עדיין לא פרסמת מודעות.</p>}
        {items.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded border border-border bg-card p-3">
            <div className="flex-1">
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-muted-foreground">{[a.phone, a.link, a.event_date && new Date(a.event_date).toLocaleString("he-IL")].filter(Boolean).join(" · ")}</div>
            </div>
            <label className="flex items-center gap-2 text-xs">{a.is_published ? "מפורסם" : "מוסתר"}<Switch checked={a.is_published} onCheckedChange={() => toggle(a)} /></label>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(a)} aria-label="מחק"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
