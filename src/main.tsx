import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// In Lovable preview iframes, unregister any leftover SW so the editor preview
// isn't trapped on a stale build. PWA installation is unaffected on real users.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com");
  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  }
}

createRoot(document.getElementById("root")!).render(<App />);
