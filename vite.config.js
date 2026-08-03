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
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,json}"
        ],
      },

      manifest: {
        name: "Mi Estudio · Pomodoro",
        short_name: "Mi Estudio",

        description:
          "Aplicación optimizada con soporte completo sin conexión a internet",

        theme_color: "#1a1815",
        background_color: "#1a1815",

        display: "standalone",

        start_url: "/cont_crono/",
        scope: "/cont_crono/",

        icons: [
          {
            src: "/cont_crono/icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/cont_crono/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
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