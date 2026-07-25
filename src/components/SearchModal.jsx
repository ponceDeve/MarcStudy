import { useState, useMemo, useEffect } from "react";
import manifest from "../data/manifest.json";
import { useArrowKeyList } from "../hooks/useArrowKeyList";

export default function SearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return manifest.cursos
      .filter((c) => c.nombre.toLowerCase().includes(q))
      .map((c) => ({ type: "curso", nombre: c.nombre }))
      .slice(0, 15);
  }, [query]);

  const { focusedIdx, handleKeyDown } = useArrowKeyList(results, (item) => {
    onSelect(item);
    setQuery("");
    onClose();
  });

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
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar tema o curso..."
          className="search-input"
        />

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

        {query.trim() && results.length === 0 && (
          <p className="search-empty">Sin resultados para "{query}"</p>
        )}
      </div>
    </div>
  );
}