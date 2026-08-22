import { useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

// Función para normalizar texto
function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Componente para resaltar coincidencia en búsqueda
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
                    <ResaltarCoincidencia texto={p.seccionTitulo} query={query} />
                  </span>
                )}
                <span>
                  <ResaltarCoincidencia texto={p.texto} query={query} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
