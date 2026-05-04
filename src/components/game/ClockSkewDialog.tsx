import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";

export type ClockSkewSeverity = "warning" | "critical";

interface ClockSkewInfo {
  severity: ClockSkewSeverity;
  driftSeconds: number;
  serverMessage?: string;
}

interface ClockSkewDialogProps {
  open: boolean;
  info: ClockSkewInfo | null;
  onCancel: () => void;
  onContinue?: () => void;
}

const formatDrift = (s: number) => {
  const abs = Math.abs(s);
  if (abs < 60) return `${abs.toFixed(1)} שניות`;
  const m = Math.floor(abs / 60);
  const sec = Math.round(abs % 60);
  return `${m} דקות ו-${sec} שניות`;
};

export const ClockSkewDialog = ({ open, info, onCancel, onContinue }: ClockSkewDialogProps) => {
  if (!info) return null;
  const isCritical = info.severity === "critical";
  const direction = info.driftSeconds > 0 ? "מקדים" : "מפגר";

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        dir="rtl"
        className="border-2 border-game-gold/60 bg-game-parchment/95 shadow-2xl"
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                isCritical ? "bg-destructive/15 text-destructive" : "bg-yellow-500/15 text-yellow-700"
              }`}
            >
              {isCritical ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <AlertDialogTitle className="text-right text-xl font-serif text-game-dark-gold">
              {isCritical
                ? "המשחק לא הופעל – פער שעון חריג"
                : "פער שעון בין המחשב לשרת"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-right text-base leading-relaxed text-game-dark-gold/90">
            <p className="mb-3">
              שעון המחשב שלך {direction} את שעון השרת בכ-
              <strong className="mx-1">{formatDrift(info.driftSeconds)}</strong>.
              {isCritical
                ? " פער כזה יגרום לכך שמתקשרים בטלפון לא יראו את אותה שאלה באותו זמן כמו השחקנים במסך, ולכן המשחק לא יופעל."
                : " הפער עדיין בטווח שניתן לעבוד איתו, אבל מומלץ לתקן לפני שמתחילים."}
            </p>

            <div className="rounded-md border border-game-gold/40 bg-white/60 p-3">
              <p className="mb-2 font-bold">איך לפתור תוך דקה:</p>
              <ol className="list-decimal pr-5 space-y-1 text-sm">
                <li>פתחו את הגדרות התאריך והשעה במחשב.</li>
                <li>הפעילו <strong>"כיוון שעה אוטומטי"</strong> ו-<strong>"אזור זמן אוטומטי"</strong>.</li>
                <li>לחצו על <strong>"סנכרן עכשיו"</strong> (Sync now).</li>
                <li>רעננו את הדף (F5) ונסו להפעיל את המשחק שוב.</li>
              </ol>
            </div>

            {info.serverMessage && (
              <p className="mt-3 text-xs text-game-dark-gold/60">
                פרטי שרת: {info.serverMessage}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel} className="border-game-gold/60">
            <RefreshCw className="ml-2 h-4 w-4" />
            סגור ותקן את השעון
          </AlertDialogCancel>
          {!isCritical && onContinue && (
            <AlertDialogAction
              onClick={onContinue}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              הבנתי – המשך בכל זאת
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
