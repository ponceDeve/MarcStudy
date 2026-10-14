import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [aviso, setAviso] = useState(null);
  const [nombreBloqueado, setNombreBloqueado] = useState(null);

  const avisoRef = useRef(null);
  const avisoElRef = useRef(null);
  const avisoActivo = aviso !== null;
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

  // Un tema se desbloquea cuando el anterior tiene 3 estrellas.
  // El primero siempre está abierto y un tema que ya tiene estrellas
  // nunca se bloquea.
  const UMBRAL_ESTRELLAS = 3;

  const esCursoIngles =
    String(curso || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() === "ingles";

  function estrellasDe(item) {
    return estrellasPorTema[`${curso}_${item.tema}`]?.estrellas || 0;
  }

  function estaBloqueado(index) {
    // Inglés tiene su propio sistema de niveles: no se bloquea aquí
    if (esCursoIngles || index === 0) return false;
    if (estrellasDe(listaTemas[index]) > 0) return false;
    return estrellasDe(listaTemas[index - 1]) < UMBRAL_ESTRELLAS;
  }

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
      setNombreBloqueado(null);
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

  // Mantiene la burbuja dentro de la pantalla en horizontal
  useLayoutEffect(() => {
    const el = avisoRef.current;
    if (!el || !aviso) return;

    const margen = 8;
    const mitad = el.offsetWidth / 2;
    const minX = margen + mitad;
    const maxX = window.innerWidth - margen - mitad;
    const x = Math.min(Math.max(aviso.x, minX), maxX);

    el.style.left = `${x}px`;

    // La colita siempre apunta al centro del nivel, aunque el globito se recorra
    el.style.setProperty("--cola-x", `${aviso.x - x}px`);
  }, [aviso]);

  useEffect(() => {
    if (!avisoActivo) return undefined;

    const id = setTimeout(() => setAviso(null), 5000);

    return () => clearTimeout(id);
  }, [avisoActivo]);

  // Cualquier scroll cierra el globito de inmediato
  useEffect(() => {
    if (!avisoActivo) return undefined;

    const cerrar = () => setAviso(null);
    const modal = modalRef.current;

    modal?.addEventListener("scroll", cerrar, { passive: true });
    window.addEventListener("scroll", cerrar, { passive: true });

    return () => {
      modal?.removeEventListener("scroll", cerrar);
      window.removeEventListener("scroll", cerrar);
    };
  }, [avisoActivo]);

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

  // Posición del globito según el nivel tocado
  function calcularAviso(elemento, index) {
    const r = elemento?.getBoundingClientRect();
    if (!r) return null;

    // Si el nivel está muy arriba, la burbuja se muestra debajo
    const abajo = r.top < 90;

    return {
      index,
      x: r.left + r.width / 2,
      y: abajo ? r.bottom : r.top,
      abajo,
    };
  }

  function mostrarAviso(elemento, index) {
    avisoElRef.current = elemento;
    setAviso(calcularAviso(elemento, index));
  }

  function manejarClickTema(item, index, elemento) {
    if (estaBloqueado(index)) {
      // Solo cambia el nombre del buscador y muestra el globito
      setNombreBloqueado(listaTemas[index].tema);
      mostrarAviso(elemento, index);
      return;
    }

    setNombreBloqueado(null);

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
                    nombreBloqueado !== null
                      ? nombreBloqueado
                      : mostrarNombreTema && itemActivo
                        ? itemActivo.tema
                        : textoInput
                  }
                  onChange={(e) => {
                    setNombreBloqueado(null);
                    setMostrarNombreTema(false);
                    setTextoInput(e.target.value);
                    setBusqueda(e.target.value);
                    setPagina(0);
                    setDireccion(null);
                  }}
                  onFocus={() => {
                    setNombreBloqueado(null);
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

                <button
                  type="button"
                  className="levels-modal__buscar"
                  disabled={
                    !itemActivo ||
                    cargandoPuntos ||
                    estaBloqueado(activeIndex)
                  }
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
                  <i
                    className="fa-solid fa-magnifying-glass"
                    aria-hidden="true"
                  />
                </button>

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
                          <span className="home-search-result__num">
                            {index + 1}){" "}
                          </span>
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

                const estrellasTema = estrellasDe(item);
                const bloqueado = estaBloqueado(index);

                return (
                  <div
                    key={index}
                    className={`level-cell ${
                      conectaFila ? "level-cell--h" : ""
                    } ${conectaArriba ? "level-cell--v" : ""} ${
                      bloqueado ? "level-cell--bloqueado" : ""
                    }`}
                  >
                    {estrellasTema > 0 && (
                      <div
                        className="level-cell__estrellas"
                        aria-hidden="true"
                      >
                        {[1, 2, 3].map((n) => (
                          <span
                            key={n}
                            className={
                              n <= estrellasTema ? "is-activa" : "is-vacia"
                            }
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
                      } ${esArmado ? "is-armado" : ""} ${
                        bloqueado ? "is-bloqueado" : ""
                      }`}
                      aria-disabled={bloqueado || undefined}
                      aria-label={
                        bloqueado
                          ? `Nivel ${index + 1}, bloqueado`
                          : undefined
                      }
                      onPointerDown={(e) => manejarToqueInicial(item, e)}
                      onClick={(e) => {
                        e.stopPropagation();

                        if (fueArrastre(e)) {
                          puntoInicioToque.current = null;
                          return;
                        }

                        puntoInicioToque.current = null;
                        manejarClickTema(item, index, e.currentTarget);
                      }}
                    >
                      <span className="level-btn__numero">{index + 1}</span>

                      {bloqueado && (
                        <i
                          className="fa-solid fa-lock level-btn__candado"
                          aria-hidden="true"
                        />
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

        {aviso && (
          <div
            ref={avisoRef}
            className={`levels-modal__aviso ${
              aviso.abajo ? "levels-modal__aviso--abajo" : ""
            }`}
            role="status"
            style={{ top: aviso.y }}
          >
            (3{" "}
            <i
              className="fa-solid fa-star levels-modal__aviso-estrella"
              aria-hidden="true"
            />
            ) Supera el nivel {aviso.index}
          </div>
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