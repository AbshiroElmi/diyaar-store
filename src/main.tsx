import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initNativeShell } from "./lib/native";

initNativeShell();

// Remember a `?theme=ios|material` preview choice across the login redirect.
const previewTheme = new URLSearchParams(window.location.search).get("theme");
if (previewTheme) {
  try {
    sessionStorage.setItem("portal_theme", previewTheme);
  } catch {
    /* storage unavailable */
  }
}

createRoot(document.getElementById("root")!).render(<App />);
