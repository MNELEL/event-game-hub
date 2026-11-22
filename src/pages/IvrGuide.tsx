import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
// Vite's ?raw import gives us the markdown source as a string.
import guideMd from "../../docs/IVR_HEBREW_GUIDE.md?raw";

/**
 * Hebrew IVR guide. We render the raw markdown inside a styled <pre> so that
 * formatting + code blocks come through cleanly without a markdown library.
 * The doc is the source of truth — keep `docs/IVR_HEBREW_GUIDE.md` updated.
 */
export default function IvrGuide() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
          <div className="flex items-center gap-2 text-game-dark-gold">
            <BookOpen className="w-5 h-5" />
            <h1 className="font-serif text-xl">מדריך IVR בעברית</h1>
          </div>
        </div>

        <article className="parchment-card rounded-lg p-5 sm:p-7">
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-game-dark-gold/90 [direction:rtl]">
            {guideMd}
          </pre>
        </article>
      </div>
    </div>
  );
}
