import { useEffect } from "react";

/**
 * Hook para ocultar/mostrar header al hacer scroll
 * Agrega/quita la clase "is-header-oculto" al body
 * 
 * @param {Object} options - Configuración
 * @param {number} options.umbralScroll - Píxeles mínimos de scroll para activar (default: 8)
 * @param {number} options.zonaSeguTope - Píxeles desde el tope donde NO se oculta (default: 80)
 * @param {boolean} options.disabled - Si está true, desactiva el efecto (default: false)
 * @param {Array} options.dependencias - Dependencias adicionales del useEffect (default: [])
 */
export function useScrollHideShow({
  umbralScroll = 8,
  zonaSeguraTope = 80,
  disabled = false,
  dependencias = []
} = {}) {
  useEffect(() => {
    if (disabled) {
      document.body.classList.remove("is-header-oculto");
      return;
    }

    let ultimoY = window.scrollY;
    let ticking = false;

    function actualizar() {
      const y = window.scrollY;
      const delta = y - ultimoY;

      if (y < zonaSeguraTope) {
        document.body.classList.remove("is-header-oculto");
      } else if (delta > umbralScroll) {
        // Scroll hacia abajo
        document.body.classList.add("is-header-oculto");
      } else if (delta < -umbralScroll) {
        // Scroll hacia arriba
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
  }, [umbralScroll, zonaSeguraTope, disabled, ...dependencias]);
}
