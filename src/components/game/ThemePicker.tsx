import { motion } from "framer-motion";
import { useTheme, THEMES } from "@/hooks/useTheme";
import { Check } from "lucide-react";

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <h4 className="font-serif text-game-dark-gold text-sm font-bold text-center">🎨 ערכת נושא</h4>
      <div className="grid grid-cols-5 gap-2">
        {THEMES.map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setTheme(t.id)}
            className="relative flex flex-col items-center gap-1 group"
            title={t.name}
          >
            {/* Color swatch */}
            <div
              className="w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center text-lg shadow-sm"
              style={{
                backgroundColor: t.preview.bg,
                borderColor: theme === t.id ? t.preview.accent : "transparent",
                boxShadow: theme === t.id ? `0 0 0 2px ${t.preview.accent}` : undefined,
              }}
            >
              {t.emoji}
              {theme === t.id && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.preview.accent }}
                >
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <span className="text-xs text-game-dark-gold/70 font-medium leading-tight text-center" style={{ fontSize: "0.6rem" }}>
              {t.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
