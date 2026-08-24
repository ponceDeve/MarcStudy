import { useEffect, useRef, useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ResaltarCoincidencia({ texto, query }) {
  if (!query.trim()) {
    return texto;
  }

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
  const coincidencia = textoOriginal.slice(indice, indice + busqueda.length);
  const despues = textoOriginal.slice(indice + busqueda.length);

  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}

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
                <p style={{ margin: "0 0 2px", fontSize: "12.5px", color: "var(--ink-faint)" }}>
                  <ResaltarCoincidencia texto={p.seccionTitulo} query={query} />
                </p>
              )}
              <p style={{ margin: 0 }}>
                <ResaltarCoincidencia texto={p.texto} query={query} />
              </p>
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