import React, { useEffect, useRef, useState } from "react";

import { buscarConPuntaje } from "../../lib/buscador";

import { useArrowKeyList } from "../../hooks/useArrowKeyList";

import TheorySearchBar, { ResaltarCoincidencia } from "./TheorySearchBar";

// 18 niveles por página: 6 columnas x 3 filas (3 columnas x 6 filas en móvil).
const NIVELES_POR_PAGINA = 18;

export default function TopicsModal({
  open,
  onClose,
  curso,
  temaActual,
  listaTemas = [],
  onSelectTema,
  onCargarPuntos,
  onSelectContenido
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [inputEnfocado, setInputEnfocado] = useState(false);

  // Contenido del tema elegido (para buscar dentro de él).
  const [puntosTema, setPuntosTema] = useState([]);
  const [cargandoPuntos, setCargandoPuntos] = useState(false);

  const barraTemaRef = useRef(null);
  const modalRef = useRef(null);

  const itemActivo =
    activeIndex !== null ? listaTemas[activeIndex] : null;

  const [pagina, setPagina] = useState(0);
  const [direccion, setDireccion] = useState(null);
  const [columnas, setColumnas] = useState(6);
  const [estrellasPorTema, setEstrellasPorTema] = useState({});
  const puntoInicioToque = useRef(null);
  const UMBRAL_ARRASTRE = 10;

  useEffect(() => {
    if (!open) {
      setBusqueda("");
      setActiveIndex(null);
      setInputEnfocado(false);
      return;
    }

    try {
      setEstrellasPorTema(
        JSON.parse(localStorage.getItem("estrellasTemas") || "{}")
      );
    } catch {
      setEstrellasPorTema({});
    }
  }, [open]);

  // Al elegir un tema se carga su contenido para poder buscar dentro.
  useEffect(() => {
    setPuntosTema([]);

    if (!open || !itemActivo || !onCargarPuntos) {
      setCargandoPuntos(false);
      return undefined;
    }

    let cancelado = false;
    setCargandoPuntos(true);

    onCargarPuntos(itemActivo)
      .then((puntos) => {
        if (!cancelado) setPuntosTema(puntos);
      })
      .catch(() => {
        if (!cancelado) setPuntosTema([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoPuntos(false);
      });

    return () => {
      cancelado = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  useEffect(() => {
    const actualizarColumnas = () => {
      setColumnas(window.innerWidth <= 640 ? 3 : 6);
    };

    actualizarColumnas();
    window.addEventListener("resize", actualizarColumnas);

    return () => {
      window.removeEventListener("resize", actualizarColumnas);
    };
  }, []);

  // Al abrir, se muestra la página donde está el tema actual.
  useEffect(() => {
    if (!open) return;

    const idx = listaTemas.findIndex(
      (t) => t.tema === temaActual
    );

    setPagina(
      idx >= 0 ? Math.floor(idx / NIVELES_POR_PAGINA) : 0
    );

    setDireccion(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function manejarToqueInicial(item, e) {
    puntoInicioToque.current = {
      x: e.clientX,
      y: e.clientY
    };
  }

  function fueArrastre(e) {
    const inicio = puntoInicioToque.current;

    if (!inicio) return false;

    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;

    return Math.sqrt(dx * dx + dy * dy) > UMBRAL_ARRASTRE;
  }

  const temasConIndice = listaTemas.map((item, index) => ({
    item,
    index
  }));

  const temasFiltrados = busqueda.trim()
    ? buscarConPuntaje(
        temasConIndice,
        busqueda,
        ({ item }) => item.tema
      )
    : temasConIndice;

  // Flechas y Enter en la lista de temas.
  const { focusedIdx, handleKeyDown } = useArrowKeyList(
    itemActivo ? [] : temasFiltrados,
    ({ item }) => {
      onSelectTema(item);
      onClose();
    }
  );

  function onKeyDownNombres(e) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
      return;
    }

    // Con el input vacío, Enter solo actúa si se eligió con las flechas.
    if (
      e.key === "Enter" &&
      !busqueda.trim() &&
      focusedIdx < 0
    ) {
      return;
    }

    handleKeyDown(e);
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      temasFiltrados.length / NIVELES_POR_PAGINA
    )
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas - 1
  );

  const temasPagina = temasFiltrados.slice(
    paginaActual * NIVELES_POR_PAGINA,
    paginaActual * NIVELES_POR_PAGINA +
      NIVELES_POR_PAGINA
  );

  // Filas reales de la página, de abajo hacia arriba.
  const filasPorPagina = Math.ceil(
    temasPagina.length / columnas
  );

  const filasVisibles = [];

  for (let r = 0; r < filasPorPagina; r++) {
    filasVisibles.push({
      filaIndex: r,
      fila: temasPagina.slice(
        r * columnas,
        r * columnas + columnas
      )
    });
  }

  filasVisibles.reverse();

  function irAPagina(nueva) {
    if (
      nueva === paginaActual ||
      nueva < 0 ||
      nueva >= totalPaginas
    ) {
      return;
    }

    setDireccion(
      nueva > paginaActual ? "up" : "down"
    );

    setPagina(nueva);
  }

  // Números de página visibles (máximo 5).
  const VENTANA_PAGINAS = 5;

  const cantidadNumeros = Math.min(
    VENTANA_PAGINAS,
    totalPaginas
  );

  const inicioNumeros = Math.max(
    0,
    Math.min(
      paginaActual -
        Math.floor(VENTANA_PAGINAS / 2),
      totalPaginas - cantidadNumeros
    )
  );

  const numerosPagina = Array.from(
    { length: cantidadNumeros },
    (_, i) => inicioNumeros + i
  );

  // El scroll empieza abajo.
  useEffect(() => {
    if (!open) return undefined;

    const id = requestAnimationFrame(() => {
      const el = modalRef.current;

      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });

    return () => cancelAnimationFrame(id);
  }, [open, paginaActual, columnas]);

  return (
    <div
      ref={modalRef}
      className={`levels-modal ${
        open ? "" : "is-closed"
      }`}
      style={{ zIndex: 1000 }}
      onClick={() => setActiveIndex(null)}
      aria-hidden={!open}
    >
      <div
        className="levels-modal__inner"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="levels-modal__search-row">
          <div
            className={`home-search levels-modal__search ${
              itemActivo
                ? "levels-modal__search--teoria"
                : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {itemActivo ? (
              <TheorySearchBar
                key={itemActivo.archivo}
                ref={barraTemaRef}
                flatPuntos={puntosTema}
                placeholder={itemActivo.tema}
                onSelect={(sel) => {
                  onSelectContenido?.(
                    itemActivo,
                    sel
                  );
                  onClose();
                }}
              />
            ) : (
              <>
                <input
                  autoComplete="off"
                  type="search"
                  name="buscar-tema"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(0);
                    setDireccion(null);
                  }}
                  onFocus={() =>
                    setInputEnfocado(true)
                  }
                  onBlur={() =>
                    setTimeout(
                      () =>
                        setInputEnfocado(false),
                      150
                    )
                  }
                  onKeyDown={onKeyDownNombres}
                  placeholder={
                    curso
                      ? `Temas de ${curso}`
                      : "Buscar tema por nombre..."
                  }
                  className="home-search-input"
                />

                {inputEnfocado && (
                  <div className="home-search-results">
                    {temasFiltrados.length === 0 && (
                      <p className="search-empty">
                        Ningún tema coincide con "
                        {busqueda}".
                      </p>
                    )}

                    {temasFiltrados.map(
                      (
                        { item, index },
                        idx
                      ) => (
                        <button
                          key={index}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onSelectTema(item);
                            onClose();
                          }}
                          className={`home-search-result ${
                            item.tema === temaActual ||
                            idx === focusedIdx
                              ? "is-focused"
                              : ""
                          }`}
                        >
                          <p>
                            <ResaltarCoincidencia
                              texto={item.tema}
                              query={busqueda}
                            />
                          </p>
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
            )}

            {/* Botón Buscar */}
            <button
              type="button"
              className="levels-modal__buscar"
              disabled={
                !itemActivo || cargandoPuntos
              }
              title={
                itemActivo
                  ? "Buscar dentro de este tema"
                  : "Toca un tema del mapa para buscar dentro de él"
              }
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={() =>
                barraTemaRef.current?.buscar()
              }
            >
              Buscar
            </button>
          </div>
        </div>

        <div
          key={paginaActual}
          className={`levels-map ${
            direccion
              ? `levels-map--anim-${direccion}`
              : ""
          }`}
          style={{ "--cols": columnas }}
        >
          {filasVisibles.map(
            ({ fila, filaIndex }) => (
              <div
                key={filaIndex}
                className={`levels-map__row ${
                  filaIndex % 2 === 1
                    ? "levels-map__row--reverse"
                    : ""
                }`}
              >
                {Array.from({
                  length: columnas
                }).map((_, posicion) => {
                  const celda =
                    fila[posicion];

                  // Casilla vacía de la última fila.
                  if (!celda) {
                    return (
                      <div
                        key={`vacio-${filaIndex}-${posicion}`}
                        className="level-cell level-cell--empty"
                        aria-hidden="true"
                      >
                        <div className="level-btn">
                          <div className="level-cell__estrellas">
                            <span>★</span>
                          </div>

                          <span className="level-btn__numero">
                            0
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const { item, index } =
                    celda;

                  const esTemaActual =
                    item.tema ===
                    temaActual;

                  const esArmado =
                    activeIndex === index;

                  const conectaFila =
                    posicion <
                    fila.length - 1;

                  const hayFilaSiguiente =
                    temasPagina.length >
                    (filaIndex + 1) *
                      columnas;

                  const conectaArriba =
                    posicion ===
                      columnas - 1 &&
                    hayFilaSiguiente;

                  const esCursoIngles =
                    String(curso || "")
                      .normalize("NFD")
                      .replace(
                        /[\u0300-\u036f]/g,
                        ""
                      )
                      .toLowerCase()
                      .trim() ===
                    "ingles";

                  const estrellasTema =
                    estrellasPorTema[
                      `${curso}_${item.tema}`
                    ]?.estrellas || 0;

                  return (
                    <div
                      key={index}
                      className={`level-cell ${
                        conectaFila
                          ? "level-cell--h"
                          : ""
                      } ${
                        conectaArriba
                          ? "level-cell--v"
                          : ""
                      }`}
                    >
                      <button
                        className={`level-btn ${
                          esTemaActual
                            ? "is-current"
                            : ""
                        } ${
                          esArmado
                            ? "is-armado"
                            : ""
                        }`}
                        onPointerDown={(e) =>
                          manejarToqueInicial(
                            item,
                            e
                          )
                        }
                        onClick={(e) => {
                          e.stopPropagation();

                          if (
                            fueArrastre(e)
                          ) {
                            return;
                          }

                          manejarClickTema(
                            item,
                            index
                          );
                        }}
                      >
                        {!esCursoIngles && (
                          <div
                            className="level-cell__estrellas"
                            aria-hidden="true"
                          >
                            {[1, 2, 3].map(
                              (n) => (
                                <span
                                  key={n}
                                  className={
                                    n <=
                                    estrellasTema
                                      ? "is-activa"
                                      : ""
                                  }
                                >
                                  ★
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {estrellasTema > 0 && !esCursoIngles ? (
                          <span
                            className={`level-btn__numero level-btn__numero--estrella level-btn__numero--estrellas-${estrellasTema}`}
                            role="img"
                            aria-label={`Nivel ${index + 1}, ${estrellasTema} ${estrellasTema === 1 ? "estrella" : "estrellas"}`}
                          >
                            ★
                          </span>
                        ) : (
                          <span className="level-btn__numero">
                            {index + 1}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="levels-nav">
            <button
              type="button"
              className="levels-nav__btn"
              aria-label="Página anterior"
              disabled={
                paginaActual === 0
              }
              onClick={() =>
                irAPagina(
                  paginaActual - 1
                )
              }
            >
              <i className="fa-solid fa-arrow-down" />
            </button>

            {numerosPagina.map((n) => (
              <button
                key={n}
                type="button"
                className={`levels-nav__btn ${
                  n === paginaActual
                    ? "is-activa"
                    : ""
                }`}
                aria-label={`Página ${
                  n + 1
                }`}
                aria-current={
                  n === paginaActual
                    ? "page"
                    : undefined
                }
                onClick={() =>
                  irAPagina(n)
                }
              >
                {n + 1}
              </button>
            ))}

            <button
              type="button"
              className="levels-nav__btn"
              aria-label="Página siguiente"
              disabled={
                paginaActual ===
                totalPaginas - 1
              }
              onClick={() =>
                irAPagina(
                  paginaActual + 1
                )
              }
            >
              <i className="fa-solid fa-arrow-up" />
            </button>
          </div>
        )}

        <div className="levels-modal__bottom-close">
          <button
            className="levels-modal__close"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        {listaTemas.length === 0 && (
          <p className="levels-modal__empty">
            No hay temas registrados para este
            curso.
          </p>
        )}
      </div>
    </div>
  );
}