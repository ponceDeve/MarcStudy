import React, { useEffect, useRef, useState } from "react";

import { puntajeDeTexto } from "../../lib/buscador";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";
import TheorySearchBar, { ResaltarCoincidencia } from "./TheorySearchBar";

const NIVELES_POR_PAGINA = 18;
const COLUMNAS = 3;
const PAG_BTN_MIN = 34;
const PAG_GAP = 6;
const PAG_CASILLAS_MIN = 5;
const PAG_CASILLAS_MAX = 11;

// Si algún tema coincide de forma directa (ej. "India" con "india"), se
// descartan las coincidencias aproximadas (typos o letras sueltas), que
// traían temas sin relación como "Segunda Revolución Industrial" o
// "Primera Guerra Mundial". Las aproximadas solo se muestran cuando no
// hay ninguna coincidencia directa.
const PUNTAJE_FUERTE = 400;

function filtrarTemas(items, query) {
  const puntuados = items
    .map((it) => ({ it, score: puntajeDeTexto(it.item.tema, query) }))
    .filter((r) => r.score > 0);

  const hayFuerte = puntuados.some((r) => r.score >= PUNTAJE_FUERTE);

  return puntuados
    .filter((r) => !hayFuerte || r.score >= PUNTAJE_FUERTE)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.it);
}

function calcularCasillasNumeros(ancho) {
  if (!ancho) return PAG_CASILLAS_MIN;

  const botones = Math.floor((ancho + PAG_GAP) / (PAG_BTN_MIN + PAG_GAP));

  return Math.max(PAG_CASILLAS_MIN, Math.min(PAG_CASILLAS_MAX, botones));
}

function armarPaginacion(total, actual, casillas) {
  if (total <= casillas) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const ultima = total - 1;
  const centro = casillas - 4;
  const inicio = actual - Math.floor(centro / 2);

  if (inicio < 2) {
    return [
      ...Array.from({ length: casillas - 2 }, (_, i) => i),
      "gap-fin",
      ultima,
    ];
  }

  if (inicio + centro - 1 > ultima - 2) {
    return [
      0,
      "gap-ini",
      ...Array.from(
        { length: casillas - 2 },
        (_, i) => total - (casillas - 2) + i
      ),
    ];
  }

  return [
    0,
    "gap-ini",
    ...Array.from({ length: centro }, (_, i) => inicio + i),
    "gap-fin",
    ultima,
  ];
}

export default function TopicsModal({
  open,
  onClose,
  curso,
  temaActual,
  listaTemas = [],
  onSelectTema,
  onCargarPuntos,
  onSelectContenido,
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [textoInput, setTextoInput] = useState("");
  const [inputEnfocado, setInputEnfocado] = useState(false);
  const [puntosTema, setPuntosTema] = useState([]);
  const [cargandoPuntos, setCargandoPuntos] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [direccion, setDireccion] = useState(null);
  const [estrellasPorTema, setEstrellasPorTema] = useState({});
  const [anchoMapa, setAnchoMapa] = useState(0);
  const [modoTeoria, setModoTeoria] = useState(false);
  const [mostrarNombreTema, setMostrarNombreTema] = useState(false);

  const barraTemaRef = useRef(null);
  const modalRef = useRef(null);
  const mapaRef = useRef(null);
  const puntoInicioToque = useRef(null);

  const UMBRAL_ARRASTRE = 10;

  const itemActivo = activeIndex !== null ? listaTemas[activeIndex] : null;

  // La flecha solo se habilita cuando la búsqueda de niveles cambió el mapa
  // (hay texto en el buscador). Seleccionar un nivel no la habilita.
  const hayBusqueda = busqueda.trim() !== "";
  const puedeVolver = hayBusqueda || itemActivo !== null;

  useEffect(() => {
    if (!open) {
      setBusqueda("");
      setTextoInput("");
      setActiveIndex(null);
      setInputEnfocado(false);
      setPuntosTema([]);
      setCargandoPuntos(false);
      setPagina(0);
      setDireccion(null);
      setModoTeoria(false);
      setMostrarNombreTema(false);
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

  useEffect(() => {
    setPuntosTema([]);
    setModoTeoria(false);

    if (!open || !itemActivo || !onCargarPuntos) {
      setCargandoPuntos(false);
      return undefined;
    }

    let cancelado = false;

    setCargandoPuntos(true);

    Promise.resolve(onCargarPuntos(itemActivo))
      .then((puntos) => {
        if (!cancelado) {
          setPuntosTema(puntos);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setPuntosTema([]);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoPuntos(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [activeIndex, open, onCargarPuntos]);

  useEffect(() => {
    if (!open) return;

    const idx = listaTemas.findIndex((t) => t.tema === temaActual);

    setPagina(idx >= 0 ? Math.floor(idx / NIVELES_POR_PAGINA) : 0);

    setDireccion(null);
  }, [open, listaTemas, temaActual]);

  function manejarClickTema(item, index) {
    if (activeIndex === index) {
      onSelectTema(item);
      onClose();
      setActiveIndex(null);
      return;
    }

    setModoTeoria(false);
    setMostrarNombreTema(true);
    setActiveIndex(index);
  }

  function manejarToqueInicial(item, e) {
    puntoInicioToque.current = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  function fueArrastre(e) {
    const inicio = puntoInicioToque.current;

    if (!inicio) return false;

    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;

    return Math.sqrt(dx * dx + dy * dy) > UMBRAL_ARRASTRE;
  }

  function volverAlMapa() {
    // Si hay un tema seleccionado, la flecha solo lo deselecciona.
    if (itemActivo) {
      setActiveIndex(null);
      setModoTeoria(false);
      setMostrarNombreTema(false);
      setPuntosTema([]);
      setCargandoPuntos(false);
      return;
    }

    if (!hayBusqueda) return;

    setActiveIndex(null);
    setBusqueda("");
    setTextoInput("");
    setPagina(0);
    setDireccion(null);
    setInputEnfocado(false);
    setPuntosTema([]);
    setCargandoPuntos(false);
    setModoTeoria(false);
    setMostrarNombreTema(false);

    barraTemaRef.current?.limpiar?.();
    barraTemaRef.current?.reset?.();
  }

  const temasConIndice = listaTemas.map((item, index) => ({
    item,
    index,
  }));

  const temasFiltrados = busqueda.trim()
    ? filtrarTemas(temasConIndice, busqueda)
    : temasConIndice;

  const temasDesplegable = textoInput.trim()
    ? filtrarTemas(temasConIndice, textoInput)
    : temasConIndice;

  const { focusedIdx, handleKeyDown } = useArrowKeyList(
    temasDesplegable,
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

    if (e.key === "Enter" && !textoInput.trim() && focusedIdx < 0) {
      return;
    }

    handleKeyDown(e);
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil(temasFiltrados.length / NIVELES_POR_PAGINA)
  );

  const paginaActual = Math.min(pagina, totalPaginas - 1);

  const temasPagina = temasFiltrados.slice(
    paginaActual * NIVELES_POR_PAGINA,
    paginaActual * NIVELES_POR_PAGINA + NIVELES_POR_PAGINA
  );

  const filasPorPagina = Math.ceil(temasPagina.length / COLUMNAS);
  const filasVisibles = [];

  for (let r = 0; r < filasPorPagina; r++) {
    filasVisibles.push({
      filaIndex: r,
      fila: temasPagina.slice(r * COLUMNAS, r * COLUMNAS + COLUMNAS),
    });
  }

  filasVisibles.reverse();

  function irAPagina(nueva) {
    if (nueva === paginaActual || nueva < 0 || nueva >= totalPaginas) {
      return;
    }

    setDireccion(nueva > paginaActual ? "up" : "down");
    setPagina(nueva);
  }

  const hayNavegacion = totalPaginas > 1;

  useEffect(() => {
    const el = mapaRef.current;

    if (!el) return undefined;

    const medir = () => {
      if (!el.isConnected) return;

      const ancho = el.clientWidth;

      if (ancho > 0) {
        setAnchoMapa(ancho);
      }
    };

    medir();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", medir);

      return () => {
        window.removeEventListener("resize", medir);
      };
    }

    const observador = new ResizeObserver(medir);

    observador.observe(el);

    return () => observador.disconnect();
  }, [hayNavegacion, open, paginaActual]);

  const elementosPaginacion = armarPaginacion(
    totalPaginas,
    paginaActual,
    calcularCasillasNumeros(anchoMapa)
  );

  useEffect(() => {
    if (!open) return undefined;

    const id = requestAnimationFrame(() => {
      const el = modalRef.current;

      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });

    return () => cancelAnimationFrame(id);
  }, [open, paginaActual]);

  const esCursoIngles =
    String(curso || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() === "ingles";

  return (
    <div
      ref={modalRef}
      className={`levels-modal ${open ? "" : "is-closed"}`}
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
              modoTeoria ? "levels-modal__search--teoria" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {itemActivo && modoTeoria ? (
              <TheorySearchBar
                key={itemActivo.archivo}
                ref={barraTemaRef}
                flatPuntos={puntosTema}
                placeholder={itemActivo.tema}
                onSelect={(sel) => {
                  onSelectContenido?.(itemActivo, sel);
                  onClose();
                }}
              />
            ) : (
              <>
                <input
                  autoComplete="off"
                  type="search"
                  name="buscar-tema"
                  value={
                    mostrarNombreTema && itemActivo
                      ? itemActivo.tema
                      : textoInput
                  }
                  onChange={(e) => {
                    setMostrarNombreTema(false);
                    setTextoInput(e.target.value);
                    setBusqueda(e.target.value);
                    setPagina(0);
                    setDireccion(null);
                  }}
                  onFocus={() => {
                    setInputEnfocado(true);
                    setMostrarNombreTema(false);
                    setTextoInput("");
                  }}
                  onBlur={() =>
                    setTimeout(() => {
                      setInputEnfocado(false);
                      if (itemActivo) {
                        setMostrarNombreTema(true);
                      }
                    }, 150)
                  }
                  onKeyDown={onKeyDownNombres}
                  placeholder={
                    itemActivo
                      ? "Buscar otro tema..."
                      : curso
                        ? `Temas de ${curso}`
                        : "Buscar tema por nombre..."
                  }
                  className="home-search-input"
                />

                {inputEnfocado && (
                  <div className="home-search-results">
                    {temasDesplegable.length === 0 && (
                      <p className="search-empty">
                        Ningún tema coincide con "{textoInput}".
                      </p>
                    )}

                    {temasDesplegable.map(({ item, index }, idx) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelectTema(item);
                          onClose();
                        }}
                        className={`home-search-result ${
                          item.tema === temaActual || idx === focusedIdx
                            ? "is-focused"
                            : ""
                        }`}
                      >
                        <p>
                          <ResaltarCoincidencia
                            texto={item.tema}
                            query={textoInput}
                          />
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              className="levels-modal__buscar"
              disabled={!itemActivo || cargandoPuntos}
              title={
                itemActivo
                  ? modoTeoria
                    ? "Buscar dentro de este tema"
                    : "Buscar dentro de este tema (pulsa para activar)"
                  : "Toca un tema del mapa para buscar dentro de él"
              }
              aria-label={
                modoTeoria
                  ? "Buscar dentro de este tema"
                  : "Activar búsqueda dentro del tema"
              }
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!modoTeoria) {
                  setModoTeoria(true);
                  return;
                }
                barraTemaRef.current?.buscar?.();
              }}
            >
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={mapaRef}
          key={paginaActual}
          className={`levels-map ${
            direccion ? `levels-map--anim-${direccion}` : ""
          }`}
          style={{ "--cols": COLUMNAS }}
        >
          {filasVisibles.map(({ fila, filaIndex }) => (
            <div
              key={filaIndex}
              className={`levels-map__row ${
                filaIndex % 2 === 1 ? "levels-map__row--reverse" : ""
              }`}
            >
              {Array.from({ length: COLUMNAS }).map((_, posicion) => {
                const celda = fila[posicion];

                if (!celda) {
                  return (
                    <div
                      key={`vacio-${filaIndex}-${posicion}`}
                      className="level-cell level-cell--empty"
                      aria-hidden="true"
                    >
                      <div className="level-btn">
                        <span className="level-btn__numero">0</span>
                      </div>
                    </div>
                  );
                }

                const { item, index } = celda;
                const esTemaActual = item.tema === temaActual;
                const esArmado = activeIndex === index;
                const conectaFila = posicion < fila.length - 1;
                const hayFilaSiguiente =
                  temasPagina.length > (filaIndex + 1) * COLUMNAS;
                const conectaArriba =
                  posicion === COLUMNAS - 1 && hayFilaSiguiente;

                const estrellasTema =
                  estrellasPorTema[`${curso}_${item.tema}`]?.estrellas || 0;

                return (
                  <div
                    key={index}
                    className={`level-cell ${
                      conectaFila ? "level-cell--h" : ""
                    } ${conectaArriba ? "level-cell--v" : ""} ${
                      esCursoIngles ? "level-cell--sin-estrellas" : ""
                    }`}
                  >
                    {!esCursoIngles && (
                      <div className="level-cell__estrellas" aria-hidden="true">
                        {[1, 2, 3].map((n) => (
                          <span
                            key={n}
                            className={n <= estrellasTema ? "is-activa" : ""}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className={`level-btn ${
                        esTemaActual ? "is-current" : ""
                      } ${esArmado ? "is-armado" : ""}`}
                      onPointerDown={(e) => manejarToqueInicial(item, e)}
                      onClick={(e) => {
                        e.stopPropagation();

                        if (fueArrastre(e)) {
                          puntoInicioToque.current = null;
                          return;
                        }

                        puntoInicioToque.current = null;
                        manejarClickTema(item, index);
                      }}
                    >
                      {estrellasTema > 0 && !esCursoIngles ? (
                        <span
                          className={`level-btn__numero level-btn__numero--estrella level-btn__numero--estrellas-${estrellasTema}`}
                          role="img"
                          aria-label={`Nivel ${index + 1}, ${estrellasTema} ${
                            estrellasTema === 1 ? "estrella" : "estrellas"
                          }`}
                        >
                          ★
                        </span>
                      ) : (
                        <span className="level-btn__numero">{index + 1}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {totalPaginas > 1 && (
          <div className="levels-nav">
            {elementosPaginacion.map((n, i) =>
              typeof n === "string" ? (
                <span
                  key={`${n}-${i}`}
                  className="levels-nav__gap"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  className={`levels-nav__btn ${
                    n === paginaActual ? "is-activa" : ""
                  }`}
                  aria-label={`Página ${n + 1}`}
                  aria-current={n === paginaActual ? "page" : undefined}
                  onClick={() => irAPagina(n)}
                >
                  {n + 1}
                </button>
              )
            )}
          </div>
        )}

        {listaTemas.length === 0 && (
          <p className="levels-modal__empty">
            No hay temas registrados para este curso.
          </p>
        )}

        <div className="levels-modal__acciones">
          <button
            type="button"
            className={`levels-modal__volver ${
              !puedeVolver ? "levels-modal__volver--deshabilitado" : ""
            }`}
            onClick={volverAlMapa}
            disabled={!puedeVolver}
            aria-label="Volver al mapa completo"
            title={
              puedeVolver
                ? "Volver al mapa completo"
                : "Ya estás en el mapa completo"
            }
          >
            <span className="levels-modal__flecha" aria-hidden="true">
              <span className="levels-modal__flecha-punta" />
              <span className="levels-modal__flecha-linea" />
            </span>
          </button>

          <button
            type="button"
            className="levels-modal__cerrar"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}