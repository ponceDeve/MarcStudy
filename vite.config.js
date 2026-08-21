import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

function redirigirRaizABase() {
  return {
    name: "redirigir-raiz-a-base",

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/" || req.url === "") {
          res.writeHead(302, {
            Location: "/cont_crono/",
          });

          res.end();
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: "/cont_crono/",

  plugins: [
    redirigirRaizABase(),

    react(),

    VitePWA({
      injectRegister: "inline",
      registerType: "autoUpdate",

      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,json,mp3,ttf,woff,woff2}",
        ],

        navigateFallback: "/cont_crono/index.html",

        navigateFallbackDenylist: [
          /^\/cont_crono\/PDFs\//,
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
            src: "/cont_crono/icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/cont_crono/icon.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/cont_crono/icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],

  server: {
    port: 3000,
    open: true,
  },
});