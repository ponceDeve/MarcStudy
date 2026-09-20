import { useState, useMemo, useEffect, useRef } from "react";
import manifest from "../data/manifest.json";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  buscarConPuntaje,
  buscarCoincidencia,
  buscarPosicion,
  extraerFragmento,
  puntajeDeTexto
} from "../lib/buscador";
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
function ResaltarFragmento({ fragmento, indice, largoCoincidencia }) {
  if (indice == null || indice < 0) return fragmento;
  const antes = fragmento.slice(0, indice);
  const coincidencia = fragmento.slice(
    indice,
    indice + largoCoincidencia
  );
  const despues = fragmento.slice(
    indice + largoCoincidencia
  );
  if (!coincidencia) return fragmento;
  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}
function armarFragmentoExplicacion(explicacion, query) {
  const indiceOriginal = buscarPosicion(explicacion, query);
  const fragmento = extraerFragmento(explicacion, indiceOriginal);
  if (indiceOriginal == null) {
    return { fragmento, indice: null, largo: 0 };
  }
  const queryLimpia = query.trim();
  const indiceEnFragmento = buscarPosicion(
    fragmento,
    queryLimpia
  );
  return {
    fragmento,
    indice: indiceEnFragmento,
    largo: queryLimpia.length
  };
}
function buscarEnContenidoTema(contenidoTema, query) {
  const q = query.trim();
  if (!q || contenidoTema.length === 0) return [];
  const resultados = [];
  for (const punto of contenidoTema) {
    const matchTexto = buscarCoincidencia(
      punto.texto,
      q
    );
    if (matchTexto) {
      resultados.push({
        type: "contenido",
        puntoId: punto.id,
        seccionTitulo: punto.seccionTitulo,
        campo: "texto",
        texto: punto.texto,
        matchText: q,
        _score:
          puntajeDeTexto(punto.texto, q) + 500
      });
      continue;
    }
    const matchExplicacion = buscarCoincidencia(
      punto.explicacion,
      q
    );
    if (matchExplicacion) {
      resultados.push({
        type: "contenido",
        puntoId: punto.id,
        seccionTitulo: punto.seccionTitulo,
        campo: "explicacion",
        texto: punto.texto,
        explicacion: punto.explicacion,
        matchText: q,
        _score: puntajeDeTexto(
          punto.explicacion,
          q
        )
      });
    }
  }
  return resultados.sort(
    (a, b) => b._score - a._score
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
  const temasPorCurso = new Map();
  for (const t of temas) {
    if (!temasPorCurso.has(t.curso)) {
      temasPorCurso.set(t.curso, []);
    }
    temasPorCurso.get(t.curso).push(t);
  }
  const nombresCursosFuertes = new Set(
    cursos.map((c) => c.nombre)
  );
  const grupos = cursos.map((c) => ({
    curso: c.nombre,
    temas: temasPorCurso.get(c.nombre) || []
  }));
  for (const [curso, temasDelCurso] of temasPorCurso) {
    if (nombresCursosFuertes.has(curso)) continue;
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
  onSelect,
  contenidoTema = []
}) {
  const [query, setQuery] = useState("");
  const [queryConfirmada, setQueryConfirmada] =
    useState("");
  const [inputFocused, setInputFocused] =
    useState(false);
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
  const [focusedIdx, setFocusedIdx] =
    useState(-1);
  const [
    cursosAbiertos,
    setCursosAbiertos
  ] = useState(new Set());
  const inputRef = useRef(null);
  const hayQuery =
    queryConfirmada.trim() !== "";
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
        ? buscarFuertes(queryConfirmada)
        : {
            cursos: [],
            temas: []
          },
    [queryConfirmada, hayQuery]
  );
  const resultadosContenido = useMemo(
    () =>
      hayQuery
        ? buscarEnContenidoTema(
            contenidoTema,
            queryConfirmada
          )
        : [],
    [
      queryConfirmada,
      hayQuery,
      contenidoTema
    ]
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
        if (
          elemento.type !== item.type
        ) {
          return false;
        }
        if (
          elemento.type === "curso"
        ) {
          return (
            elemento.nombre ===
            item.nombre
          );
        }
        return (
          elemento.curso ===
            item.curso &&
          elemento.tema ===
            item.tema &&
          elemento.archivo ===
            item.archivo
        );
      }
    );
  }
  function ejecutarBusqueda(item) {
    if (!item) return;
    setQuery("");
    setQueryConfirmada("");
    setInputFocused(false);
    setFocusedIdx(-1);
    setCursosAbiertos(new Set());
    onSelect(item);
    onClose();
  }
  function confirmarBusqueda() {
    setQueryConfirmada(query);
    setFocusedIdx(-1);
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
    if (
      mejorOpcion.type === "curso"
    ) {
      const cursoEncontrado =
        manifest.cursos.find(
          (curso) =>
            curso.nombre ===
            mejorOpcion.nombre
        );
      if (!cursoEncontrado) return;
      ejecutarBusqueda({
        type: "curso",
        nombre:
          cursoEncontrado.nombre
      });
      return;
    }
    ejecutarBusqueda(mejorOpcion);
  }
  function limpiarBusqueda() {
    setQuery("");
    setQueryConfirmada("");
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
      ejecutarBusqueda({
        type: "curso",
        nombre: item.nombre
      });
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
  useEffect(() => {
    setFocusedIdx(-1);
    if (!hayQuery) {
      setCursosAbiertos(new Set());
      return;
    }
    const cursosConCoincidencias =
      new Set(
        fuertes.temas.map(
          (tema) => tema.curso
        )
      );
    setCursosAbiertos(
      cursosConCoincidencias
    );
  }, [
    queryConfirmada,
    hayQuery,
    fuertes
  ]);
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setQueryConfirmada("");
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
          confirmarBusqueda();
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
        key={`${esBusqueda ? "grupo" : "grupo-inicial"}-${g.curso}-${grupoIndex}`}
        className="search-group"
      >
        <div className="search-course-row">
          <button
            type="button"
            data-search-index={cursoIndex}
            className={`search-result-item is-curso${
              cursoIndex === focusedIdx
                ? " is-focused"
                : ""
            }`}
            onClick={() =>
              ejecutarBusqueda({
                type: "curso",
                nombre: g.curso
              })
            }
          >
            <span className="curso-title">
              {esBusqueda ? (
                <ResaltarCoincidencia
                  texto={g.curso}
                  query={queryConfirmada}
                />
              ) : (
                g.curso
              )}
            </span>
          </button>
          <button
            type="button"
            className={`search-course-toggle${
              estaAbierto
                ? " is-open"
                : ""
            }`}
            aria-label={
              estaAbierto
                ? `Cerrar temas de ${g.curso}`
                : `Mostrar temas de ${g.curso}`
            }
            onClick={() =>
              manejarClickCurso(
                g.curso
              )
            }
          >
            <i
              className={`fa-solid ${
                estaAbierto
                  ? "fa-minus"
                  : "fa-plus"
              }`}
            />
          </button>
        </div>
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
                  key={`tema-${esBusqueda ? "" : "inicial-"}${t.curso}-${t.tema}-${t.archivo || ""}-${grupoIndex}-${temaIndex}`}
                  data-search-index={
                    index
                  }
                  onClick={() =>
                    ejecutarBusqueda(
                      t
                    )
                  }
                  className={`search-result-item is-tema${
                    index === focusedIdx
                      ? " is-focused"
                      : ""
                  }`}
                >
                  <p className="search-result-item__tema">
                    {esBusqueda ? (
                      <ResaltarCoincidencia
                        texto={t.tema}
                        query={
                          queryConfirmada
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
          <button
            type="button"
            className="search-input-lupa-izq"
            aria-label="Buscar"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={
              confirmarBusqueda
            }
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
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
                confirmarBusqueda();
              }
            }}
            placeholder="Buscar curso o tema..."
            className="search-input"
          />
          {query.trim() !== "" && (
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
          resultadosContenido.length >
            0 && (
            <div className="search-results">
              <div className="search-group">
                <p className="search-section-label">
                  En este tema
                </p>
                {resultadosContenido.map(
                  (r, idx) => {
                    const fragmento =
                      r.campo ===
                      "explicacion"
                        ? armarFragmentoExplicacion(
                            r.explicacion,
                            queryConfirmada
                          )
                        : null;
                    return (
                      <button
                        type="button"
                        key={`contenido-${r.puntoId}-${r.campo}-${idx}`}
                        onClick={() =>
                          ejecutarBusqueda(
                            r
                          )
                        }
                        className="search-result-item is-tema is-contenido"
                      >
                        {r.seccionTitulo && (
                          <p className="search-result-item__seccion">
                            {
                              r.seccionTitulo
                            }
                          </p>
                        )}
                        <p className="search-result-item__tema">
                          {r.campo ===
                          "texto" ? (
                            <ResaltarCoincidencia
                              texto={
                                r.texto
                              }
                              query={
                                queryConfirmada
                              }
                            />
                          ) : (
                            <ResaltarFragmento
                              fragmento={
                                fragmento.fragmento
                              }
                              indice={
                                fragmento.indice
                              }
                              largoCoincidencia={
                                fragmento.largo
                              }
                            />
                          )}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
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
          grupos.length === 0 &&
          resultadosContenido.length ===
            0 && (
            <div className="search-results">
              <div className="search-group">
                <div className="search-result-item search-no-results">
                  <p className="search-result-item__tema">
                    Sin resultados para "
                    {
                      queryConfirmada
                    }"
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