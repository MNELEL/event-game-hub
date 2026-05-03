import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import branding from "./branding.config.json";

/**
 * Replaces %BRANDING_*% tokens in index.html at build/serve time so that the
 * <title>, meta tags, theme-color and PWA app title all come from
 * branding.config.json. Single source of truth = branding.config.json.
 */
function brandingHtmlPlugin(): Plugin {
  const map: Record<string, string> = {
    "%BRANDING_NAME%": branding.name,
    "%BRANDING_SHORT_NAME%": branding.shortName,
    "%BRANDING_FULL_NAME%": branding.fullName,
    "%BRANDING_DESCRIPTION%": branding.description,
    "%BRANDING_AUTHOR%": branding.authorName,
    "%BRANDING_THEME_COLOR%": branding.themeColor,
    "%BRANDING_BACKGROUND_COLOR%": branding.backgroundColor,
    "%BRANDING_ICON_PRIMARY%": branding.icons.primary,
    "%BRANDING_ICON_FESTIVE%": branding.icons.festive,
  };
  return {
    name: "branding-html-inject",
    transformIndexHtml(html) {
      let out = html;
      for (const [token, value] of Object.entries(map)) {
        out = out.split(token).join(value);
      }
      return out;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    brandingHtmlPlugin(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,woff2}"],
      },
      manifest: {
        name: `${branding.name} - משחק טריוויה`,
        short_name: branding.shortName,
        description: branding.description,
        theme_color: branding.themeColor,
        background_color: branding.backgroundColor,
        display: "standalone",
        dir: "rtl",
        lang: "he",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
