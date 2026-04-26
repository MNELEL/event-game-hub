import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🧠</div>
        <h1 className="text-3xl font-bold text-foreground">התקן את החגיגה של חיוש</h1>
        <p className="text-muted-foreground">
          התקן את האפליקציה על המכשיר שלך לגישה מהירה וחוויה מלאה — בלי חנות אפליקציות!
        </p>

        {installed ? (
          <div className="flex items-center justify-center gap-2 text-green-500 text-lg font-semibold">
            <Check className="w-6 h-6" />
            האפליקציה הותקנה בהצלחה!
          </div>
        ) : deferredPrompt ? (
          <Button size="lg" onClick={handleInstall} className="gap-2 text-lg px-8">
            <Download className="w-5 h-5" />
            התקן עכשיו
          </Button>
        ) : (
          <div className="space-y-4 text-muted-foreground text-sm">
            <Smartphone className="w-10 h-10 mx-auto opacity-50" />
            <p>
              <strong>באייפון:</strong> לחץ על כפתור השיתוף (⬆️) ובחר "הוסף למסך הבית"
            </p>
            <p>
              <strong>באנדרואיד:</strong> לחץ על תפריט הדפדפן (⋮) ובחר "התקן אפליקציה" או "הוסף למסך הבית"
            </p>
          </div>
        )}

        <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
          חזרה לדף הבית
        </Button>
      </div>
    </div>
  );
}
