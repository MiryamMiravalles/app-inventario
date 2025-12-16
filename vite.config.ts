import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      // --- CORRECCIÓN CLAVE: Proxy para Netlify Functions ---
      proxy: {
        "/api": {
          // El target es el servidor de funciones local (8888)
          target: "http://localhost:8888",
          changeOrigin: true,
          // Reescribe la ruta de /api/ a /.netlify/functions/
          rewrite: (path) => path.replace(/^\/api/, "/.netlify/functions"),
        },
      },
      // ------------------------------------------------------
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
