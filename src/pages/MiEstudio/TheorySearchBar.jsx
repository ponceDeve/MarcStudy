import { useState, useRef, useEffect, useMemo } from "react";
import {
  puntajeDeTexto,
  buscarCoincidencia,
  buscarPosicion,
  extraerFragmento,
  normalizarTexto,
} from "../../lib/buscador";
import {
  embeberTextos,
  embeberTexto,
  similitudCoseno,
} from "../../lib/semantico";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";
const DEBOUNCE_SEMANTICO_MS = 350;
const MIN_LARGO_QUERY_TEXTO = 2;
const MIN_LARGO_QUERY_SEMANTICO = 4;
const UMBRAL_SIMILITUD = 0.60;
/* ============================================================
   RESALTAR COINCIDENCIA
   ============================================================ */
// Resalta una coincidencia literal dentro de un texto.
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
   RESALTAR FRAGMENTO
   ============================================================ */
// Resalta una coincidencia dentro de un fragmento ya recortado.
function ResaltarFragmento({ fragmento, indice, largoCoincidencia }) {
  if (indice == null || indice < 0) {
    return fragmento;
  }
  const antes = fragmento.slice(0, indice);
  const coincidencia = fragmento.slice(
    indice,
    indice + largoCoincidencia
  );
  const despues = fragmento.slice(indice + largoCoincidencia);
  if (!coincidencia) {
    return fragmento;
  }
  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}
/* ============================================================
   ARMAR FRAGMENTO DE EXPLICACIÓN
   ============================================================ */
// Busca dónde está la coincidencia dentro de la explicación
// original y luego recalcula su posición dentro del fragmento.
function armarFragmentoExplicacion(explicacion, query) {
  const indiceOriginal = buscarPosicion(explicacion, query);
  const fragmento = extraerFragmento(explicacion, indiceOriginal);
  if (indiceOriginal == null) {
    return {
      fragmento,
      indice: null,
      largo: 0,
    };
  }
  const queryLimpia = query.trim();
  const indiceEnFragmento = buscarPosicion(
    fragmento,
    queryLimpia
  );
  return {
    fragmento,
    indice: indiceEnFragmento,
    largo: queryLimpia.length,
  };
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
export default function TheorySearchBar({
  flatPuntos = [],
  onSelect,
}) {
  const [query, setQuery] = useState("");
  const [buscadorFocus, setBuscadorFocus] = useState(false);
  const [buscandoSemantico, setBuscandoSemantico] = useState(false);
  const [semantico, setSemantico] = useState({
    query: "",
    scores: {},
  });
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
        /* --------------------------------------------------------
           PUNTAJES
           Los usamos para ordenar las coincidencias.
           IMPORTANTE:
           El puntaje por sí solo NO decide si se muestra.
           -------------------------------------------------------- */
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
        /* --------------------------------------------------------
           COINCIDENCIAS LITERALES REALES
           Estas son las que determinan si la sugerencia
           realmente puede mostrarse y resaltarse.
           -------------------------------------------------------- */
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
        /* --------------------------------------------------------
           DETERMINAR SI LA COINCIDENCIA ESTÁ SOLO
           EN LA EXPLICACIÓN
           -------------------------------------------------------- */
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
      /* ----------------------------------------------------------
         FILTRO IMPORTANTE
         SOLO pasan los puntos que tienen una coincidencia
         literal real.
         ---------------------------------------------------------- */
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
  // Las sugerencias muestran únicamente coincidencias
  // literales reales.
  //
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
      /* ----------------------------------------------------------
         CACHE DE EMBEDDINGS
         ---------------------------------------------------------- */
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
      /* ----------------------------------------------------------
         GENERAR VECTOR DE LA QUERY Y OBTENER VECTORES
         ---------------------------------------------------------- */
      const [
        vectoresPuntos,
        vectorQuery,
      ] = await Promise.all([
        cacheEmbeddingsRef.current.promesa,
        embeberTexto(queryLimpia),
      ]);
      /* ----------------------------------------------------------
         COMPROBAR QUE SIGUE SIENDO LA MISMA PETICIÓN
         ---------------------------------------------------------- */
      if (
        miPeticion !==
        idPeticionRef.current
      ) {
        return null;
      }
      let mejorPunto = null;
      let mejorSimilitud = -Infinity;
      /* ----------------------------------------------------------
         BUSCAR LA COINCIDENCIA SEMÁNTICA MÁS PARECIDA
         ---------------------------------------------------------- */
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
    /* ----------------------------------------------------------
       BUSCAR COINCIDENCIA EN TEXTO
       ---------------------------------------------------------- */
    const matchTexto =
      buscarCoincidencia(
        punto.texto || "",
        queryLimpia
      );
    /* ----------------------------------------------------------
       BUSCAR COINCIDENCIA EN EXPLICACIÓN
       ---------------------------------------------------------- */
    const matchExplicacion =
      buscarCoincidencia(
        punto.explicacion || "",
        queryLimpia
      );
    let campo = null;
    let matchText = null;
    /* ----------------------------------------------------------
       PRIORIDAD:
       1. Texto
       2. Explicación
       3. Semántico
       ---------------------------------------------------------- */
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
      /* --------------------------------------------------------
         NO EXISTE COINCIDENCIA LITERAL.
         Esto ocurre únicamente cuando llegamos aquí mediante
         búsqueda semántica.
         -------------------------------------------------------- */
      campo = punto.explicacion
        ? "explicacion"
        : "texto";
    }
    /* ----------------------------------------------------------
       AVISAR AL COMPONENTE PADRE
       ---------------------------------------------------------- */
    onSelect({
      puntoId: punto.id,
      campo,
      matchText,
    });
    /* ----------------------------------------------------------
       LIMPIAR BUSCADOR
       ---------------------------------------------------------- */
    setQuery("");
    setQueryBuscada("");
    setResultadoSemantico(null);
    setBuscadorFocus(false);
  }
  /* ============================================================
     ENTER
     ============================================================ */
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
    // Búsqueda nueva (o reintento si la anterior no dio nada).
    setResultadoSemantico(null);
    setBusquedaLista(false);
    setQueryBuscada(queryLimpia);
    setRondaBusqueda((r) => r + 1);
    setBuscadorFocus(true);
  }
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
    /* ----------------------------------------------------------
       ESCAPE
       ---------------------------------------------------------- */
    if (e.key === "Escape") {
      e.currentTarget.blur();
      setBuscadorFocus(false);
      return;
    }
    /* ----------------------------------------------------------
       ENTER
       IMPORTANTE:
       No dejamos que useArrowKeyList maneje Enter.
       Enter tiene nuestro comportamiento personalizado.
       ---------------------------------------------------------- */
    if (e.key === "Enter") {
      e.preventDefault();
      buscarConEnter();
      return;
    }
    /* ----------------------------------------------------------
       FLECHAS
       ---------------------------------------------------------- */
    handleKeyDown(e);
  }
  /* ============================================================
     MOSTRAR DROPDOWN
     ============================================================ */
  const mostrarDropdown =
    buscadorFocus &&
    hayQuery &&
    query.trim() === queryBuscada &&
    (resultadosVisibles.length > 0 || buscandoSemantico || busquedaLista);
  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="theory-search">
      <div className="theory-search__wrap">
        {/* ======================================================
           INPUT
           ====================================================== */}
        <input
          autoComplete="off"
          type="search"
          name="buscar-teoria"
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }
          onFocus={() =>
            setBuscadorFocus(true)
          }
          onBlur={() =>
            setTimeout(
              () =>
                setBuscadorFocus(
                  false
                ),
              150
            )
          }
          onKeyDown={
            onKeyDownInput
          }
          placeholder="Buscar título, texto o explicación..."
          className={`theory-search__input ${mostrarDropdown ? "has-results" : ""
            }`}
        />
        {/* ======================================================
           SUGERENCIAS
           ====================================================== */}
        {mostrarDropdown && (
          <div className="theory-search__dropdown">
            {resultadosVisibles.length > 0 ? (
              resultadosVisibles.map(
                (r, idx) => {
                  const {
                    punto,
                    matchTitulo,
                    matchTexto,
                    matchExplicacion,
                  } = r;
                  /* ------------------------------------------------
                     FRAGMENTO DE EXPLICACIÓN
                     Solo se prepara si la coincidencia está
                     únicamente en la explicación.
                     ------------------------------------------------ */
                  const soloExplicacion =
                    !!matchExplicacion &&
                    !matchTitulo &&
                    !matchTexto;
                  const datosFragmento =
                    soloExplicacion
                      ? armarFragmentoExplicacion(
                        punto.explicacion ||
                        "",
                        queryBuscada
                      )
                      : null;
                  return (
                    <button
                      key={punto.id}
                      type="button"
                      onMouseDown={(e) =>
                        e.preventDefault()
                      }
                      onClick={() =>
                        elegir(r)
                      }
                      className={`theory-search__item ${idx ===
                        focusedIdx
                        ? "is-focused"
                        : ""
                        }`}
                    >
                      {/* ------------------------------------------
                         SOLO MOSTRAR LA COINCIDENCIA
                         ------------------------------------------ */}
                      {r.esSemantico ? (
                        <span>
                          {punto.texto || punto.explicacion}
                        </span>
                      ) : matchTitulo ? (
                        <>
                          <span className="theory-search__item-seccion">
                            <ResaltarCoincidencia
                              texto={
                                punto.seccionTitulo
                              }
                              query={queryBuscada}
                            />
                          </span>
                          {punto.texto ? (
                            <span className="theory-search__item-texto">
                              {punto.texto}
                            </span>
                          ) : null}
                        </>
                      ) : matchTexto ? (
                        <span>
                          <ResaltarCoincidencia
                            texto={
                              punto.texto
                            }
                            query={queryBuscada}
                          />
                        </span>
                      ) : datosFragmento?.fragmento ? (
                        <span className="theory-search__item-fragmento">
                          <ResaltarFragmento
                            fragmento={
                              datosFragmento.fragmento
                            }
                            indice={
                              datosFragmento.indice
                            }
                            largoCoincidencia={
                              datosFragmento.largo
                            }
                          />
                        </span>
                      ) : null}
                    </button>
                  );
                }
              )
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
}