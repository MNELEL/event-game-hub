import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink, CalendarDays, Megaphone, Home } from "lucide-react";
import type { Announcement } from "@/components/admin/AnnouncementsEditor";

const Events = () => {
  const [items, setItems] = useState<Announcement[] | null>(null);
  useEffect(() => {
    (supabase as any).from("announcements").select("id,title,phone,link,event_date,details,is_published,owner_id")
      .eq("is_published", true).order("created_at", { ascending: false }).limit(100)
      .then(({ data }: any) => setItems(data ?? []));
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl flex items-center gap-2"><Megaphone className="h-7 w-7 text-primary" />לוח משחקים פתוחים</h1>
          <Link to="/" aria-label="חזרה לדף הבית"><Home className="h-5 w-5 text-muted-foreground" /></Link>
        </div>
        <p className="text-muted-foreground">משחקי טריוויה שמנחים פרסמו. בחרו משחק, התקשרו או לחצו על הקישור כדי להצטרף.</p>
        {items === null && <p className="text-muted-foreground">טוען...</p>}
        {items?.length === 0 && <p className="text-muted-foreground">אין כרגע משחקים מפורסמים.</p>}
        {items?.map((a) => (
          <article key={a.id} className="rounded-lg border-4 border-double border-primary/40 bg-card p-5 space-y-2">
            <h2 className="font-display text-xl">{a.title}</h2>
            {a.event_date && <p className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays className="h-4 w-4" />{new Date(a.event_date).toLocaleString("he-IL", { dateStyle: "full", timeStyle: "short" })}</p>}
            {a.details && <p className="text-sm whitespace-pre-line">{a.details}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {a.phone && <Button asChild variant="outline" size="sm"><a href={`tel:${a.phone.replace(/[^0-9+]/g, "")}`}><Phone className="h-4 w-4" />{a.phone}</a></Button>}
              {a.link && /^https?:\/\//.test(a.link) && <Button asChild size="sm"><a href={a.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />הצטרפות למשחק</a></Button>}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};
export default Events;
