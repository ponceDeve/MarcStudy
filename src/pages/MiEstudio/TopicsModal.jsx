import React, { useEffect, useRef, useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

export default function TopicsModal({
  open,
  onClose,
  curso,
  temaActual,
  listaTemas = [],
  onSelectTema
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hasHover, setHasHover] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [inputEnfocado, setInputEnfocado] = useState(false);
  const puntoInicioToque = useRef(null);

  // Si el dedo se movió más de esto entre el toque inicial y el click,
  // fue un scroll, no una selección real: se ignora el click.
  const UMBRAL_ARRASTRE = 10;

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setHasHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setBusqueda("");
      setActiveIndex(null);
      setHoveredIndex(null);
      setInputEnfocado(false);
    }
  }, [open]);

  if (!open) return null;

  function manejarClickTema(item, index) {
    if (activeIndex === index) {
      onSelectTema(item);
      onClose();
      setActiveIndex(null);
      return;
    }

    setActiveIndex(index);
  }

  function manejarHover(item, index) {
    setHoveredIndex(index);
  }

  function manejarSalidaHover() {
    setHoveredIndex(null);
  }

  function manejarScroll() {
    setActiveIndex(null);
    setHoveredIndex(null);
  }

  function manejarToqueInicial(item, e) {
    puntoInicioToque.current = { x: e.clientX, y: e.clientY };
  }

  // Compara dónde empezó el toque (pointerdown) contra dónde terminó
  // (click) para distinguir un tap real de un scroll/arrastre.
  function fueArrastre(e) {
    const inicio = puntoInicioToque.current;
    if (!inicio) return false;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    return Math.sqrt(dx * dx + dy * dy) > UMBRAL_ARRASTRE;
  }

  const temasConIndice = listaTemas.map((item, index) => ({ item, index }));
  const temasFiltrados = busqueda.trim()
    ? buscarConPuntaje(temasConIndice, busqueda, ({ item }) => item.tema)
    : temasConIndice;

  // El título solo cambia con clic/toque (activeIndex), nunca con el
  // simple hover — cambiar el header al pasar el mouse resultaba molesto.
  const temaEnTitulo = activeIndex !== null ? listaTemas[activeIndex]?.tema : null;

  return (
    <div
      className="levels-modal"
      style={{ zIndex: 1000 }}
      onClick={() => setActiveIndex(null)}
      onScroll={manejarScroll}
    >
      <div className="levels-modal__inner" style={{ marginTop: 76 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title levels-modal__title--live">
          {temaEnTitulo || `Temas de ${curso}`}
        </h2>

        <div className="home-search levels-modal__search" onClick={(e) => e.stopPropagation()}>
          <input autoComplete="off"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => setInputEnfocado(true)}
            onBlur={() => setTimeout(() => setInputEnfocado(false), 150)}
            placeholder="Buscar tema por nombre..."
            className="home-search-input"
          />
          {inputEnfocado && (
            <div className="home-search-results">
              {temasFiltrados.length === 0 && (
                <p style={{ padding: "12px 16px", color: "var(--ink-soft)" }}>
                  Ningún tema coincide con "{busqueda}".
                </p>
              )}
              {temasFiltrados.map(({ item, index }) => (
                <button
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectTema(item);
                    onClose();
                  }}
                  className={`home-search-result ${item.tema === temaActual ? "is-focused" : ""}`}
                >
                  <p>
                    <span style={{ opacity: 0.6, marginRight: "8px" }}>#{index + 1}</span>
                    {item.tema}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="levels-modal__grid">
          {temasFiltrados.map(({ item, index }) => {
            const esTemaActual = item.tema === temaActual;

            return (
              <div key={index} className="level-cell">
                <button
                  className={`level-btn ${esTemaActual ? 'is-current' : ''}`}
                  onPointerDown={(e) => manejarToqueInicial(item, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fueArrastre(e)) return;
                    manejarClickTema(item, index);
                  }}
                  onMouseOver={() => manejarHover(item, index)}
                  onMouseOut={manejarSalidaHover}
                >
                  {index + 1}
                </button>
              </div>
            );
          })}
        </div>

        {listaTemas.length === 0 && (
          <p style={{ color: "var(--ink-soft)", marginBottom: "20px" }}>
            No hay temas registrados para este curso.
          </p>
        )}

        {listaTemas.length > 0 && temasFiltrados.length === 0 && (
          <p style={{ color: "var(--ink-soft)", marginBottom: "20px" }}>
            Ningún tema coincide con "{busqueda}".
          </p>
        )}

        <button className="levels-modal__close" onClick={onClose}>
          Cerrar mapa
        </button>
      </div>
    </div>
  );
}