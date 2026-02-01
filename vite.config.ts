import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Détecte si on est sur Replit
const isReplit = process.env.REPL_ID !== undefined;

// Plugins Replit uniquement en dev
let replitPlugins = [];
if (isReplit) {
  // Utilisation require pour Node/Vercel
  const runtimeOverlay = require("@replit/vite-plugin-runtime-error-modal").runtimeErrorOverlay;
  replitPlugins.push(runtimeOverlay());
}

// Configuration Vite
export default defineConfig({
  plugins: [
    react(),
    ...replitPlugins,
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
    outDir: "dist", // Vercel détecte automatiquement
    emptyOutDir: true,
    rollupOptions: {
      input: isReplit ? path.resolve(__dirname, "client/index.html") : path.resolve(__dirname, "index.html"),
    },
  },
  base: "./", // CRUCIAL pour Vercel
});
