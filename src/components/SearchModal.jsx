import { useState, useMemo, useEffect, useRef } from "react";

import manifest from "../data/manifest.json";

import { useArrowKeyList } from "../hooks/useArrowKeyList";

import { useSearchHistory } from "../hooks/useSearchHistory";

import { useLocalStorage } from "../hooks/useLocalStorage";

import { buscarConPuntaje } from "../lib/buscador";

import { franjaHoraria } from "../lib/saludo";

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

/* ============================================================
   NORMALIZAR TEXTO
   ============================================================ */

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/* ============================================================
   RESALTAR COINCIDENCIA
   ============================================================ */

function ResaltarCoincidencia({ texto, query }) {
  if (!query.trim()) {
    return texto;
  }

  const textoOriginal = String(texto ?? "");
  const busqueda = query.trim();

  const textoNormalizado =
    normalizarTexto(textoOriginal);

  const busquedaNormalizada =
    normalizarTexto(busqueda);

  if (!busquedaNormalizada) {
    return textoOriginal;
  }

  const indice =
    textoNormalizado.indexOf(busquedaNormalizada);

  if (indice === -1) {
    return textoOriginal;
  }

  const antes =
    textoOriginal.slice(0, indice);

  const coincidencia =
    textoOriginal.slice(
      indice,
      indice + busqueda.length
    );

  const despues =
    textoOriginal.slice(
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

/* ============================================================
   BÚSQUEDA
   ============================================================ */

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

/* ============================================================
   AGRUPAR RESULTADOS
   ============================================================ */

function agruparResultados({ cursos, temas }) {
  const nombresCursosFuertes = new Set(
    cursos.map((c) => c.nombre)
  );

  const grupos = cursos.map((c) => {
    const cursoEncontrado =
      manifest.cursos.find(
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

/* ============================================================
   SEARCH MODAL
   ============================================================ */

export default function SearchModal({
  open,
  onClose,
  onSelect
}) {
  const [query, setQuery] = useState("");

  const [paginaHistorial, setPaginaHistorial] =
    useState(1);

  const [inputFocused, setInputFocused] =
    useState(false);

  const [nombreUsuario, setNombreUsuario] =
    useLocalStorage("miEstudio_nombreUsuario", null);
  const [fotoUsuario, setFotoUsuario] =
    useLocalStorage("miEstudio_fotoUsuario", null);

  const [editarNombreAbierto, setEditarNombreAbierto] =
    useState(false);

  const inputRef = useRef(null);

  const {
    historial,
    guardarBusqueda,
    eliminarHistorial
  } = useSearchHistory();

  const hayQuery =
    query.trim() !== "";

  const mostrarHistorial =
    inputFocused &&
    !hayQuery &&
    historial.length > 0;

  const mostrarResultados =
    hayQuery;

  /* ==========================================================
     RESULTADOS
     ========================================================== */

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

  /* ==========================================================
     ITEMS PLANOS
     ========================================================== */

  const itemsPlanos = useMemo(
    () =>
      grupos.flatMap((g) => [
        {
          type: "curso",
          nombre: g.curso
        },
        ...g.temas
      ]),
    [grupos]
  );

  /* ==========================================================
     HISTORIAL
     ========================================================== */

  const historialVisible = useMemo(() => {
    const inicio =
      (paginaHistorial - 1) *
      HISTORIAL_POR_PAGINA;

    return historial.slice(
      inicio,
      inicio + HISTORIAL_POR_PAGINA
    );
  }, [historial, paginaHistorial]);

  const hayMasHistorial =
    paginaHistorial *
      HISTORIAL_POR_PAGINA <
    historial.length;

  const hayMenosHistorial =
    paginaHistorial > 1;

  /* ==========================================================
     EJECUTAR BÚSQUEDA
     ========================================================== */

  function ejecutarBusqueda(item) {
    if (!item) return;

    guardarBusqueda(item);

    setQuery("");

    setPaginaHistorial(1);

    setInputFocused(false);

    onSelect(item);

    onClose();
  }

  /* ==========================================================
     EJECUTAR BÚSQUEDA ACTUAL
     ========================================================== */

  function ejecutarBusquedaActual() {
    if (!hayQuery) return;

    const mejorOpcion =
      fuertes.cursos[0] ||
      fuertes.temas[0];

    if (mejorOpcion) {
      ejecutarBusqueda(mejorOpcion);
    }
  }

  /* ==========================================================
     ELIMINAR HISTORIAL
     ========================================================== */

  function eliminarTodasLasBusquedas() {
    eliminarHistorial();

    setPaginaHistorial(1);
  }

  /* ==========================================================
     LIMPIAR BÚSQUEDA
     ========================================================== */

  function limpiarBusqueda() {
    setQuery("");

    setPaginaHistorial(1);
  }

  /* ==========================================================
     NAVEGACIÓN CON FLECHAS
     ========================================================== */

  const {
    focusedIdx,
    handleKeyDown
  } = useArrowKeyList(
    itemsPlanos,
    ejecutarBusqueda
  );

  /* ==========================================================
     FOCUS
     ========================================================== */

  useEffect(() => {
    if (!open) return;

    setPaginaHistorial(1);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [open]);

  /* ==========================================================
     ESC
     ========================================================== */

  useEffect(() => {
    if (!open) return;

    function onEsc(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      onEsc
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onEsc
      );
    };
  }, [open, onClose]);

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className={`search-overlay ${
        open ? "" : "is-closed"
      }`}

      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}

      aria-hidden={!open}
    >
      <div className="search-box">

        {/* ==================================================
            SALUDO (portada, antes de escribir)
            ================================================== */}

        {!hayQuery && (
          <p className="search-saludo">
            {franjaHoraria()}
            {nombreUsuario && ", "}
            {nombreUsuario && (
              <span className="search-saludo__nombre">
                {nombreUsuario}
              </span>
            )}
          </p>
        )}

        {/* ==================================================
            INPUT
            ================================================== */}

        <div
          className={`search-input-row${
            hayQuery || mostrarHistorial
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
            }}

            onBlur={() => {
              setTimeout(() => {
                setInputFocused(false);
              }, 100);
            }}

            onChange={(e) => {
              setQuery(e.target.value);
              setPaginaHistorial(1);
            }}

            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                if (
                  hayQuery &&
                  focusedIdx <= 0
                ) {
                  ejecutarBusquedaActual();
                  return;
                }
              }

              handleKeyDown(e);
            }}

            placeholder="Buscar curso o tema..."

            className="search-input"
          />

          {/* ==================================================
              LIMPIAR
              ================================================== */}

          {hayQuery && (
            <button
              type="button"
              className="search-input-clear"

              aria-label="Limpiar búsqueda"

              onMouseDown={(e) => {
                e.preventDefault();
              }}

              onClick={limpiarBusqueda}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}

          {/* ==================================================
              LUPA
              ================================================== */}

          <button
            type="button"
            className="search-input-lupa"

            aria-label="Buscar"

            onMouseDown={(e) => {
              e.preventDefault();
            }}

            onClick={ejecutarBusquedaActual}
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>

        {/* ==================================================
            HISTORIAL
            ================================================== */}

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
                  <button
                    type="button"
                    key={historialKey}

                    className="search-history-item"

                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}

                    onClick={() => {
                      ejecutarBusqueda(item);
                    }}
                  >
                    <i className="fa-solid fa-clock-rotate-left" />

                    <span>
                      {texto}
                    </span>
                  </button>
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

        {/* ==================================================
            RESULTADOS
            ================================================== */}

        {mostrarResultados &&
          grupos.length > 0 && (
            <div className="search-results">

              {(() => {
                let idx = -1;

                return grupos.map(
                  (g, grupoIndex) => {
                    const idxCurso =
                      ++idx;

                    return (
                      <div
                        key={`grupo-${g.curso}-${grupoIndex}`}
                        className="search-group"
                      >

                        {/* CURSO */}

                        <button
                          type="button"

                          onClick={() =>
                            ejecutarBusqueda({
                              type: "curso",
                              nombre: g.curso
                            })
                          }

                          className={`search-result-item is-curso${
                            idxCurso ===
                            focusedIdx
                              ? " is-focused"
                              : ""
                          }`}
                        >
                          <span className="curso-title">
                            {g.curso}
                          </span>
                        </button>

                        {/* TEMAS */}

                        {g.temas.map(
                          (
                            t,
                            temaIndex
                          ) => {
                            const idxTema =
                              ++idx;

                            return (
                              <button
                                type="button"

                                key={`tema-${t.curso}-${t.tema}-${t.archivo || ""}-${grupoIndex}-${temaIndex}`}

                                onClick={() =>
                                  ejecutarBusqueda(t)
                                }

                                className={`search-result-item is-tema${
                                  idxTema ===
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
                    );
                  }
                );
              })()}

            </div>
          )}

        {/* ==================================================
            SIN RESULTADOS
            MISMA CAJA QUE UNA SUGERENCIA
            ================================================== */}

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
        onCancelar={() => setEditarNombreAbierto(false)}
      />
    </div>
  );
}