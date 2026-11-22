import { Clock } from "lucide-react";

type Props = {
  startAt: string | null;
  now: number;
};

const ilFormatter = new Intl.DateTimeFormat("he-IL", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Jerusalem",
});

function formatUtc(d: Date) {
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

export function StartAtDebugPanel({ startAt, now }: Props) {
  const startMs = startAt ? new Date(startAt).getTime() : null;
  const diffSec = startMs !== null ? Math.round((startMs - now) / 1000) : null;
  const status =
    diffSec === null
      ? "טרם נקבע (start_at = null)"
      : diffSec > 0
      ? `יתחיל בעוד ${diffSec} שניות`
      : `התחיל לפני ${Math.abs(diffSec)} שניות`;
  const tone =
    diffSec === null
      ? "text-game-dark-gold/70"
      : diffSec > 0
      ? "text-emerald-700"
      : "text-red-700";

  return (
    <div
      className="parchment-card parchment-border-double rounded-xl px-4 py-3 mx-auto mb-4 max-w-3xl text-sm font-mono"
      dir="ltr"
    >
      <div className="flex items-center gap-2 mb-2 font-sans" dir="rtl">
        <Clock className="w-4 h-4 text-game-dark-gold" />
        <span className="font-bold text-game-dark-gold">בדיקת זמן התחלה (start_at)</span>
        <span className={`mr-auto font-sans ${tone}`}>{status}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-game-dark-gold/60 mb-0.5">UTC (DB)</div>
          <div className="text-game-dark-gold font-bold break-all">
            {startAt ? formatUtc(new Date(startAt)) : "—"}
          </div>
        </div>
        <div>
          <div className="text-game-dark-gold/60 mb-0.5">Asia/Jerusalem (מקומי)</div>
          <div className="text-game-dark-gold font-bold break-all">
            {startAt ? ilFormatter.format(new Date(startAt)) : "—"}
          </div>
        </div>
        <div>
          <div className="text-game-dark-gold/60 mb-0.5">ISO גולמי</div>
          <div className="text-game-dark-gold/80 break-all">{startAt ?? "—"}</div>
        </div>
        <div>
          <div className="text-game-dark-gold/60 mb-0.5">עכשיו (UTC / מקומי)</div>
          <div className="text-game-dark-gold/80 break-all">
            {formatUtc(new Date(now))}
            <br />
            {ilFormatter.format(new Date(now))}
          </div>
        </div>
      </div>
    </div>
  );
}
