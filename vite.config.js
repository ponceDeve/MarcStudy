import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: "inline",
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
      },
      manifest: {
        name: "Mi Estudio · Pomodoro",
        short_name: "Mi Estudio",
        description: "Aplicación optimizada con soporte completo sin conexión a internet",
        theme_color: "#1a1815",
        background_color: "#1a1815",
        display: "standalone",
        start_url: "/cont_crono/",
        scope: "/cont_crono/",
        icons: [
          {
            src: "/cont_crono/icon.png", // ← aquí va tu icon.png
            sizes: "512x512",            // ajusta al tamaño real de tu icono
            type: "image/png",
          },
        ],
      },
    }),
  ],
  base: "/cont_crono/",
  server: {
    port: 3000,
    open: true,
  },
});
