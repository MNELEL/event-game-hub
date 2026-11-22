import { useState, useEffect, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "online" | "offline" | "reconnected";

export function OfflineBanner() {
  const [status, setStatus] = useState<Status>(
    navigator.onLine ? "online" : "offline"
  );
  const wasOfflineRef = useRef(!navigator.onLine);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const goOffline = () => {
      wasOfflineRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setStatus("offline");
    };
    const goOnline = () => {
      if (!wasOfflineRef.current) {
        setStatus("online");
        return;
      }
      wasOfflineRef.current = false;
      setStatus("reconnected");
      reconnectTimerRef.current = window.setTimeout(() => {
        setStatus("online");
        reconnectTimerRef.current = null;
      }, 2200);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {status === "offline" && (
          <motion.div
            key="offline"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-3 px-4 text-center text-sm font-medium shadow-lg"
            dir="rtl"
          >
            <WifiOff className="w-4 h-4 shrink-0" />
            אין חיבור לאינטרנט — חלק מהתכונות לא יהיו זמינות
          </motion.div>
        )}
        {status === "reconnected" && (
          <motion.div
            key="reconnected"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-4 text-center text-sm font-medium shadow-lg"
            dir="rtl"
          >
            <Wifi className="w-4 h-4 shrink-0" />
            החיבור חזר — מסנכרן נתונים...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soft fade overlay on reconnect to avoid a jarring full-refresh feel */}
      <AnimatePresence>
        {status === "reconnected" && (
          <motion.div
            key="reconnect-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed inset-0 z-[9998] pointer-events-none bg-background/40 backdrop-blur-[1px]"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
