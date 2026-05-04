import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radio, RadioTower, AlertTriangle } from "lucide-react";
import { PhonePlayerRow } from "@/hooks/usePhonePlayers";

type Props = {
  phonePlayers: PhonePlayerRow[];
  currentQuestionIndex: number;
};

const FRESH_MS = 6000; // last poll within 6s = synced
const STALE_MS = 15000; // older than 15s = offline

type SyncState = "synced" | "lagging" | "offline";

export function getCallerSyncState(
  row: PhonePlayerRow,
  currentQuestionIndex: number,
  now: number,
): SyncState {
  if (!row.last_poll_at) return "offline";
  const age = now - new Date(row.last_poll_at).getTime();
  if (age > STALE_MS) return "offline";
  const idxMatch =
    row.last_seen_question_index === null ||
    row.last_seen_question_index === currentQuestionIndex;
  if (age <= FRESH_MS && idxMatch) return "synced";
  return "lagging";
}

export function IvrSyncIndicator({ phonePlayers, currentQuestionIndex }: Props) {
  // Re-render every second so freshness decays without waiting on DB events.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const eligible = phonePlayers.filter(p => p.joined_in_lobby);
  if (eligible.length === 0) return null;

  let synced = 0;
  let lagging = 0;
  let offline = 0;
  for (const p of eligible) {
    const s = getCallerSyncState(p, currentQuestionIndex, now);
    if (s === "synced") synced++;
    else if (s === "lagging") lagging++;
    else offline++;
  }

  const allSynced = synced === eligible.length;
  const Icon = allSynced ? RadioTower : lagging > 0 ? Radio : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-game-border-gold/40 bg-game-cream/70 text-sm font-serif text-game-dark-gold"
      dir="rtl"
      title="סנכרון מערכת IVR מול שאלה נוכחית"
    >
      <motion.span
        animate={allSynced ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: allSynced ? Infinity : 0 }}
        className={
          allSynced
            ? "text-emerald-700"
            : lagging > 0
            ? "text-amber-600"
            : "text-rose-700"
        }
      >
        <Icon className="w-4 h-4" />
      </motion.span>
      <span className="text-xs">
        IVR:&nbsp;
        <span className="text-emerald-800 font-bold">{synced}</span>
        {lagging > 0 && (
          <>
            {" · "}
            <span className="text-amber-700 font-bold">{lagging} מתעדכן</span>
          </>
        )}
        {offline > 0 && (
          <>
            {" · "}
            <span className="text-rose-700 font-bold">{offline} נותק</span>
          </>
        )}
      </span>
    </motion.div>
  );
}
