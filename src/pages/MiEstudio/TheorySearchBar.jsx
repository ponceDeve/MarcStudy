import { useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

// Buscador discreto (NO modal) para saltar a una tarjeta de teoría
// específica del tema actual. Busca por título de sección, texto y
// explicación. Sin sugerencias hasta escribir.
export default function TheorySearchBar({ flatPuntos = [], onSelect }) {
  const [query, setQuery] = useState("");
  const [buscadorFocus, setBuscadorFocus] = useState(false);

  const hayQuery = query.trim() !== "";

  const resultados = hayQuery
    ? buscarConPuntaje(
        flatPuntos,
        query,
        (p) => `${p.seccionTitulo || ""} ${p.texto || ""} ${p.explicacion || ""}`
      ).slice(0, 8)
    : [];

  function elegir(puntoId) {
    onSelect(puntoId);
    setQuery("");
    setBuscadorFocus(false);
  }

  const mostrarDropdown = buscadorFocus && hayQuery;

  return (
    <div className="theory-search">
      <div className="theory-search__wrap">
        <input
          autoComplete="off"
          type="search"
          name="buscar-teoria"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setBuscadorFocus(true)}
          onBlur={() => setTimeout(() => setBuscadorFocus(false), 150)}
          placeholder="Buscar título, texto o explicación..."
          className={`theory-search__input ${
            query.trim() && buscadorFocus ? "has-value" : ""
          }`}
        />

        {mostrarDropdown && (
          <div className="theory-search__dropdown">
            {resultados.length === 0 && (
              <p className="theory-search__empty">
                Sin resultados para "{query}"
              </p>
            )}

            {resultados.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(p.id)}
                className="theory-search__item"
              >
                {p.seccionTitulo && (
                  <span className="theory-search__item-seccion">
                    {p.seccionTitulo}
                  </span>
                )}
                <span>{p.texto}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
