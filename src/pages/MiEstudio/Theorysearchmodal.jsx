import { useEffect, useRef, useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

// Busca dentro del texto de cada tarjeta de teoría del tema actual
// (no las preguntas) y permite saltar directo a la que coincide.
export default function TheorySearchModal({ open, onClose, flatPuntos = [], onSelect }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const itemsConIndice = flatPuntos.map((p, index) => ({ p, index }));
  const resultados = query.trim()
    ? buscarConPuntaje(itemsConIndice, query, ({ p }) => `${p.seccionTitulo || ""} ${p.texto || ""}`).slice(0, 20)
    : itemsConIndice;

  return (
    <div
      className={`levels-modal ${open ? "" : "is-closed"}`}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div className="levels-modal__inner" onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title">Buscar en este tema</h2>

        <div className="home-search levels-modal__search" onClick={(e) => e.stopPropagation()}>
          <input autoComplete="off"
            type="search"
            name="buscar-texto-teoria"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cualquier texto de la teoría..."
            className="home-search-input"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "50vh", overflowY: "auto" }}>
          {resultados.map(({ p, index }) => (
            <button
              key={index}
              onClick={() => {
                onSelect(index);
                onClose();
                setQuery("");
              }}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                background: "var(--surface-alt)",
                color: "var(--ink)",
              }}
            >
              {p.seccionTitulo && (
                <p style={{ margin: "0 0 2px", fontSize: "12.5px", color: "var(--ink-faint)" }}>{p.seccionTitulo}</p>
              )}
              <p style={{ margin: 0 }}>{p.texto}</p>
            </button>
          ))}
          {resultados.length === 0 && (
            <p style={{ color: "var(--ink-soft)" }}>Ningún resultado para "{query}".</p>
          )}
        </div>

        <button onClick={onClose} className="levels-modal__close">
          <i className="fas fa-times" /> Cerrar
        </button>
      </div>
    </div>
  );
}