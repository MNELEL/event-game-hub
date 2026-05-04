import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useBranding } from "@/hooks/useBranding";

type Props = {
  /** Changes on this key trigger a fresh intro. */
  triggerKey?: string | number;
  /** Duration the hero stays visible (ms). */
  duration?: number;
};

/**
 * Brief animated Hero overlay that plays at the start of each game segment.
 * Renders nothing if no hero/logo image is configured.
 */
export function HeroIntro({ triggerKey, duration = 1400 }: Props) {
  const { branding } = useBranding();
  const src = branding.heroImageUrl || branding.logoUrl;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!src) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [triggerKey, src, duration]);

  if (!src) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-40"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <img
            src={src}
            alt={branding.name}
            className="max-h-24 md:max-h-28 w-auto rounded-xl shadow-2xl border-2 border-game-border-gold/60 object-cover bg-background/40 backdrop-blur"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
