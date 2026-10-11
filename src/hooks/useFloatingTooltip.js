import { useCallback, useState } from "react";

const MARGEN = 12;
const DISTANCIA = 12;
const RADIO_FLECHA = 14;
const MAX_LINEAS = 3;
const ANCHO_NORMAL = 320;

/* La nube va SIEMPRE arriba de la palabra, centrada sobre ella.
   Si la palabra está cerca de un borde, la nube se corre hacia adentro
   para no salirse de la pantalla, y la flecha sigue apuntando a la palabra.
   Si el texto pasa de 3 líneas con el ancho normal, usa todo el ancho de
   la pantalla para que baje a 3 líneas o menos. */
export function useFloatingTooltip() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({
    left: 0,
    top: 0,
    arrow: 0,
    below: false,
    ready: false
  });

  const mostrarEn = useCallback(() => {
    setVisible(true);
    setPos((p) => ({ ...p, ready: false }));
  }, []);

  const ocultar = useCallback(() => {
    setVisible(false);
    setPos((p) => ({ ...p, ready: false }));
  }, []);

  const ajustarPosicion = useCallback((trigger, tooltip) => {
    if (!trigger || !tooltip) return;
    const anchoVista = document.documentElement.clientWidth;
    const altoVista = window.innerHeight;
    const anchoMaximoPantalla = anchoVista - MARGEN * 2;

    // 1) Ancho normal (CSS)
    tooltip.style.width = "";
    tooltip.style.maxWidth = "";
    const estilo = getComputedStyle(tooltip);
    const lineHeight =
      parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize) * 1.45;
    const relleno =
      parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom);

    // 2) Si pasa de 3 líneas, usar todo el ancho de la pantalla
    const lineas = (tooltip.offsetHeight - relleno) / lineHeight;
    if (
      lineas > MAX_LINEAS + 0.5 &&
      tooltip.offsetWidth < anchoMaximoPantalla
    ) {
      tooltip.style.maxWidth = `${anchoMaximoPantalla}px`;
      tooltip.style.width = `${anchoMaximoPantalla}px`;
    }

    const ancho = tooltip.offsetWidth;
    const alto = tooltip.offsetHeight;
    if (!ancho || !alto) {
      requestAnimationFrame(() => ajustarPosicion(trigger, tooltip));
      return;
    }

    const tr = trigger.getBoundingClientRect();
    const centroPalabra = tr.left + tr.width / 2;

    // Horizontal: centrada sobre la palabra, sin salir de la pantalla
    const minLeft = MARGEN;
    const maxLeft = Math.max(minLeft, anchoVista - ancho - MARGEN);
    const left = Math.min(Math.max(centroPalabra - ancho / 2, minLeft), maxLeft);

    // La flecha apunta al centro de la palabra
    const arrow = Math.min(
      Math.max(centroPalabra - left, RADIO_FLECHA),
      ancho - RADIO_FLECHA
    );

    // Vertical: siempre arriba de la palabra; debajo solo si no hay espacio
    let top = tr.top - alto - DISTANCIA;
    let below = false;
    if (top < MARGEN) {
      top = tr.bottom + DISTANCIA;
      below = true;
    }
    top = Math.max(MARGEN, Math.min(top, altoVista - alto - MARGEN));

    setPos({ left, top, arrow, below, ready: true });
  }, []);

  return { visible, pos, mostrarEn, ocultar, ajustarPosicion };
}