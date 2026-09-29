// Service worker mínimo: NO guarda nada en caché y NO funciona offline.
// Solo existe para que la web se pueda instalar como aplicación.
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Borra SOLO los cachés viejos de la PWA (workbox/precache).
      // No toca otros cachés, como el del modelo de búsqueda semántica.
      const claves = await caches.keys();
      await Promise.all(
        claves
          .filter((k) => /workbox|precache/i.test(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
      // Recarga las pestañas abiertas una sola vez para traer la versión nueva
      const ventanas = await self.clients.matchAll({ type: "window" });
      ventanas.forEach((v) => v.navigate(v.url));
    })()
  );
});
// Todo va directo a internet, sin caché
self.addEventListener("fetch", () => {});