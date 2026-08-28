import { useState, useRef, useEffect, useMemo } from "react";
import {
  puntajeDeTexto,
  buscarCoincidencia,
  buscarPosicion,
  extraerFragmento,
  normalizarTexto,
} from "../../lib/buscador";
import { embeberTextos, embeberTexto, similitudCoseno } from "../../lib/semantico";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";

const DEBOUNCE_SEMANTICO_MS = 350;
const MIN_LARGO_QUERY_TEXTO = 2;
const MIN_LARGO_QUERY_SEMANTICO = 4;
const UMBRAL_SIMILITUD = 0.60;

// Componente para resaltar coincidencia en búsqueda (título / texto del
// punto). Igual que siempre: coincidencia literal simple sobre el texto
// ya normalizado.
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

// Resalta la coincidencia dentro de un FRAGMENTO ya recortado (ej. de la
// explicación). Usa posición por regex insensible a tildes, ya calculada
// en buscarPosicion, para que el resaltado quede alineado con precisión.
function ResaltarFragmento({ fragmento, indice, largoCoincidencia }) {
  if (indice == null || indice < 0) return fragmento;

  const antes = fragmento.slice(0, indice);
  const coincidencia = fragmento.slice(indice, indice + largoCoincidencia);
  const despues = fragmento.slice(indice + largoCoincidencia);

  if (!coincidencia) return fragmento;

  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}

// Busca los datos necesarios para armar y resaltar un fragmento de
// "explicacion" a partir de la posición hallada en el texto ORIGINAL
// (sin recortar), reubicando esa posición dentro del fragmento ya
// recortado.
function armarFragmentoExplicacion(explicacion, query) {
  const indiceOriginal = buscarPosicion(explicacion, query);
  const fragmento = extraerFragmento(explicacion, indiceOriginal);

  if (indiceOriginal == null) {
    return { fragmento, indice: null, largo: 0 };
  }

  // Recalculamos dónde quedó la coincidencia DENTRO del fragmento ya
  // recortado (no del texto completo), probando la misma búsqueda ahí.
  const queryLimpia = query.trim();
  const indiceEnFragmento = buscarPosicion(fragmento, queryLimpia);

  return {
    fragmento,
    indice: indiceEnFragmento,
    largo: queryLimpia.length,
  };
}

// Buscador discreto (NO modal) para saltar a una tarjeta de teoría
// específica del tema actual. Híbrido: coincidencia de texto (título,
// texto, explicación) + coincidencia semántica por significado (texto +
// explicación) vía embeddings locales, sin mandar nada a ningún backend.
export default function TheorySearchBar({ flatPuntos = [], onSelect }) {
  const [query, setQuery] = useState("");
  const [buscadorFocus, setBuscadorFocus] = useState(false);
  const [buscandoSemantico, setBuscandoSemantico] = useState(false);
  const [semantico, setSemantico] = useState({ query: "", scores: {} });

  const cacheEmbeddingsRef = useRef({ flatPuntos: null, promesa: null });
  const debounceRef = useRef(null);
  const idPeticionRef = useRef(0);

  const hayQuery = query.trim() !== "";

  // --- Búsqueda textual: instantánea, en cada tecla (barata) ---
  const candidatosTexto = useMemo(() => {
    const queryLimpia = query.trim();
    if (!hayQuery || queryLimpia.length < MIN_LARGO_QUERY_TEXTO) return [];

    return flatPuntos.map((punto) => {
      const scoreTitulo = puntajeDeTexto(punto.seccionTitulo || "", query);
      const scoreTexto = puntajeDeTexto(punto.texto || "", query);
      const scoreExplicacion = puntajeDeTexto(punto.explicacion || "", query);

      const mejorTextoOTitulo = Math.max(scoreTitulo, scoreTexto);
      const textScore = Math.max(mejorTextoOTitulo, scoreExplicacion);

      return {
        punto,
        textScore,
        soloExplicacion: scoreExplicacion > mejorTextoOTitulo && scoreExplicacion > 0,
      };
    });
  }, [flatPuntos, query, hayQuery]);

  // --- Búsqueda semántica: con debounce, solo si la query es larga ---
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const queryLimpia = query.trim();
    const hayCoincidenciasLiterales = candidatosTexto.some(
      ({ textScore }) => textScore > 0
    );

    if (
      queryLimpia.length < MIN_LARGO_QUERY_SEMANTICO ||
      hayCoincidenciasLiterales
    ) {
      setBuscandoSemantico(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const miPeticion = ++idPeticionRef.current;
      setBuscandoSemantico(true);

      try {
        // Cachea los embeddings de los puntos del tema actual: se
        // calculan una sola vez por tema (mientras "flatPuntos" no
        // cambie de referencia) y se reusan en cada búsqueda siguiente.
        if (cacheEmbeddingsRef.current.flatPuntos !== flatPuntos) {
          cacheEmbeddingsRef.current = {
            flatPuntos,
            promesa: embeberTextos(
              flatPuntos.map((p) => `${p.texto || ""} ${p.explicacion || ""}`.trim())
            ),
          };
        }

        const [vectoresPuntos, vectorQuery] = await Promise.all([
          cacheEmbeddingsRef.current.promesa,
          embeberTexto(queryLimpia),
        ]);

        // Si mientras esperábamos el usuario ya escribió otra cosa (o
        // cambió de tema), descartamos este resultado.
        if (miPeticion !== idPeticionRef.current) return;

        const scores = {};
        flatPuntos.forEach((punto, i) => {
          const vector = vectoresPuntos[i];
          if (!vector || !vectorQuery) return;
          const similitud = similitudCoseno(vectorQuery, vector);
          if (similitud >= UMBRAL_SIMILITUD) {
            scores[punto.id] = similitud;
          }
        });

        setSemantico({ query: queryLimpia, scores });
      } catch {
        // Si falla la carga del modelo (sin internet la primera vez,
        // etc.), simplemente no hay resultados semánticos; el texto
        // sigue funcionando igual.
      } finally {
        if (miPeticion === idPeticionRef.current) setBuscandoSemantico(false);
      }
    }, DEBOUNCE_SEMANTICO_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query, flatPuntos, candidatosTexto]);

  // --- Búsqueda por etapas: texto primero, semántica como fallback ---
  const resultados = useMemo(() => {
    const queryLimpia = query.trim();
    if (!hayQuery || queryLimpia.length < MIN_LARGO_QUERY_TEXTO) return [];

    const resultadosTexto = candidatosTexto
      .filter(({ textScore }) => textScore > 0)
      .map(({ punto, textScore, soloExplicacion }) => ({
        punto,
        finalScore: textScore,
        soloExplicacion,
        esSemantico: false,
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8);

    if (resultadosTexto.length > 0 || queryLimpia.length < MIN_LARGO_QUERY_SEMANTICO) {
      return resultadosTexto;
    }

    const semanticoVigente =
      semantico.query === queryLimpia ? semantico.scores : {};

    return candidatosTexto
      .map(({ punto }) => {
        const similitud = semanticoVigente[punto.id];
        if (similitud == null) return null;

        return {
          punto,
          finalScore: similitud * 700,
          soloExplicacion: false,
          esSemantico: true,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8);
  }, [candidatosTexto, semantico, query, hayQuery]);

  const { focusedIdx, handleKeyDown } = useArrowKeyList(resultados, (resultado) => {
    elegir(resultado);
  });

  function elegir(resultado) {
    const { punto } = resultado;
    const queryLimpia = query.trim();

    // Busca dónde está la coincidencia REAL para poder resaltar solo esa
    // palabra/frase en la página (primero en el texto principal, después
    // en la explicación). Si no hay ninguna coincidencia literal (match
    // puramente semántico), no hay nada puntual que subrayar.
    const matchTexto = buscarCoincidencia(punto.texto || "", queryLimpia);
    const matchExplicacion = buscarCoincidencia(punto.explicacion || "", queryLimpia);

    let campo = null;
    let matchText = null;

    if (matchTexto) {
      campo = "texto";
      matchText = punto.texto.slice(matchTexto.indice, matchTexto.indice + matchTexto.largo);
    } else if (matchExplicacion) {
      campo = "explicacion";
      matchText = punto.explicacion.slice(
        matchExplicacion.indice,
        matchExplicacion.indice + matchExplicacion.largo
      );
    } else {
      // Sin coincidencia literal: aproximamos "dónde se encontró" al
      // campo con más contenido (la explicación, si existe).
      campo = punto.explicacion ? "explicacion" : "texto";
    }

    onSelect({ puntoId: punto.id, campo, matchText });
    setQuery("");
    setBuscadorFocus(false);
  }

  function onKeyDownInput(e) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
      setBuscadorFocus(false);
      return;
    }
    handleKeyDown(e);
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
          onKeyDown={onKeyDownInput}
          placeholder="Buscar título, texto o explicación..."
          className={`theory-search__input ${
            query.trim() && buscadorFocus ? "has-value" : ""
          }`}
        />

        {mostrarDropdown && (
          <div className="theory-search__dropdown">
            {resultados.length === 0 && !buscandoSemantico && (
              <p className="theory-search__empty">
                Sin resultados para "{query}"
              </p>
            )}

            {resultados.map((r, idx) => {
              const { punto, soloExplicacion, esSemantico } = r;

              // Se muestra un fragmento de la explicación cuando la
              // coincidencia real está ahí (textual sobre explicación,
              // o semántica sin match literal en título/texto).
              const necesitaFragmento = soloExplicacion || esSemantico;

              const datosFragmento = necesitaFragmento
                ? armarFragmentoExplicacion(punto.explicacion || "", query)
                : null;

              return (
                <button
                  key={punto.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(r)}
                  className={`theory-search__item ${
                    idx === focusedIdx ? "is-focused" : ""
                  }`}
                >
                  {punto.seccionTitulo && (
                    <span className="theory-search__item-seccion">
                      <ResaltarCoincidencia texto={punto.seccionTitulo} query={query} />
                    </span>
                  )}
                  <span>
                    <ResaltarCoincidencia texto={punto.texto} query={query} />
                  </span>

                  {datosFragmento && datosFragmento.fragmento && (
                    <span className="theory-search__item-fragmento">
                      {esSemantico && (
                        <span className="theory-search__item-badge">Relacionado</span>
                      )}
                      <ResaltarFragmento
                        fragmento={datosFragmento.fragmento}
                        indice={datosFragmento.indice}
                        largoCoincidencia={datosFragmento.largo}
                      />
                    </span>
                  )}
                </button>
              );
            })}

            {buscandoSemantico && (
              <p className="theory-search__buscando">Buscando también por significado...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}