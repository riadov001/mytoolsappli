import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Détecte si on est sur Replit
const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig({
  plugins: [
    react(),
    // Plugins Replit uniquement en dev sur Replit
    ...(isReplit
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).runtimeErrorOverlay(),
          (await import("@replit/vite-plugin-cartographer")).then((m) => m.cartographer()),
          (await import("@replit/vite-plugin-dev-banner")).then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: isReplit ? path.resolve(__dirname, "client") : __dirname,
  build: {
    outDir: "dist", // Vercel build standard
    emptyOutDir: true,
    rollupOptions: {
      input: isReplit ? path.resolve(__dirname, "client/index.html") : path.resolve(__dirname, "index.html"),
    },
  },
  base: "./", // CRUCIAL pour Vercel
});
