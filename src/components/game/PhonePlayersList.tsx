import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CheckCircle2, Clock } from "lucide-react";
import { PhonePlayerRow } from "@/hooks/usePhonePlayers";
import { getCallerSyncState } from "./IvrSyncIndicator";

type Props = {
  phonePlayers: PhonePlayerRow[];
  gameStatus: string;
  currentQuestionIndex?: number;
};

const dotColor = (s: "synced" | "lagging" | "offline") =>
  s === "synced"
    ? "bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.55)]"
    : s === "lagging"
    ? "bg-amber-500"
    : "bg-rose-500";

export function PhonePlayersList({ phonePlayers, gameStatus, currentQuestionIndex = 0 }: Props) {
  const inLobby = phonePlayers.filter(p => p.joined_in_lobby);
  const late = phonePlayers.filter(p => !p.joined_in_lobby);
  const isLobby = gameStatus === "lobby";

  // Live tick so per-caller dots reflect freshness without waiting for a DB event.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="parchment-card rounded-xl p-5 mb-6 text-right" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="w-5 h-5 text-game-gold" />
        <h3 className="font-serif text-lg text-game-dark-gold">מתקשרים בטלפון</h3>
        <span className="mr-auto text-sm text-game-dark-gold/60">
          {inLobby.length} רשומים{late.length > 0 ? ` · ${late.length} בהמתנה` : ""}
        </span>
      </div>

      {phonePlayers.length === 0 ? (
        <p className="text-game-dark-gold/50 text-sm">
          {isLobby ? "אין עדיין מתקשרים. חייגו למספר המוצג למעלה." : "לא נרשמו מתקשרים בטלפון."}
        </p>
      ) : (
        <div className="space-y-3">
          {inLobby.length > 0 && (
            <div>
              <p className="text-xs text-game-dark-gold/60 mb-2">
                ✓ נרשמו בלובי — יוכלו לענות
              </p>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {inLobby.map(p => {
                    const sync = getCallerSyncState(p, currentQuestionIndex, now);
                    const label =
                      sync === "synced"
                        ? "IVR מסונכרן עכשיו"
                        : sync === "lagging"
                        ? "IVR מתעדכן…"
                        : "IVR לא מגיב";
                    return (
                      <motion.span
                        key={p.phone}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="flex items-center gap-1.5 bg-game-gold/20 text-game-dark-gold px-3 py-1 rounded-full text-sm border border-game-border-gold/40 direction-ltr"
                        title={label}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${dotColor(sync)}`}
                          aria-label={label}
                        />
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-mono">…{p.phone.slice(-4)}</span>
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {late.length > 0 && (
            <div>
              <p className="text-xs text-amber-700/80 mb-2">
                ⏳ הצטרפו לאחר תחילת המשחק — ימתינו למשחק הבא
              </p>
              <div className="flex flex-wrap gap-2">
                {late.map(p => (
                  <span
                    key={p.phone}
                    className="flex items-center gap-1 bg-amber-100/60 text-amber-900 px-3 py-1 rounded-full text-sm border border-amber-300/60 direction-ltr"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono">…{p.phone.slice(-4)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
