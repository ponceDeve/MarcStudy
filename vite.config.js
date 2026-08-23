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
            Location: "/MarcStudy/",
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
  base: "/MarcStudy/",

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

        navigateFallback: "/MarcStudy/index.html",

        navigateFallbackDenylist: [
          /^\/MarcStudy\/PDFs\//,
        ],
      },

      manifest: {
        name: "MarcStudy · Pomodoro",
        short_name: "MarcStudy",
        description:
          "Aplicación de estudio para preparar el examen de admisión de la UNMSM",

        theme_color: "#1a1815",
        background_color: "#1a1815",
        display: "standalone",

        start_url: "/MarcStudy/",
        scope: "/MarcStudy/",

        icons: [
          {
            src: "/MarcStudy/icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/MarcStudy/icon.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/MarcStudy/icon.png",
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