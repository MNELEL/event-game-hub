import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  disconnected: boolean;
  reconnecting: boolean;
  onReconnect: () => void | Promise<unknown>;
};

/**
 * Floating banner shown when the player loses connection to the game.
 * Auto-retry runs in the hook; this surface lets the player retry manually
 * or just see what's happening.
 */
export function ConnectionStatusBanner({ disconnected, reconnecting, onReconnect }: Props) {
  return (
    <AnimatePresence>
      {disconnected && (
        <motion.div
          key="conn-banner"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] px-3 pt-3"
          dir="rtl"
        >
          <div className="mx-auto max-w-md bg-game-wrong/95 text-white rounded-xl shadow-2xl border border-white/20 px-4 py-3 flex items-center gap-3">
            {reconnecting ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            ) : (
              <WifiOff className="w-5 h-5 shrink-0" />
            )}
            <div className="flex-1 text-sm font-bold">
              {reconnecting ? "מנסה להתחבר מחדש..." : "החיבור אבד — נשמרת במשחק"}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => onReconnect()}
              disabled={reconnecting}
            >
              נסה שוב
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
