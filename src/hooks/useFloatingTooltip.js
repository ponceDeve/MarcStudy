import { useCallback, useState } from "react";

/* Calcula un desplazamiento horizontal en px (no solo "izquierda / centro /
   derecha") para que el tooltip quede siempre dentro del viewport, sin
   importar cuán angosta sea la pantalla ni dónde esté el término dentro
   de la línea de texto. Alinear un solo borde (como se hacía antes) podía
   sacar el borde opuesto de la pantalla cuando el tooltip era casi tan
   ancho como el viewport. */
export function useFloatingTooltip() {
  const [visible, setVisible] = useState(false);
  const [shift, setShift] = useState(0);

  const mostrarEn = useCallback(() => {
    setVisible(true);
  }, []);

  const ocultar = useCallback(() => {
    setVisible(false);
    setShift(0);
  }, []);

  const ajustarPosicion = useCallback((trigger, tooltip) => {
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margen = 12;

    const centro = triggerRect.left + triggerRect.width / 2;
    const mitadTooltip = tooltipRect.width / 2;

    // Posición ideal (centrada en el término) del borde izquierdo del tooltip
    const idealLeft = centro - mitadTooltip;

    const minLeft = margen;
    const maxLeft = Math.max(minLeft, window.innerWidth - margen - tooltipRect.width);

    const clampedLeft = Math.min(Math.max(idealLeft, minLeft), maxLeft);

    setShift(clampedLeft - idealLeft);
  }, []);

  return {
    visible,
    shift,
    mostrarEn,
    ocultar,
    ajustarPosicion
  };
}
