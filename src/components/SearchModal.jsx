import { useState, useMemo, useEffect } from "react";
import manifest from "../data/manifest.json";
import { useArrowKeyList } from "../hooks/useArrowKeyList";
import { buscarConPuntaje } from "../lib/buscador";

const CURSOS_ITEMS = manifest.cursos.map((c) => ({ type: "curso", nombre: c.nombre }));
const TEMAS_ITEMS = manifest.cursos.flatMap((c) =>
  c.temas.map((t) => ({ type: "tema", curso: c.nombre, tema: t.tema, archivo: t.archivo })),
);

// Busca cursos y temas por separado, solo matches "fuertes" (empieza
// con / contiene / todas las palabras) — sin letras sueltas ni typos:
// si no hay coincidencia real, no aparece nada.
function buscarFuertes(query) {
  const cursos = buscarConPuntaje(CURSOS_ITEMS, query, (c) => c.nombre, { minScore: 400 });
  const temas = buscarConPuntaje(TEMAS_ITEMS, query, (t) => t.tema, { minScore: 400 });
  return { cursos, temas };
}

// Un grupo por curso: si el curso matcheó por su propio nombre, se
// listan TODOS sus temas; si no, solo los temas puntuales que
// matchearon.
function agruparResultados({ cursos, temas }) {
  const nombresCursosFuertes = new Set(cursos.map((c) => c.nombre));
  const grupos = cursos.map((c) => ({
    curso: c.nombre,
    temas: manifest.cursos.find((x) => x.nombre === c.nombre).temas.map((t) => ({
      type: "tema",
      curso: c.nombre,
      tema: t.tema,
      archivo: t.archivo,
    })),
  }));

  const temasPorCurso = new Map();
  for (const t of temas) {
    if (nombresCursosFuertes.has(t.curso)) continue;
    if (!temasPorCurso.has(t.curso)) temasPorCurso.set(t.curso, []);
    temasPorCurso.get(t.curso).push(t);
  }
  for (const [curso, temasDelCurso] of temasPorCurso) {
    grupos.push({ curso, temas: temasDelCurso });
  }

  return grupos;
}

// Búsqueda en vivo (igual que el buscador de inicio, mismo estilo de
// lista): se recalcula con cada letra, sin esperar Enter. Si hay una
// sola coincidencia fuerte en total, abre directo apenas converge a
// esa única opción; si no, se muestra la lista agrupada por curso.
export default function SearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const hayQuery = query.trim() !== "";

  const fuertes = useMemo(() => (hayQuery ? buscarFuertes(query) : { cursos: [], temas: [] }), [query, hayQuery]);
  const grupos = useMemo(() => agruparResultados(fuertes), [fuertes]);

  const itemsPlanos = useMemo(
    () => grupos.flatMap((g) => [{ type: "curso", nombre: g.curso }, ...g.temas]),
    [grupos],
  );

  function elegir(item) {
    onSelect(item);
    setQuery("");
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    const total = fuertes.cursos.length + fuertes.temas.length;
    // LÍNEA COMENTADA: Ya no saltará automáticamente al detectar una única opción.
    // if (total === 1) elegir(fuertes.cursos[0] || fuertes.temas[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuertes, open]);

  const { focusedIdx, handleKeyDown } = useArrowKeyList(itemsPlanos, elegir);

  useEffect(() => {
    if (!open) return;
    function onEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="search-overlay"
    >
      <div className="search-box">
        <button onClick={onClose} className="modal-close-x" aria-label="Cerrar">
          <i className="fa-solid fa-times" />
        </button>
        <div className="search-input-row">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar curso o tema..."
            className="search-input"
          />
          <div className="search-input-lupa">
            <i className="fa-solid fa-magnifying-glass" />
          </div>
        </div>

        {grupos.length > 0 && (() => {
          let idx = -1;
          return (
            <div className="search-results">
              {grupos.map((g) => {
                const idxCurso = ++idx;
                return (
                  <div key={`grupo-${g.curso}`} className="search-group">
                    <button
                      onClick={() => elegir({ type: "curso", nombre: g.curso })}
                      className={`search-result-item is-curso ${idxCurso === focusedIdx ? "is-focused" : ""}`}
                    >
                      <span className="curso-title">{g.curso}</span>
                    </button>
                    {g.temas.map((t) => {
                      const idxTema = ++idx;
                      return (
                        <button
                          key={`tema-${t.curso}-${t.tema}`}
                          onClick={() => elegir(t)}
                          className={`search-result-item is-tema ${idxTema === focusedIdx ? "is-focused" : ""}`}
                        >
                          <p className="search-result-item__tema">{t.tema}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {hayQuery && grupos.length === 0 && (
          <p className="search-empty">Sin resultados para "{query}"</p>
        )}
      </div>
    </div>
  );
}