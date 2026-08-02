import { useState, useMemo, useEffect } from "react";
import manifest from "../data/manifest.json";
import { useArrowKeyList } from "../hooks/useArrowKeyList";
import { buscarConPuntaje } from "../lib/buscador";

const OPCIONES = manifest.cursos.map((c) => ({ type: "curso", nombre: c.nombre }));

function textoDeItem(item) {
  return item.nombre;
}

// A diferencia del buscador de inicio (que sí busca en vivo mientras
// escribes), este busca recién al presionar Enter — para no mostrar
// resultados cambiando todo el tiempo mientras tipeas.
export default function SearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const yaBuscado = submittedQuery.trim() !== "" && submittedQuery === query;

  const results = useMemo(
    () => (yaBuscado ? buscarConPuntaje(OPCIONES, submittedQuery, textoDeItem).slice(0, 15) : []),
    [submittedQuery, yaBuscado],
  );

  const { focusedIdx, handleKeyDown } = useArrowKeyList(results, (item) => {
    onSelect(item);
    setQuery("");
    setSubmittedQuery("");
    onClose();
  });

  function onKeyDownInput(e) {
    if (e.key === "Enter" && !yaBuscado) {
      e.preventDefault();
      setSubmittedQuery(query);
      return;
    }
    handleKeyDown(e);
  }

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
            onKeyDown={onKeyDownInput}
            placeholder="Buscar curso..."
            className="search-input"
          />
          <button
            onClick={() => setSubmittedQuery(query)}
            className="search-input-lupa"
            aria-label="Buscar"
            title="Buscar"
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="search-results">
            {results.map((r, i) => {
              const isFocused = i === focusedIdx;

              return (
                <button
                  key={`curso-${r.nombre}`}
                  onClick={() => {
                    onSelect(r);
                    setQuery("");
                    setSubmittedQuery("");
                    onClose();
                  }}
                  className={`search-result-item is-curso ${isFocused ? "is-focused" : ""}`}
                >
                  <span className="curso-title">{r.nombre}</span>
                </button>
              );
            })}
          </div>
        )}

        {yaBuscado && results.length === 0 && (
          <p className="search-empty">Sin resultados para "{submittedQuery}"</p>
        )}
      </div>
    </div>
  );
}