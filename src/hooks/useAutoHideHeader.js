import { useEffect } from "react";

/**
 * Auto-oculta el header al bajar / lo muestra al subir, agregando o
 * quitando la clase "is-header-oculto" en <body> (el CSS de
 * .topbar-wrapper ya sabe reaccionar a esa clase; la barra de
 * búsqueda/voz de teoría vuelve sola a su posición normal debajo del
 * header apenas esta clase se quita). Se usa tanto en TopBar.jsx (Mi
 * Estudio) como en AppHeader.jsx (Horario, Repaso, Pomodoro, etc.)
 * para que el efecto sea el mismo en toda la app.
 *
 * @param {boolean} bloqueado - si es true (por ejemplo con un menú o
 *   drawer abierto), no se oculta el header aunque se baje.
 */
export function useAutoHideHeader(bloqueado = false) {
  useEffect(() => {
    const UMBRAL_SCROLL = 8;
    const ZONA_SEGURA_TOPE = 80;
    let ultimoY = window.scrollY;
    let ticking = false;

    function actualizar() {
      const y = window.scrollY;
      const delta = y - ultimoY;

      if (bloqueado) {
        document.body.classList.remove("is-header-oculto");
      } else if (y < ZONA_SEGURA_TOPE) {
        document.body.classList.remove("is-header-oculto");
      } else if (delta > UMBRAL_SCROLL) {
        document.body.classList.add("is-header-oculto");
      } else if (delta < -UMBRAL_SCROLL) {
        // Cualquier scroll hacia arriba devuelve el header y, con él,
        // el buscador/bocina a su posición normal debajo (no solo
        // cerca del tope).
        document.body.classList.remove("is-header-oculto");
      }

      ultimoY = y;
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(actualizar);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("is-header-oculto");
    };
  }, [bloqueado]);
}