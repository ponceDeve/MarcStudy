import React, { useEffect, useRef, useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ResaltarCoincidencia({ texto, query }) {
  if (!query.trim()) {
    return texto;
  }

  const textoOriginal = String(texto ?? "");
  const busqueda = query.trim();

  const textoNormalizado = normalizarTexto(textoOriginal);
  const busquedaNormalizada = normalizarTexto(busqueda);

  if (!busquedaNormalizada) {
    return textoOriginal;
  }

  const indice = textoNormalizado.indexOf(busquedaNormalizada);

  if (indice === -1) {
    return textoOriginal;
  }

  const antes = textoOriginal.slice(0, indice);
  const coincidencia = textoOriginal.slice(indice, indice + busqueda.length);
  const despues = textoOriginal.slice(indice + busqueda.length);

  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}

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
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const puntoInicioToque = useRef(null);

  // Si el dedo se movió más de esto entre el toque inicial y el click,
  // fue un scroll, no una selección real: se ignora el click.
  const UMBRAL_ARRASTRE = 10;

  // En vez de scrollear una lista larga de temas, se muestra solo un
  // bloque inicial y el resto queda detrás de "Mostrar más".
  const LIMITE_INICIAL = 48;

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
      setMostrarTodos(false);
    }
  }, [open]);

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

  // Con búsqueda activa se muestran todos los resultados filtrados;
  // sin búsqueda, se respeta el límite hasta que se pida "Mostrar más".
  const hayBusqueda = busqueda.trim().length > 0;
  const temasVisibles = hayBusqueda || mostrarTodos
    ? temasFiltrados
    : temasFiltrados.slice(0, LIMITE_INICIAL);
  const hayMasTemas = !hayBusqueda && temasFiltrados.length > LIMITE_INICIAL;

  return (
    <div
      className={`levels-modal ${open ? "" : "is-closed"}`}
      style={{ zIndex: 1000 }}
      onClick={() => setActiveIndex(null)}
      onScroll={manejarScroll}
      aria-hidden={!open}
    >
      <div className="levels-modal__inner" style={{ marginTop: 76 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title levels-modal__title--live">
          {temaEnTitulo || `Temas de ${curso}`}
        </h2>

        <div className="home-search levels-modal__search" onClick={(e) => e.stopPropagation()}>
          <input autoComplete="off"
            type="search"
            name="buscar-tema"
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
                <p className="search-empty">
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
                    <span className="home-search-result__num">#{index + 1}</span>
                    <ResaltarCoincidencia texto={item.tema} query={busqueda} />
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="levels-modal__grid">
          {temasVisibles.map(({ item, index }) => {
            const esTemaActual = item.tema === temaActual;
            const esArmado = activeIndex === index;

            return (
              <div key={index} className="level-cell">
                <button
                  className={`level-btn ${esTemaActual ? 'is-current' : ''} ${esArmado ? 'is-armado' : ''}`}
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

        {hayMasTemas && (
          <div className="levels-modal__pagination">
            <button
              type="button"
              className="levels-modal__toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMostrarTodos(true);
              }}
            >
              Mostrar más ({temasFiltrados.length - LIMITE_INICIAL} más)
            </button>
          </div>
        )}

        {!hayBusqueda && mostrarTodos && temasFiltrados.length > LIMITE_INICIAL && (
          <div className="levels-modal__pagination">
            <button
              type="button"
              className="levels-modal__toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMostrarTodos(false);
              }}
            >
              Mostrar menos
            </button>
          </div>
        )}

        {listaTemas.length === 0 && (
          <p className="levels-modal__empty">
            No hay temas registrados para este curso.
          </p>
        )}

        <button className="levels-modal__close" onClick={onClose}>
          Cerrar mapa
        </button>
      </div>
    </div>
  );
}