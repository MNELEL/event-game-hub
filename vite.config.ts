import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // ✅ כל הנכסים האלו יישמרו ב-cache בהתקנה
      includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // ✅ שמור cache לכל הקבצים הסטטיים
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,woff2,woff,ttf}"],
        // ✅ runtime caching: Supabase עובד דרך רשת, עם fallback ל-cache
        runtimeCaching: [
          {
            // קריאות API ל-Supabase — NetworkFirst:
            // מנסה רשת תחילה (5 שניות), נכשל → משתמש ב-cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth|realtime|functions)\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // יום אחד
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // storage של Supabase (תמונות, קבצים) — CacheFirst
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // שבוע
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Google Fonts וכד' — CacheFirst
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      manifest: {
        name: "מגה מוח - משחק טריוויה",
        short_name: "מגה מוח",
        description: "משחק טריוויה אינטראקטיבי לאירועים",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        display: "standalone",
        dir: "rtl",
        lang: "he",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":    ["react", "react-dom", "react-router-dom"],
          "vendor-motion":   ["framer-motion"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-query":    ["@tanstack/react-query"],
        },
      },
    },
  },
}));
