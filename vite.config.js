import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // INLINE: Inyecta el script de registro directamente en el index.html al compilar
      injectRegister: "inline",
      registerType: "autoUpdate",

      // CACHÉ: Guarda automáticamente todo el código, estilos, imágenes y JSON para uso offline
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
      },

      // MANIFEST: Configuración de la aplicación para el navegador y dispositivos móviles
      manifest: {
        name: "Mi Aplicación Web",
        short_name: "AppOffline",
        description:
          "Aplicación optimizada con soporte completo sin conexión a internet",
        theme_color: "#1a1a1a",
        background_color: "#1a1a1a",
        display: "standalone",
        start_url: "/cont_crono/",
        scope: "/cont_crono/",
        icons: [
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
