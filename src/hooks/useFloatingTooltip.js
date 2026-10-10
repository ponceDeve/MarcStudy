import { useCallback, useState } from "react";

const MARGEN = 12;
const DISTANCIA = 12;
const RADIO_FLECHA = 14;
const MAX_LINEAS = 3;
const ANCHO_NORMAL = 320;

/* La nube se centra en la PANTALLA (no en la palabra). Solo la flecha
   apunta a la palabra. Se usa position: fixed, así que las coordenadas
   son las del viewport. */
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

    // 1) Ancho normal (CSS): la nube crece hasta ANCHO_NORMAL
    tooltip.style.width = "";
    tooltip.style.maxWidth = "";
    const estilo = getComputedStyle(tooltip);
    const lineHeight =
      parseFloat(estilo.lineHeight) ||
      parseFloat(estilo.fontSize) * 1.45;
    const relleno =
      parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom);

    // 2) Si el texto pasa de 3 líneas, usa todo el ancho de la pantalla
    //    para que baje a menos líneas, en vez de crecer hacia abajo.
    const lineasActuales = (tooltip.offsetHeight - relleno) / lineHeight;
    if (
      lineasActuales > MAX_LINEAS + 0.5 &&
      tooltip.offsetWidth < anchoMaximoPantalla
    ) {
      tooltip.style.maxWidth = `${anchoMaximoPantalla}px`;
      tooltip.style.width = `${anchoMaximoPantalla}px`;
    }

    const ancho = tooltip.offsetWidth;
    const alto = tooltip.offsetHeight;
    const tr = trigger.getBoundingClientRect();

    // Horizontal: centrada en la pantalla, sin salirse de los bordes
    const left = Math.max(MARGEN, (anchoVista - ancho) / 2);

    // La flecha apunta al centro de la palabra, limitada dentro de la nube
    const centroPalabra = tr.left + tr.width / 2;
    const arrow = Math.min(
      Math.max(centroPalabra - left, RADIO_FLECHA),
      ancho - RADIO_FLECHA
    );

    // Vertical: arriba de la palabra; si no cabe, debajo
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