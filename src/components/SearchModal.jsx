import { useState, useMemo, useEffect, useRef } from "react";
import manifest from "../data/manifest.json";
import { useSearchHistory } from "../hooks/useSearchHistory";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { buscarConPuntaje } from "../lib/buscador";
import EditarNombreModal from "./EditarNombreModal";

const HISTORIAL_POR_PAGINA = 5;

const CURSOS_ITEMS = manifest.cursos.map((c) => ({
  type: "curso",
  nombre: c.nombre
}));

const TEMAS_ITEMS = manifest.cursos.flatMap((c) =>
  c.temas.map((t) => ({
    type: "tema",
    curso: c.nombre,
    tema: t.tema,
    archivo: t.archivo
  }))
);

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ResaltarCoincidencia({ texto, query }) {
  if (!query.trim()) return texto;

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
  const coincidencia = textoOriginal.slice(
    indice,
    indice + busqueda.length
  );
  const despues = textoOriginal.slice(
    indice + busqueda.length
  );

  return (
    <>
      {antes}
      <span className="search-match">
        {coincidencia}
      </span>
      {despues}
    </>
  );
}

function buscarFuertes(query) {
  const cursos = buscarConPuntaje(
    CURSOS_ITEMS,
    query,
    (c) => c.nombre,
    {
      minScore: 400
    }
  );

  const temas = buscarConPuntaje(
    TEMAS_ITEMS,
    query,
    (t) => t.tema,
    {
      minScore: 400
    }
  );

  return {
    cursos,
    temas
  };
}

function agruparResultados({ cursos, temas }) {
  const nombresCursosFuertes = new Set(
    cursos.map((c) => c.nombre)
  );

  const grupos = cursos.map((c) => {
    const cursoEncontrado = manifest.cursos.find(
      (x) => x.nombre === c.nombre
    );

    return {
      curso: c.nombre,
      temas: cursoEncontrado
        ? cursoEncontrado.temas.map((t) => ({
            type: "tema",
            curso: c.nombre,
            tema: t.tema,
            archivo: t.archivo
          }))
        : []
    };
  });

  const temasPorCurso = new Map();

  for (const t of temas) {
    if (nombresCursosFuertes.has(t.curso)) {
      continue;
    }

    if (!temasPorCurso.has(t.curso)) {
      temasPorCurso.set(t.curso, []);
    }

    temasPorCurso.get(t.curso).push(t);
  }

  for (const [curso, temasDelCurso] of temasPorCurso) {
    grupos.push({
      curso,
      temas: temasDelCurso
    });
  }

  return grupos;
}

export default function SearchModal({
  open,
  onClose,
  onSelect
}) {
  const [query, setQuery] = useState("");
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [inputFocused, setInputFocused] = useState(false);

  const [nombreUsuario, setNombreUsuario] =
    useLocalStorage(
      "miEstudio_nombreUsuario",
      null
    );

  const [fotoUsuario, setFotoUsuario] =
    useLocalStorage(
      "miEstudio_fotoUsuario",
      null
    );

  const [editarNombreAbierto, setEditarNombreAbierto] =
    useState(false);

  const [focusedIdx, setFocusedIdx] = useState(-1);

  const inputRef = useRef(null);

  const {
    historial,
    guardarBusqueda,
    eliminarHistorial,
    eliminarBusqueda
  } = useSearchHistory();

  const hayQuery = query.trim() !== "";

  const gruposIniciales = useMemo(() => {
    return manifest.cursos.map((curso) => ({
      curso: curso.nombre,
      temas: curso.temas.map((tema) => ({
        type: "tema",
        curso: curso.nombre,
        tema: tema.tema,
        archivo: tema.archivo
      }))
    }));
  }, []);

  const fuertes = useMemo(
    () =>
      hayQuery
        ? buscarFuertes(query)
        : {
            cursos: [],
            temas: []
          },
    [query, hayQuery]
  );

  const grupos = useMemo(
    () => agruparResultados(fuertes),
    [fuertes]
  );

  const mostrarListaInicial =
    open &&
    !hayQuery &&
    !inputFocused;

  const mostrarHistorial =
    open &&
    inputFocused &&
    !hayQuery &&
    historial.length > 0;

  const mostrarResultados =
    open &&
    hayQuery;

  const contenidoExpandido =
    mostrarListaInicial ||
    mostrarHistorial ||
    mostrarResultados ||
    (inputFocused &&
      hayQuery &&
      grupos.length === 0);

  const temasIniciales = useMemo(() => {
    return gruposIniciales.flatMap(
      (grupo) => grupo.temas
    );
  }, [gruposIniciales]);

  const temasResultados = useMemo(() => {
    return grupos.flatMap(
      (grupo) => grupo.temas
    );
  }, [grupos]);

  const historialVisible = useMemo(() => {
    const inicio =
      (paginaHistorial - 1) *
      HISTORIAL_POR_PAGINA;

    return historial.slice(
      inicio,
      inicio + HISTORIAL_POR_PAGINA
    );
  }, [
    historial,
    paginaHistorial
  ]);

  const hayMasHistorial =
    paginaHistorial *
      HISTORIAL_POR_PAGINA <
    historial.length;

  const hayMenosHistorial =
    paginaHistorial > 1;

  const itemsNavegables = useMemo(() => {
    if (hayQuery) {
      return temasResultados;
    }

    if (inputFocused) {
      return historialVisible;
    }

    return temasIniciales;
  }, [
    hayQuery,
    inputFocused,
    historialVisible,
    temasResultados,
    temasIniciales
  ]);

  function ejecutarBusqueda(item) {
    if (!item) return;

    guardarBusqueda(item);

    setQuery("");
    setPaginaHistorial(1);
    setInputFocused(false);
    setFocusedIdx(-1);

    onSelect(item);
    onClose();
  }

  function ejecutarBusquedaActual() {
    if (!hayQuery) return;

    const mejorOpcion =
      fuertes.cursos[0] ||
      fuertes.temas[0];

    if (mejorOpcion) {
      ejecutarBusqueda(mejorOpcion);
    }
  }

  function eliminarUnaBusqueda(e, item) {
    e.preventDefault();
    e.stopPropagation();

    eliminarBusqueda(item);

    setFocusedIdx(-1);

    const historialRestante =
      historial.length - 1;

    const maxPagina = Math.max(
      1,
      Math.ceil(
        historialRestante /
          HISTORIAL_POR_PAGINA
      )
    );

    setPaginaHistorial((actual) =>
      Math.min(actual, maxPagina)
    );
  }

  function eliminarTodasLasBusquedas() {
    eliminarHistorial();
    setPaginaHistorial(1);
    setFocusedIdx(-1);
  }

  function limpiarBusqueda() {
    setQuery("");
    setPaginaHistorial(1);
    setFocusedIdx(-1);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function moverSeleccion(direccion) {
    if (!open) return;

    const total = itemsNavegables.length;

    if (!total) {
      setFocusedIdx(-1);
      return;
    }

    setFocusedIdx((actual) => {
      if (actual === -1) {
        return direccion > 0
          ? 0
          : total - 1;
      }

      const siguiente =
        actual + direccion;

      if (siguiente < 0) {
        return 0;
      }

      if (siguiente >= total) {
        return total - 1;
      }

      return siguiente;
    });
  }

  function seleccionarElementoActual() {
    if (
      focusedIdx < 0 ||
      focusedIdx >= itemsNavegables.length
    ) {
      return;
    }

    ejecutarBusqueda(
      itemsNavegables[focusedIdx]
    );
  }

  useEffect(() => {
    if (focusedIdx < 0) {
      return;
    }

    const elemento =
      document.querySelector(
        `[data-search-index="${focusedIdx}"]`
      );

    if (!elemento) {
      return;
    }

    elemento.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [
    focusedIdx,
    itemsNavegables
  ]);

  useEffect(() => {
    setFocusedIdx(-1);
  }, [
    query,
    paginaHistorial
  ]);

  useEffect(() => {
    if (!open) return;

    setPaginaHistorial(1);
    setQuery("");
    setInputFocused(false);
    setFocusedIdx(-1);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (
        document.activeElement ===
        inputRef.current
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        moverSeleccion(1);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        moverSeleccion(-1);
        return;
      }

      if (e.key === "Enter") {
        if (
          focusedIdx >= 0 &&
          focusedIdx <
            itemsNavegables.length
        ) {
          e.preventDefault();
          e.stopPropagation();
          seleccionarElementoActual();
          return;
        }

        if (hayQuery) {
          e.preventDefault();
          e.stopPropagation();
          ejecutarBusquedaActual();
        }
      }
    }

    document.addEventListener(
      "keydown",
      onKeyDown,
      true
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown,
        true
      );
    };
  }, [
    open,
    onClose,
    focusedIdx,
    itemsNavegables,
    hayQuery
  ]);

  const inputTieneLista =
    mostrarListaInicial ||
    mostrarHistorial ||
    (mostrarResultados &&
      grupos.length > 0);

  return (
    <div
      className={`search-overlay${
        open ? "" : " is-closed"
      }`}
      onClick={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          onClose();
        }
      }}
      aria-hidden={!open}
    >
      <div
        className={`search-box${
          contenidoExpandido
            ? " is-expanded"
            : ""
        }`}
      >
        <div
          className={`search-input-row${
            inputTieneLista
              ? " has-query"
              : ""
          }`}
        >
          <input
            autoComplete="off"
            type="search"
            name="buscar-curso-tema"
            ref={inputRef}
            value={query}
            onFocus={() => {
              setInputFocused(true);
              setFocusedIdx(-1);
            }}
            onBlur={() => {
              setTimeout(() => {
                setInputFocused(false);
              }, 100);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setPaginaHistorial(1);
              setFocusedIdx(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
              }

              if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                moverSeleccion(1);
                return;
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                moverSeleccion(-1);
                return;
              }

              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();

                if (
                  focusedIdx >= 0 &&
                  focusedIdx <
                    itemsNavegables.length
                ) {
                  seleccionarElementoActual();
                  return;
                }

                if (hayQuery) {
                  ejecutarBusquedaActual();
                }
              }
            }}
            placeholder="Buscar curso o tema..."
            className="search-input"
          />

          {hayQuery && (
            <button
              type="button"
              className="search-input-clear"
              aria-label="Limpiar búsqueda"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={limpiarBusqueda}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}

          <button
            type="button"
            className="search-input-lupa"
            aria-label="Buscar"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={
              ejecutarBusquedaActual
            }
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>

        {mostrarHistorial && (
          <div className="search-history">
            {historialVisible.map(
              (item, index) => {
                const texto =
                  item.type === "curso"
                    ? item.nombre
                    : item.tema;

                const historialKey =
                  item.type === "curso"
                    ? `curso-${item.nombre}-${index}`
                    : `tema-${item.curso || ""}-${item.tema || ""}-${item.archivo || ""}-${index}`;

                return (
                  <div
                    key={historialKey}
                    className={`search-history-item${
                      index === focusedIdx
                        ? " is-focused"
                        : ""
                    }`}
                    data-search-index={index}
                  >
                    <button
                      type="button"
                      className="search-history-select"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        ejecutarBusqueda(item);
                      }}
                    >
                      <i className="fa-solid fa-clock-rotate-left" />

                      <span className="search-history-text">
                        {texto}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="search-history-delete"
                      aria-label={`Eliminar ${texto} del historial`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        eliminarUnaBusqueda(
                          e,
                          item
                        );
                      }}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                );
              }
            )}

            <div className="search-history-actions">
              {hayMenosHistorial && (
                <button
                  type="button"
                  className="search-history-action"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setPaginaHistorial(
                      (actual) =>
                        Math.max(
                          1,
                          actual - 1
                        )
                    );
                  }}
                >
                  <i className="fa-solid fa-chevron-up" />
                  Mostrar -
                </button>
              )}

              {hayMasHistorial && (
                <button
                  type="button"
                  className="search-history-action"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setPaginaHistorial(
                      (actual) =>
                        actual + 1
                    );
                  }}
                >
                  <i className="fa-solid fa-chevron-down" />
                  Mostrar +
                </button>
              )}

              <button
                type="button"
                className="search-history-action search-history-action--delete"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={
                  eliminarTodasLasBusquedas
                }
              >
                <i className="fa-solid fa-trash" />
                Eliminar
              </button>
            </div>
          </div>
        )}

        {mostrarListaInicial && (
          <div className="search-results">
            {gruposIniciales.map(
              (g, grupoIndex) => (
                <div
                  key={`grupo-inicial-${g.curso}-${grupoIndex}`}
                  className="search-group"
                >
                  <div className="search-result-item is-curso">
                    <span className="curso-title">
                      {g.curso}
                    </span>
                  </div>

                  {g.temas.map(
                    (t, temaIndex) => {
                      const index =
                        temasIniciales.findIndex(
                          (item) =>
                            item.curso ===
                              t.curso &&
                            item.tema ===
                              t.tema &&
                            item.archivo ===
                              t.archivo
                        );

                      return (
                        <button
                          type="button"
                          key={`tema-inicial-${t.curso}-${t.tema}-${t.archivo || ""}-${grupoIndex}-${temaIndex}`}
                          data-search-index={
                            index
                          }
                          onClick={() =>
                            ejecutarBusqueda(t)
                          }
                          className={`search-result-item is-tema${
                            index ===
                            focusedIdx
                              ? " is-focused"
                              : ""
                          }`}
                        >
                          <p className="search-result-item__tema">
                            {t.tema}
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              )
            )}
          </div>
        )}

        {mostrarResultados &&
          grupos.length > 0 && (
            <div className="search-results">
              {grupos.map(
                (g, grupoIndex) => (
                  <div
                    key={`grupo-${g.curso}-${grupoIndex}`}
                    className="search-group"
                  >
                    <div className="search-result-item is-curso">
                      <span className="curso-title">
                        {g.curso}
                      </span>
                    </div>

                    {g.temas.map(
                      (t, temaIndex) => {
                        const index =
                          temasResultados.findIndex(
                            (item) =>
                              item.curso ===
                                t.curso &&
                              item.tema ===
                                t.tema &&
                              item.archivo ===
                                t.archivo
                          );

                        return (
                          <button
                            type="button"
                            key={`tema-${t.curso}-${t.tema}-${t.archivo || ""}-${grupoIndex}-${temaIndex}`}
                            data-search-index={
                              index
                            }
                            onClick={() =>
                              ejecutarBusqueda(t)
                            }
                            className={`search-result-item is-tema${
                              index ===
                              focusedIdx
                                ? " is-focused"
                                : ""
                            }`}
                          >
                            <p className="search-result-item__tema">
                              <ResaltarCoincidencia
                                texto={t.tema}
                                query={query}
                              />
                            </p>
                          </button>
                        );
                      }
                    )}
                  </div>
                )
              )}
            </div>
          )}

        {inputFocused &&
          hayQuery &&
          grupos.length === 0 && (
            <div className="search-results">
              <div className="search-group">
                <div className="search-result-item search-no-results">
                  <p className="search-result-item__tema">
                    Sin resultados para "{query}"
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      <EditarNombreModal
        open={editarNombreAbierto}
        nombreActual={nombreUsuario}
        fotoActual={fotoUsuario}
        onGuardar={(n, f) => {
          setNombreUsuario(n);
          setFotoUsuario(f);
          setEditarNombreAbierto(false);
        }}
        onCancelar={() =>
          setEditarNombreAbierto(false)
        }
      />
    </div>
  );
}