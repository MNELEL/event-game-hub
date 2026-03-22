import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize theme before render to avoid flash
try {
  const saved = localStorage.getItem("megabrain_theme");
  const valid = ["parchment","dark","ocean","forest","sunset"];
  document.documentElement.setAttribute("data-theme", valid.includes(saved || "") ? saved! : "parchment");
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
