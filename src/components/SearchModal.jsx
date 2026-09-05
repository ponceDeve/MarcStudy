import { useState, useMemo, useEffect, useRef } from "react";
import manifest from "../data/manifest.json";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { buscarConPuntaje } from "../lib/buscador";
import EditarNombreModal from "./EditarNombreModal";

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

  if (!busquedaNormalizada) return textoOriginal;

  const indice = textoNormalizado.indexOf(busquedaNormalizada);

  if (indice === -1) return textoOriginal;

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
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}

function buscarFuertes(query) {
  const cursos = buscarConPuntaje(
    CURSOS_ITEMS,
    query,
    (c) => c.nombre,
    { minScore: 400 }
  );

  const temas = buscarConPuntaje(
    TEMAS_ITEMS,
    query,
    (t) => t.tema,
    { minScore: 400 }
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
    if (nombresCursosFuertes.has(t.curso)) continue;

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

function construirItemsNavegables(
  grupos,
  cursosAbiertos
) {
  const items = [];

  for (const grupo of grupos) {
    items.push({
      type: "curso",
      nombre: grupo.curso
    });

    if (!cursosAbiertos.has(grupo.curso)) {
      continue;
    }

    for (const tema of grupo.temas) {
      items.push({
        type: "tema",
        curso: tema.curso,
        tema: tema.tema,
        archivo: tema.archivo
      });
    }
  }

  return items;
}

export default function SearchModal({
  open,
  onClose,
  onSelect
}) {
  const [query, setQuery] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  const [
    editarNombreAbierto,
    setEditarNombreAbierto
  ] = useState(false);

  const [
    nombreUsuario,
    setNombreUsuario
  ] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const [
    fotoUsuario,
    setFotoUsuario
  ] = useLocalStorage(
    "miEstudio_fotoUsuario",
    null
  );

  const [focusedIdx, setFocusedIdx] = useState(-1);

  const [
    cursosAbiertos,
    setCursosAbiertos
  ] = useState(new Set());

  const inputRef = useRef(null);

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
    open && !hayQuery;

  const mostrarResultados =
    open && hayQuery;

  const contenidoExpandido =
    mostrarListaInicial ||
    mostrarResultados;

  const gruposVisibles = useMemo(
    () =>
      hayQuery
        ? grupos
        : gruposIniciales,
    [
      hayQuery,
      grupos,
      gruposIniciales
    ]
  );

  const itemsNavegables = useMemo(
    () =>
      construirItemsNavegables(
        gruposVisibles,
        cursosAbiertos
      ),
    [
      gruposVisibles,
      cursosAbiertos
    ]
  );

  function obtenerIndiceElemento(item) {
    return itemsNavegables.findIndex(
      (elemento) => {
        if (elemento.type !== item.type) {
          return false;
        }

        if (elemento.type === "curso") {
          return (
            elemento.nombre === item.nombre
          );
        }

        return (
          elemento.curso === item.curso &&
          elemento.tema === item.tema &&
          elemento.archivo === item.archivo
        );
      }
    );
  }

  function ejecutarBusqueda(item) {
    if (!item) return;

    setQuery("");
    setInputFocused(false);
    setFocusedIdx(-1);
    setCursosAbiertos(new Set());

    onSelect(item);
    onClose();
  }

  function manejarClickCurso(curso) {
    setCursosAbiertos((actuales) => {
      const nuevos = new Set(actuales);

      if (nuevos.has(curso)) {
        nuevos.delete(curso);
      } else {
        nuevos.add(curso);
      }

      return nuevos;
    });
  }

  function ejecutarBusquedaActual() {
    if (!hayQuery) return;

    const mejorOpcion =
      fuertes.cursos[0] ||
      fuertes.temas[0];

    if (!mejorOpcion) return;

    if (mejorOpcion.type === "curso") {
      const cursoEncontrado =
        manifest.cursos.find(
          (curso) =>
            curso.nombre ===
            mejorOpcion.nombre
        );

      if (!cursoEncontrado) return;

      ejecutarBusqueda({
        type: "curso",
        nombre: cursoEncontrado.nombre
      });

      return;
    }

    ejecutarBusqueda(mejorOpcion);
  }

  function limpiarBusqueda() {
    setQuery("");
    setFocusedIdx(-1);
    setCursosAbiertos(new Set());

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function moverSeleccion(direccion) {
    if (!open) return;

    const total =
      itemsNavegables.length;

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
      focusedIdx >=
        itemsNavegables.length
    ) {
      return;
    }

    const item =
      itemsNavegables[focusedIdx];

    if (item.type === "curso") {
      manejarClickCurso(
        item.nombre
      );

      return;
    }

    ejecutarBusqueda(item);
  }

  useEffect(() => {
    if (focusedIdx < 0) return;

    const elemento =
      document.querySelector(
        `[data-search-index="${focusedIdx}"]`
      );

    if (!elemento) return;

    elemento.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [
    focusedIdx,
    itemsNavegables
  ]);

  /*
   * Cuando cambia la búsqueda:
   *
   * - Si no hay búsqueda, cerramos todos.
   * - Si hay coincidencias de temas, abrimos TODOS
   *   los cursos que contienen esas coincidencias.
   * - Si el curso ya es una coincidencia fuerte por
   *   su propio nombre, no lo abrimos automáticamente.
   */
  useEffect(() => {
    setFocusedIdx(-1);

    if (!hayQuery) {
      setCursosAbiertos(new Set());
      return;
    }

    const cursosConCoincidencias =
      new Set(
        fuertes.temas
          .filter(
            (tema) =>
              !fuertes.cursos.some(
                (curso) =>
                  curso.nombre ===
                  tema.curso
              )
          )
          .map(
            (tema) => tema.curso
          )
      );

    setCursosAbiertos(
      cursosConCoincidencias
    );
  }, [
    query,
    hayQuery,
    fuertes
  ]);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setInputFocused(true);
    setFocusedIdx(-1);
    setCursosAbiertos(new Set());

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
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
    (
      mostrarResultados &&
      grupos.length > 0
    );

  function renderGrupo(
    g,
    grupoIndex,
    esBusqueda = false
  ) {
    const cursoIndex =
      obtenerIndiceElemento({
        type: "curso",
        nombre: g.curso
      });

    const estaAbierto =
      cursosAbiertos.has(g.curso);

    return (
      <div
        key={`${
          esBusqueda
            ? "grupo"
            : "grupo-inicial"
        }-${g.curso}-${grupoIndex}`}
        className="search-group"
      >
        <button
          type="button"
          data-search-index={
            cursoIndex
          }
          className={`search-result-item is-curso${
            cursoIndex === focusedIdx
              ? " is-focused"
              : ""
          }${
            estaAbierto
              ? " is-open"
              : ""
          }`}
          onClick={() =>
            manejarClickCurso(
              g.curso
            )
          }
        >
          <span className="curso-title">
            {esBusqueda ? (
              <ResaltarCoincidencia
                texto={g.curso}
                query={query}
              />
            ) : (
              g.curso
            )}
          </span>

          <i
            className={`fa-solid fa-chevron-down search-course-chevron${
              estaAbierto
                ? " is-open"
                : ""
            }`}
          />
        </button>

        <div
          className={`search-group__temas${
            estaAbierto
              ? " is-open"
              : ""
          }`}
        >
          {g.temas.map(
            (t, temaIndex) => {
              const index =
                obtenerIndiceElemento(
                  t
                );

              return (
                <button
                  type="button"
                  key={`tema-${
                    esBusqueda
                      ? ""
                      : "inicial-"
                  }${t.curso}-${
                    t.tema
                  }-${
                    t.archivo || ""
                  }-${grupoIndex}-${temaIndex}`}
                  data-search-index={
                    index
                  }
                  onClick={() =>
                    ejecutarBusqueda(
                      t
                    )
                  }
                  className={`search-result-item is-tema${
                    index ===
                    focusedIdx
                      ? " is-focused"
                      : ""
                  }`}
                >
                  <p className="search-result-item__tema">
                    {esBusqueda ? (
                      <ResaltarCoincidencia
                        texto={t.tema}
                        query={
                          query
                        }
                      />
                    ) : (
                      t.tema
                    )}
                  </p>
                </button>
              );
            }
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`search-overlay${
        open
          ? ""
          : " is-closed"
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
            onFocus={() =>
              setInputFocused(
                true
              )
            }
            onBlur={() => {
              setTimeout(() => {
                setInputFocused(
                  false
                );
              }, 100);
            }}
            onChange={(e) => {
              setQuery(
                e.target.value
              );

              setFocusedIdx(-1);
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Escape"
              ) {
                e.preventDefault();
                e.stopPropagation();

                onClose();

                return;
              }

              if (
                e.key ===
                "ArrowDown"
              ) {
                e.preventDefault();
                e.stopPropagation();

                moverSeleccion(1);

                return;
              }

              if (
                e.key ===
                "ArrowUp"
              ) {
                e.preventDefault();
                e.stopPropagation();

                moverSeleccion(-1);

                return;
              }

              if (
                e.key ===
                "Enter"
              ) {
                e.preventDefault();
                e.stopPropagation();

                if (
                  focusedIdx >=
                    0 &&
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
              onClick={
                limpiarBusqueda
              }
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {mostrarListaInicial && (
          <div className="search-results">
            {gruposIniciales.map(
              (g, grupoIndex) =>
                renderGrupo(
                  g,
                  grupoIndex
                )
            )}
          </div>
        )}

        {mostrarResultados &&
          grupos.length > 0 && (
            <div className="search-results">
              {grupos.map(
                (g, grupoIndex) =>
                  renderGrupo(
                    g,
                    grupoIndex,
                    true
                  )
              )}
            </div>
          )}

        {mostrarResultados &&
          grupos.length === 0 && (
            <div className="search-results">
              <div className="search-group">
                <div className="search-result-item search-no-results">
                  <p className="search-result-item__tema">
                    Sin resultados para "
                    {query}"
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      <EditarNombreModal
        open={
          editarNombreAbierto
        }
        nombreActual={
          nombreUsuario
        }
        fotoActual={
          fotoUsuario
        }
        onGuardar={(n, f) => {
          setNombreUsuario(n);
          setFotoUsuario(f);
          setEditarNombreAbierto(
            false
          );
        }}
        onCancelar={() =>
          setEditarNombreAbierto(
            false
          )
        }
      />
    </div>
  );
}