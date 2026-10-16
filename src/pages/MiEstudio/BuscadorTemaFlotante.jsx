// Lupa flotante para las secciones donde no hay un tema abierto.
// Flujo: 1) elegir curso  2) elegir tema  3) buscar dentro del tema.
import { useEffect, useMemo, useState } from "react";
import manifest from "../../data/manifest.json";
import TheorySearchBar from "./TheorySearchBar";
import { filtrarLiteral, sugerirParecido } from "../../lib/buscarNombres";

const CURSOS = manifest.cursos;
const VISIBLES_POR_DEFECTO = 3;

const TEXTO_PASO = {
  curso: "Busca entre los cursos disponibles",
  tema: "Busca entre los temas de este curso",
  busqueda: "Escribe lo que buscas dentro de este tema"
};

export default function BuscadorTemaFlotante({ cargarPuntos, onAbrirTema }) {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState("curso");
  const [curso, setCurso] = useState(null);
  const [temaElegido, setTemaElegido] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [query, setQuery] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [encontrados, setEncontrados] = useState([]);

  const temasDelCurso = useMemo(
    () =>
      curso
        ? curso.temas.map((t) => ({
            curso: curso.nombre,
            tema: t.tema,
            archivo: t.archivo
          }))
        : [],
    [curso]
  );

  const items = paso === "curso" ? CURSOS : temasDelCurso;
  const q = query.trim();

  useEffect(() => {
    if (paso === "busqueda") return undefined;
    const nombreDe = paso === "curso" ? (c) => c.nombre : (t) => t.tema;
    if (!q) {
      setEncontrados([]);
      return undefined;
    }
    // Solo coincidencias reales (por palabras o con errores de tipeo leves).
    // Sin sugerencias semánticas: un resultado sin relación confunde más
    // que ayuda; si no hay nada, se muestra "No hay este curso/tema".
    setEncontrados(filtrarLiteral(items, q, nombreDe));
  }, [q, paso, items]);

  const nombreDeActual =
    paso === "curso" ? (c) => c.nombre : (t) => t.tema;
  const sugerencia =
    q && paso !== "busqueda"
      ? sugerirParecido(items, q, nombreDeActual)
      : null;

  const listaVisible = q
    ? encontrados
    : paso === "curso" && mostrarTodos
      ? CURSOS
      : items.slice(0, VISIBLES_POR_DEFECTO);

  function reiniciar() {
    setPaso("curso");
    setCurso(null);
    setTemaElegido(null);
    setPuntos([]);
    setQuery("");
    setMostrarTodos(false);
    setEncontrados([]);
    setCargando(false);
  }

  function cerrar() {
    setAbierto(false);
    reiniciar();
  }

  function volverPaso() {
    if (paso === "busqueda") {
      setPuntos([]);
      setTemaElegido(null);
      setPaso("tema");
    } else if (paso === "tema") {
      setCurso(null);
      setPaso("curso");
    }
    setQuery("");
    setMostrarTodos(false);
    setEncontrados([]);
  }

  function elegirCurso(c) {
    setCurso(c);
    setQuery("");
    setMostrarTodos(false);
    setEncontrados([]);
    setPaso("tema");
  }

  async function elegirTema(t) {
    setCargando(true);
    setTemaElegido(t);
    try {
      const p = await cargarPuntos(t);
      setPuntos(p);
      setPaso("busqueda");
    } catch {
      setTemaElegido(null);
    } finally {
      setCargando(false);
    }
  }

  function elegirPrimero() {
    if (listaVisible.length === 0) return;
    if (paso === "curso") elegirCurso(listaVisible[0]);
    else elegirTema(listaVisible[0]);
  }

  function abrirTemaDesdeBusqueda() {
    const tema = temaElegido;
    cerrar();
    if (tema) onAbrirTema(tema);
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="teoria-buscador-flotante"
        onClick={() => setAbierto(true)}
        aria-label="Abrir buscador"
        title="Abrir buscador"
      >
        <i className="fa-solid fa-robot" />
      </button>
    );
  }

  const titulo =
    paso === "busqueda"
      ? temaElegido?.tema
      : paso === "tema"
        ? curso?.nombre
        : "Buscar";

  return (
    <div className="teoria-chat" role="dialog" aria-label="Buscar">
      <div className="teoria-chat__head">
        {paso !== "curso" && (
          <button
            type="button"
            className="teoria-chat__close"
            onClick={volverPaso}
            aria-label="Volver"
            title="Volver"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
        )}
        <span className="teoria-chat__title">{titulo}</span>
        <button
          type="button"
          className="teoria-chat__close"
          onClick={cerrar}
          aria-label="Cerrar buscador"
          title="Cerrar"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <div className="teoria-chat__body">
        {paso === "busqueda" ? (
          <TheorySearchBar
            modoChat
            encabezado={
              <p className="buscador-flotante__hint">{TEXTO_PASO[paso]}</p>
            }
            flatPuntos={puntos}
            placeholder="Escribe aquí"
            onSelect={abrirTemaDesdeBusqueda}
          />
        ) : (
          <div className="theory-search theory-search--chat">
            <div className="theory-search__mensajes">
              <p className="buscador-flotante__hint">{TEXTO_PASO[paso]}</p>
              {q && listaVisible.length === 0 && !sugerencia && (
                <div className="theory-search__burbuja">
                  {paso === "curso"
                    ? "No hay este curso. Intenta con otro curso."
                    : "No hay este tema. Intenta con otro tema."}
                </div>
              )}
              {q && listaVisible.length === 0 && sugerencia && (
                <div className="theory-search__sugerencias">
                  <span className="theory-search__sugerencia theory-search__sugerencia--secundaria">
                    ¿Quisiste decir?
                  </span>
                  <button
                    type="button"
                    className="theory-search__sugerencia"
                    onClick={() =>
                      paso === "curso"
                        ? elegirCurso(sugerencia)
                        : elegirTema(sugerencia)
                    }
                  >
                    {paso === "curso" ? sugerencia.nombre : sugerencia.tema}
                  </button>
                </div>
              )}
              {listaVisible.length > 0 && (
                <div className="theory-search__sugerencias">
                  {listaVisible.map((it) => (
                    <button
                      key={paso === "curso" ? it.nombre : it.archivo}
                      type="button"
                      className="theory-search__sugerencia"
                      onClick={() =>
                        paso === "curso" ? elegirCurso(it) : elegirTema(it)
                      }
                    >
                      {paso === "curso" ? it.nombre : it.tema}
                    </button>
                  ))}
                </div>
              )}
              {paso === "curso" &&
                !q &&
                !mostrarTodos &&
                CURSOS.length > VISIBLES_POR_DEFECTO && (
                  <button
                    type="button"
                    className="theory-search__sugerencia theory-search__sugerencia--secundaria"
                    onClick={() => setMostrarTodos(true)}
                  >
                    <i className="fa-solid fa-plus" aria-hidden="true" />{" "}
                    Más cursos
                  </button>
                )}
              {cargando && (
                <div className="theory-search__burbuja">Cargando tema...</div>
              )}
            </div>
            <div className="theory-search__pie">
              <input
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  paso === "curso" ? "Nombre del curso" : "Nombre del tema"
                }
                className="theory-search__input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    elegirPrimero();
                  }
                }}
              />
              <button
                type="button"
                className="theory-search__enviar"
                onClick={elegirPrimero}
                aria-label="Buscar"
                title="Buscar"
              >
                <i className="fa-solid fa-paper-plane" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}