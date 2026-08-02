import { useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

// Buscador discreto (NO modal) para saltar a una tarjeta de teoría
// específica del tema actual. Siempre es un input directo arriba de
// la tarjeta, en cualquier tamaño de pantalla. Sin sugerencias hasta
// escribir.
export default function TheorySearchBar({ flatPuntos = [], onSelect }) {
  const [query, setQuery] = useState("");

  const itemsConIndice = flatPuntos.map((p, index) => ({ p, index }));
  const resultados = query.trim()
    ? buscarConPuntaje(itemsConIndice, query, ({ p }) => `${p.seccionTitulo || ""} ${p.texto || ""}`).slice(0, 6)
    : [];

  function elegir(index) {
    onSelect(index);
    setQuery("");
  }

  return (
    <div className="theory-search">
      <div className="theory-search__wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en este tema..."
          className="theory-search__input"
        />
        {resultados.length > 0 && (
          <div className="theory-search__dropdown">
            {resultados.map(({ p, index }) => (
              <button key={index} type="button" onClick={() => elegir(index)} className="theory-search__item">
                {p.seccionTitulo && <span className="theory-search__item-seccion">{p.seccionTitulo}</span>}
                <span>{p.texto}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}