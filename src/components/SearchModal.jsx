import { useState, useMemo, useEffect } from "react";
import manifest from "../data/manifest.json";
import { buscarConPuntaje } from "../lib/buscador";

const OPCIONES = [
  ...manifest.cursos.map((c) => ({ type: "curso", nombre: c.nombre })),
  ...manifest.cursos.flatMap((c) =>
    c.temas.map((t) => ({
      type: "tema",
      curso: c.nombre,
      tema: t.tema,
      archivo: t.archivo,
    })),
  ),
];

function textoDeItem(item) {
  return item.type === "curso" ? item.nombre : item.tema;
}

// Igual que el buscador de inicio: no busca en vivo mientras escribes
// (recién al presionar Enter o la lupa), busca cursos Y temas, y solo
// se queda con la mejor coincidencia.
export default function SearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const yaBuscado = submittedQuery.trim() !== "" && submittedQuery === query;

  const resultado = useMemo(() => {
    if (!yaBuscado) return null;
    const encontrados = buscarConPuntaje(OPCIONES, submittedQuery, textoDeItem);
    return encontrados[0] || null;
  }, [submittedQuery, yaBuscado]);

  function elegir(item) {
    onSelect(item);
    setQuery("");
    setSubmittedQuery("");
    onClose();
  }

  function onKeyDownInput(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!yaBuscado) {
      setSubmittedQuery(query);
      return;
    }
    if (resultado) elegir(resultado);
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
            placeholder="Buscar curso o tema..."
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

        {resultado && (
          <div className="search-results">
            <button
              onClick={() => elegir(resultado)}
              className={`search-result-item ${resultado.type === "curso" ? "is-curso" : "is-tema"}`}
            >
              {resultado.type === "curso" ? (
                <span className="curso-title">{resultado.nombre}</span>
              ) : (
                <>
                  <p className="search-result-item__tema">{resultado.tema}</p>
                  <p className="search-result-item__curso">{resultado.curso}</p>
                </>
              )}
            </button>
          </div>
        )}

        {yaBuscado && !resultado && (
          <p className="search-empty">Sin resultados para "{submittedQuery}"</p>
        )}
      </div>
    </div>
  );
}