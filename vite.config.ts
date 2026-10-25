import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: Number(env.PORTAL_DEV_PORT) || 8090,
      // The browser calls /api/... (and loads /files/... photos) on its own origin; Vite forwards them to Frappe.
      proxy: Object.fromEntries(
        ["/api", "/files"].map((path) => [path, { target: env.PORTAL_DEV_PROXY_TARGET || "https://diyaar-app.easytouch.cloud", changeOrigin: true }]),
      ),
    },
    plugins: [react()],
    define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "") },
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: ["konsta/react", "framer-motion"],
    },
    build: { target: "es2020" },
  };
});
