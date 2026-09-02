import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/_tutorial-spotlight.scss";

const MARGEN = 10;
const MAX_ESPERA_MS = 1200;

function medir(el) {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - MARGEN,
    left: r.left - MARGEN,
    width: r.width + MARGEN * 2,
    height: r.height + MARGEN * 2,
    bottom: r.bottom + MARGEN
  };
}

/**
 * Hace scroll hasta el elemento y espera (con rAF) a que su posición se
 * estabilice antes de avisar — así el spotlight nunca se dibuja a mitad
 * del scroll. Si no se estabiliza rápido, igual muestra algo tras un tope.
 */
function scrollYEsperar(el, cb) {
  const headerH =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--header-h"
      )
    ) || 64;
  const offsetDeseado = headerH + 20;

  const rectInicial = el.getBoundingClientRect();
  const scrollDestino = window.scrollY + rectInicial.top - offsetDeseado;

  window.scrollTo({
    top: Math.max(scrollDestino, 0),
    behavior: "smooth"
  });

  let ultimaPos = null;
  let quietoDesde = null;
  let cancelado = false;
  const inicio = performance.now();

  const paso = (t) => {
    if (cancelado) return;

    const actual = medir(el);
    const igual =
      ultimaPos &&
      Math.abs(actual.top - ultimaPos.top) < 0.5 &&
      Math.abs(actual.left - ultimaPos.left) < 0.5;

    if (igual) {
      if (quietoDesde === null) quietoDesde = t;
      // 2 frames seguidos igual = ya frenó el scroll
      if (t - quietoDesde > 32 || t - inicio > MAX_ESPERA_MS) {
        cb(actual);
        return;
      }
    } else {
      quietoDesde = null;
    }

    ultimaPos = actual;
    requestAnimationFrame(paso);
  };

  requestAnimationFrame(paso);

  return () => {
    cancelado = true;
  };
}

/**
 * TutorialSpotlight
 * ------------------
 * Recorre pasos que apuntan a elementos REALES de la interfaz (por selector CSS).
 * No usa modal: hace scroll hasta el elemento, lo recorta en un overlay
 * semitransparente y muestra un tooltip corto explicando qué es.
 *
 * steps: [{ selector, titulo, texto }]
 * startAt: índice del paso por el que arrancar (para "ir directo a lo que busco")
 */
export default function TutorialSpotlight({ steps, open, onClose, startAt = 0 }) {
  const [paso, setPaso] = useState(startAt);
  const [rect, setRect] = useState(null);
  const [listo, setListo] = useState(false);
  const cancelarRef = useRef(null);

  const pasoActual = steps[paso];
  const esUltimo = paso === steps.length - 1;

  // Reinicia al abrir, en el paso solicitado
  useEffect(() => {
    if (open) {
      setPaso(startAt);
      setListo(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startAt]);

  useEffect(() => {
    if (!open || !pasoActual) return;

    setListo(false);
    if (cancelarRef.current) cancelarRef.current();

    const el = document.querySelector(pasoActual.selector);
    if (!el) {
      // si el elemento no existe en esta vista, saltar al siguiente paso
      if (!esUltimo) {
        setPaso((p) => p + 1);
      } else {
        onClose();
      }
      return;
    }

    cancelarRef.current = scrollYEsperar(el, (medida) => {
      setRect(medida);
      setListo(true);
    });

    const onResizeScroll = () => {
      const elVivo = document.querySelector(pasoActual.selector);
      if (elVivo) setRect(medir(elVivo));
    };
    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, true);

    return () => {
      if (cancelarRef.current) cancelarRef.current();
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
    };
  }, [open, paso]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;

    const preventDefault = (e) => e.preventDefault();

    const bloquearTecla = (e) => {
      const teclasScroll = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " "
      ];
      if (teclasScroll.includes(e.key)) e.preventDefault();
    };

    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, {
      passive: false
    });
    window.addEventListener("keydown", bloquearTecla);

    return () => {
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("keydown", bloquearTecla);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !pasoActual) return null;

  const siguiente = () => {
    if (esUltimo) {
      onClose();
    } else {
      setPaso((p) => p + 1);
    }
  };

  const anterior = () => {
    if (paso > 0) setPaso((p) => p - 1);
  };

  return createPortal(
    <div className="tut-spotlight" aria-live="polite">
      {/* Overlay solo visual: no cierra el tutorial al tocarlo */}
      <div
        className="tut-spotlight__backdrop"
        style={
          rect
            ? {
                "--sx": `${rect.left}px`,
                "--sy": `${rect.top}px`,
                "--sw": `${rect.width}px`,
                "--sh": `${rect.height}px`
              }
            : undefined
        }
      />

      {rect && listo && (
        <div
          className="tut-spotlight__ring"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }}
        />
      )}

      {rect && listo && (
        <div
          className="tut-spotlight__tooltip tut-spotlight__tooltip--abajo"
          style={{
            top: Math.min(
              rect.bottom + 12,
              Math.max(window.innerHeight - 260 - 12, 12)
            ),
            left: Math.min(Math.max(rect.left, 12), window.innerWidth - 300)
          }}
        >
          <div className="tut-spotlight__tooltip-head">
            <span className="tut-spotlight__step-count">
              {paso + 1}/{steps.length}
            </span>
            <button type="button" className="tut-spotlight__skip" onClick={onClose}>
              Cerrar
            </button>
          </div>

          <h4 className="tut-spotlight__title">{pasoActual.titulo}</h4>
          <p className="tut-spotlight__text">{pasoActual.texto}</p>

          <div className="tut-spotlight__actions">
            {paso > 0 && (
              <button
                type="button"
                className="tut-spotlight__btn tut-spotlight__btn--prev"
                onClick={anterior}
              >
                Atrás
              </button>
            )}
            <button
              type="button"
              className="tut-spotlight__btn tut-spotlight__btn--next"
              onClick={siguiente}
            >
              {esUltimo ? "Listo" : "Siguiente"}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}