import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  puntajeDeTexto,
  buscarCoincidencia,
  normalizarTexto,
} from "../../lib/buscador";
import {
  embeberTextos,
  embeberTexto,
  similitudCoseno,
} from "../../lib/semantico";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";
const MIN_LARGO_QUERY_TEXTO = 2;
const MIN_LARGO_QUERY_SEMANTICO = 4;
const UMBRAL_SIMILITUD = 0.60;
/* ============================================================
   RESALTAR COINCIDENCIA
   ============================================================ */
// Resalta una coincidencia literal dentro de un texto (completo).
export function ResaltarCoincidencia({ texto, query }) {
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
  const coincidencia = textoOriginal.slice(
    indice,
    indice + busqueda.length
  );
  const despues = textoOriginal.slice(indice + busqueda.length);
  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}
/* ============================================================
   THEORY SEARCH BAR
   ============================================================ */
// Buscador discreto para saltar a una tarjeta de teoría.
//
// COMPORTAMIENTO (nada es en vivo, todo ocurre al presionar Enter):
//
// 1. Mientras escribes no se busca ni se muestra nada.
//
// 2. Al presionar Enter:
//    - Se buscan coincidencias literales y se muestran como sugerencias.
//    - Si NO hay ninguna coincidencia literal, se hace la búsqueda
//      semántica y se muestra la más parecida como sugerencia.
//
// 3. Con las sugerencias visibles, Enter de nuevo elige la enfocada
//    (flechas) o la primera; también se puede hacer clic en una.
//
// Cada sugerencia muestra el texto y la explicación COMPLETOS
// (sin recortar), con la coincidencia resaltada.
//
// Props opcionales (las usa el mapa de temas):
// - placeholder: texto del input.
// - ref.buscar(): lanza la búsqueda con lo escrito (botón "Buscar" externo).
const TheorySearchBar = forwardRef(function TheorySearchBar({
  flatPuntos = [],
  onSelect,
  placeholder = "Buscar título, texto o explicación...",
  modoChat = false,
}, ref) {
  const [query, setQuery] = useState("");
  const [buscadorFocus, setBuscadorFocus] = useState(false);
  const [buscandoSemantico, setBuscandoSemantico] = useState(false);
  const cacheEmbeddingsRef = useRef({
    flatPuntos: null,
    promesa: null,
  });
  const idPeticionRef = useRef(0);
  // Búsqueda "confirmada" con Enter: los resultados salen de aquí,
  // no de lo que se está escribiendo.
  const [queryBuscada, setQueryBuscada] = useState("");
  const [rondaBusqueda, setRondaBusqueda] = useState(0);
  const [resultadoSemantico, setResultadoSemantico] = useState(null);
  const [busquedaLista, setBusquedaLista] = useState(false);
  const hayQuery = queryBuscada.trim() !== "";
  /* ============================================================
     BÚSQUEDA TEXTUAL
     ============================================================ */
  const candidatosTexto = useMemo(() => {
    const queryLimpia = queryBuscada.trim();
    if (
      !hayQuery ||
      queryLimpia.length < MIN_LARGO_QUERY_TEXTO
    ) {
      return [];
    }
    return flatPuntos
      .map((punto) => {
        // Puntajes: solo sirven para ordenar las coincidencias.
        const scoreTitulo = puntajeDeTexto(
          punto.seccionTitulo || "",
          queryBuscada
        );
        const scoreTexto = puntajeDeTexto(
          punto.texto || "",
          queryBuscada
        );
        const scoreExplicacion = puntajeDeTexto(
          punto.explicacion || "",
          queryBuscada
        );
        const mejorTextoOTitulo = Math.max(
          scoreTitulo,
          scoreTexto
        );
        const textScore = Math.max(
          mejorTextoOTitulo,
          scoreExplicacion
        );
        // Coincidencias literales reales: deciden si se muestra.
        const matchTitulo = buscarCoincidencia(
          punto.seccionTitulo || "",
          queryLimpia
        );
        const matchTexto = buscarCoincidencia(
          punto.texto || "",
          queryLimpia
        );
        const matchExplicacion = buscarCoincidencia(
          punto.explicacion || "",
          queryLimpia
        );
        const tieneCoincidenciaReal =
          !!matchTitulo ||
          !!matchTexto ||
          !!matchExplicacion;
        const soloExplicacion =
          !!matchExplicacion &&
          !matchTitulo &&
          !matchTexto;
        return {
          punto,
          textScore,
          scoreTitulo,
          scoreTexto,
          scoreExplicacion,
          matchTitulo,
          matchTexto,
          matchExplicacion,
          tieneCoincidenciaReal,
          soloExplicacion,
        };
      })
      // Solo pasan los puntos con coincidencia literal real.
      .filter(
        ({ tieneCoincidenciaReal }) =>
          tieneCoincidenciaReal
      );
  }, [
    flatPuntos,
    queryBuscada,
    hayQuery,
  ]);
  /* ============================================================
     RESULTADOS VISIBLES
     ============================================================ */
  // Las sugerencias muestran únicamente coincidencias literales reales.
  // La búsqueda semántica NO se muestra automáticamente.
  const resultados = useMemo(() => {
    const queryLimpia = queryBuscada.trim();
    if (
      !hayQuery ||
      queryLimpia.length < MIN_LARGO_QUERY_TEXTO
    ) {
      return [];
    }
    return candidatosTexto
      .map(
        ({
          punto,
          textScore,
          soloExplicacion,
          matchTitulo,
          matchTexto,
          matchExplicacion,
        }) => ({
          punto,
          finalScore: textScore,
          soloExplicacion,
          esSemantico: false,
          matchTitulo,
          matchTexto,
          matchExplicacion,
        })
      )
      .sort(
        (a, b) =>
          b.finalScore - a.finalScore
      )
      .slice(0, 8);
  }, [
    candidatosTexto,
    queryBuscada,
    hayQuery,
  ]);
  /* ============================================================
     BÚSQUEDA SEMÁNTICA
     ============================================================ */
  async function buscarSemantico(queryLimpia) {
    if (
      queryLimpia.length <
      MIN_LARGO_QUERY_SEMANTICO
    ) {
      return null;
    }
    const miPeticion =
      ++idPeticionRef.current;
    setBuscandoSemantico(true);
    try {
      // Cache de embeddings
      if (
        cacheEmbeddingsRef.current.flatPuntos !==
        flatPuntos
      ) {
        cacheEmbeddingsRef.current = {
          flatPuntos,
          promesa: embeberTextos(
            flatPuntos.map(
              (punto) =>
                `${punto.texto || ""} ${punto.explicacion || ""
                  }`.trim()
            )
          ),
        };
      }
      const [
        vectoresPuntos,
        vectorQuery,
      ] = await Promise.all([
        cacheEmbeddingsRef.current.promesa,
        embeberTexto(queryLimpia),
      ]);
      // Comprobar que sigue siendo la misma petición
      if (
        miPeticion !==
        idPeticionRef.current
      ) {
        return null;
      }
      let mejorPunto = null;
      let mejorSimilitud = -Infinity;
      flatPuntos.forEach(
        (punto, i) => {
          const vector =
            vectoresPuntos[i];
          if (
            !vector ||
            !vectorQuery
          ) {
            return;
          }
          const similitud =
            similitudCoseno(
              vectorQuery,
              vector
            );
          if (
            similitud >=
            UMBRAL_SIMILITUD &&
            similitud >
            mejorSimilitud
          ) {
            mejorSimilitud =
              similitud;
            mejorPunto = punto;
          }
        }
      );
      if (!mejorPunto) {
        return null;
      }
      return {
        punto: mejorPunto,
        finalScore:
          mejorSimilitud * 700,
        soloExplicacion: false,
        esSemantico: true,
        similitud:
          mejorSimilitud,
      };
    } catch {
      return null;
    } finally {
      if (
        miPeticion ===
        idPeticionRef.current
      ) {
        setBuscandoSemantico(false);
      }
    }
  }
  /* ============================================================
     ELEGIR RESULTADO
     ============================================================ */
  function elegir(resultado) {
    const { punto } = resultado;
    const queryLimpia =
      queryBuscada.trim();
    const matchTexto =
      buscarCoincidencia(
        punto.texto || "",
        queryLimpia
      );
    const matchExplicacion =
      buscarCoincidencia(
        punto.explicacion || "",
        queryLimpia
      );
    let campo = null;
    let matchText = null;
    // Prioridad: 1. Texto  2. Explicación  3. Semántico
    if (matchTexto) {
      campo = "texto";
      matchText =
        punto.texto.slice(
          matchTexto.indice,
          matchTexto.indice +
          matchTexto.largo
        );
    } else if (matchExplicacion) {
      campo = "explicacion";
      matchText =
        punto.explicacion.slice(
          matchExplicacion.indice,
          matchExplicacion.indice +
          matchExplicacion.largo
        );
    } else {
      // Llegamos por búsqueda semántica (no hay coincidencia literal).
      campo = punto.explicacion
        ? "explicacion"
        : "texto";
    }
    onSelect({
      puntoId: punto.id,
      campo,
      matchText,
    });
    // Limpiar buscador
    setQuery("");
    setQueryBuscada("");
    setResultadoSemantico(null);
    setBuscadorFocus(false);
  }
  /* ============================================================
     ENTER
     ============================================================ */
  // Búsqueda nueva con lo escrito (Enter sin sugerencias o botón externo).
  function ejecutarBusqueda(texto) {
    const queryLimpia = (typeof texto === "string" ? texto : query).trim();
    if (queryLimpia.length < MIN_LARGO_QUERY_TEXTO) {
      return;
    }
    setQuery(queryLimpia);
    setResultadoSemantico(null);
    setBusquedaLista(false);
    setQueryBuscada(queryLimpia);
    setRondaBusqueda((r) => r + 1);
    setBuscadorFocus(true);
  }
  function buscarConEnter() {
    const queryLimpia = query.trim();
    if (queryLimpia.length < MIN_LARGO_QUERY_TEXTO) {
      return;
    }
    // Ya hay sugerencias visibles para este mismo texto:
    // Enter elige la enfocada con las flechas o, si no hay, la primera.
    if (queryLimpia === queryBuscada && resultadosVisibles.length > 0) {
      elegir(resultadosVisibles[focusedIdx >= 0 ? focusedIdx : 0]);
      return;
    }
    ejecutarBusqueda();
  }
  useImperativeHandle(ref, () => ({ buscar: () => ejecutarBusqueda() }));
  /* ============================================================
     SEMÁNTICO COMO RESPALDO
     ============================================================ */
  // Se ejecuta después de cada Enter: si no hubo ninguna coincidencia
  // literal, busca la más parecida por significado.
  useEffect(() => {
    if (rondaBusqueda === 0 || !queryBuscada) {
      return undefined;
    }
    if (resultados.length > 0) {
      setBusquedaLista(true);
      return undefined;
    }
    if (queryBuscada.length < MIN_LARGO_QUERY_SEMANTICO) {
      setBusquedaLista(true);
      return undefined;
    }
    let cancelado = false;
    buscarSemantico(queryBuscada).then((r) => {
      if (cancelado) return;
      setResultadoSemantico(r);
      setBusquedaLista(true);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rondaBusqueda]);
  // Lo que realmente se ve en el dropdown.
  const resultadosVisibles =
    resultados.length > 0
      ? resultados
      : resultadoSemantico
        ? [resultadoSemantico]
        : [];
  /* ============================================================
     NAVEGACIÓN CON FLECHAS
     ============================================================ */
  const {
    focusedIdx,
    handleKeyDown,
  } = useArrowKeyList(
    resultadosVisibles,
    (resultado) => {
      elegir(resultado);
    }
  );
  /* ============================================================
     TECLADO DEL INPUT
     ============================================================ */
  function onKeyDownInput(e) {
    if (e.key === "Escape") {
      e.currentTarget.blur();
      setBuscadorFocus(false);
      return;
    }
    // Enter tiene comportamiento propio (no lo maneja useArrowKeyList).
    if (e.key === "Enter") {
      e.preventDefault();
      buscarConEnter();
      return;
    }
    handleKeyDown(e);
  }
  /* ============================================================
     SUGERENCIAS (primeros 3 títulos) — solo modo chat
     ============================================================ */
  const sugerenciasTitulos = useMemo(() => {
    const vistos = [];
    for (const p of flatPuntos) {
      if (p.seccionTitulo && !vistos.includes(p.seccionTitulo)) {
        vistos.push(p.seccionTitulo);
      }
      if (vistos.length === 3) break;
    }
    return vistos;
  }, [flatPuntos]);
  /* ============================================================
     MOSTRAR RESULTADOS
     ============================================================ */
  const hayResultadosPendientes =
    resultadosVisibles.length > 0 || buscandoSemantico || busquedaLista;
  const mostrarDropdown =
    buscadorFocus &&
    hayQuery &&
    query.trim() === queryBuscada &&
    hayResultadosPendientes;
  // En el chat los resultados se quedan aunque el input pierda el foco.
  const mostrarMensajesChat =
    hayQuery && query.trim() === queryBuscada && hayResultadosPendientes;
  /* ============================================================
     ITEMS (texto y explicación COMPLETOS)
     ============================================================ */
  function renderItems() {
    return resultadosVisibles.map((r, idx) => {
      const { punto, matchTitulo } = r;
      return (
        <button
          key={punto.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => elegir(r)}
          className={`theory-search__item ${idx === focusedIdx ? "is-focused" : ""}`}
        >
          {matchTitulo ? (
            <span className="theory-search__item-seccion">
              <strong>
                <ResaltarCoincidencia
                  texto={punto.seccionTitulo}
                  query={queryBuscada}
                />
              </strong>
            </span>
          ) : null}
          {punto.texto ? (
            <span className="theory-search__item-seccion">
              <ResaltarCoincidencia
                texto={punto.texto}
                query={r.esSemantico ? "" : queryBuscada}
              />
            </span>
          ) : null}
          {punto.explicacion ? (
            <span className="theory-search__item-texto">
              <ResaltarCoincidencia
                texto={punto.explicacion}
                query={r.esSemantico ? "" : queryBuscada}
              />
            </span>
          ) : null}
        </button>
      );
    });
  }
  const inputEl = (
    <input
      autoComplete="off"
      type="search"
      name="buscar-teoria"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => setBuscadorFocus(true)}
      onBlur={() => setTimeout(() => setBuscadorFocus(false), 150)}
      onKeyDown={onKeyDownInput}
      placeholder={placeholder}
      className={`theory-search__input ${mostrarDropdown ? "has-results" : ""}`}
    />
  );
  /* ============================================================
     RENDER — MODO CHAT
     ============================================================ */
  if (modoChat) {
    return (
      <div className="theory-search theory-search--chat">
        <div className="theory-search__mensajes">
          {mostrarMensajesChat ? (
            <>
              <div className="theory-search__burbuja theory-search__burbuja--usuario">
                {queryBuscada}
              </div>
              {resultadosVisibles.length > 0 ? (
                renderItems()
              ) : busquedaLista && !buscandoSemantico ? (
                <div className="theory-search__burbuja">
                  No hay coincidencias
                </div>
              ) : null}
              {buscandoSemantico && (
                <div className="theory-search__burbuja">
                  Buscando la coincidencia más parecida...
                </div>
              )}
            </>
          ) : (
            <>
              <div className="theory-search__burbuja">
                Busca algo en la teoría
              </div>
              {sugerenciasTitulos.length > 0 && (
                <div className="theory-search__sugerencias">
                  {sugerenciasTitulos.map((titulo) => (
                    <button
                      key={titulo}
                      type="button"
                      className="theory-search__sugerencia"
                      onClick={() => ejecutarBusqueda(titulo)}
                    >
                      {titulo}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="theory-search__pie">
          {inputEl}
          <button
            type="button"
            className="theory-search__enviar"
            onClick={buscarConEnter}
            aria-label="Buscar"
            title="Buscar"
          >
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </div>
    );
  }
  /* ============================================================
     RENDER — MODO NORMAL (mapa de temas)
     ============================================================ */
  return (
    <div className="theory-search">
      <div className="theory-search__wrap">
        {inputEl}
        {mostrarDropdown && (
          <div className="theory-search__dropdown">
            {resultadosVisibles.length > 0 ? (
              renderItems()
            ) : busquedaLista && !buscandoSemantico ? (
              <p className="theory-search__empty">
                No hay coincidencias
              </p>
            ) : null}
            {buscandoSemantico && (
              <div className="theory-search__semantic-loading">
                Buscando la coincidencia más parecida...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
export default TheorySearchBar;