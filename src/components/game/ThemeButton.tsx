import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paintbrush } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { ThemeStudio } from "./ThemeStudio";

export function ThemeButton() {
  const [open, setOpen] = useState(false);
  const { currentTheme } = useTheme();

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="סטודיו עיצוב"
      >
        <span className="text-base leading-none">{currentTheme?.emoji ?? "🎨"}</span>
        <Paintbrush className="w-3.5 h-3.5 text-muted-foreground" />
        <AnimatePresence>
          <motion.span
            key={currentTheme?.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-medium text-foreground hidden sm:block"
          >
            {currentTheme?.name ?? "ערכת נושא"}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <ThemeStudio open={open} onClose={() => setOpen(false)} />
    </>
  );
}
