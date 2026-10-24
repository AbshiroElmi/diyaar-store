import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: Number(env.PORTAL_DEV_PORT) || 8090,
      // In live mode the browser calls /api/... and Vite forwards it to Frappe.
      proxy: env.PORTAL_DEV_PROXY_TARGET
        ? { "/api": { target: env.PORTAL_DEV_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
    plugins: [react()],
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
