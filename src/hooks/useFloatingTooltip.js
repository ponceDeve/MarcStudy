import { useCallback, useLayoutEffect, useState } from "react";

export function useFloatingTooltip() {
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState("center");

  const mostrarEn = useCallback(() => {
    setVisible(true);
  }, []);

  const ocultar = useCallback(() => {
    setVisible(false);
    setPlacement("center");
  }, []);

  const ajustarPosicion = useCallback((trigger, tooltip) => {
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margen = 14;

    const centro = triggerRect.left + triggerRect.width / 2;
    const mitadTooltip = tooltipRect.width / 2;

    const izquierda = centro - mitadTooltip;
    const derecha = centro + mitadTooltip;

    if (izquierda < margen) {
      setPlacement("left");
    } else if (derecha > window.innerWidth - margen) {
      setPlacement("right");
    } else {
      setPlacement("center");
    }
  }, []);

  return {
    visible,
    placement,
    mostrarEn,
    ocultar,
    ajustarPosicion
  };
}