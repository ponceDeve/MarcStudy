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
// COMPORTAMIENTO:
//
// 1. Mientras escribes:
//    - Solo muestra coincidencias literales reales.
//    - Si no existe la palabra/frase, muestra "No hay coincidencias".
//
// 2. Al presionar Enter:
//    - Si existe coincidencia literal, selecciona la mejor.
//    - Si NO existe coincidencia literal, realiza búsqueda
//      semántica y selecciona la coincidencia más parecida.
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
  const hayQuery = query.trim() !== "";

  /* ============================================================
     BÚSQUEDA TEXTUAL
     ============================================================ */

  const candidatosTexto = useMemo(() => {
    const queryLimpia = query.trim();

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
          query
        );

        const scoreTexto = puntajeDeTexto(
          punto.texto || "",
          query
        );

        const scoreExplicacion = puntajeDeTexto(
          punto.explicacion || "",
          query
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
    query,
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
    const queryLimpia = query.trim();

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
    query,
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
      query.trim();

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
    setBuscadorFocus(false);
  }

  /* ============================================================
     ENTER
     ============================================================ */

  async function buscarConEnter() {
    const queryLimpia =
      query.trim();

    if (
      queryLimpia.length <
      MIN_LARGO_QUERY_TEXTO
    ) {
      return;
    }

    /* ----------------------------------------------------------
       CASO 1:
       EXISTE UNA COINCIDENCIA LITERAL.
       Usamos la primera porque "resultados" ya está ordenado
       por relevancia.
       ---------------------------------------------------------- */

    if (resultados.length > 0) {
      elegir(resultados[0]);
      return;
    }

    /* ----------------------------------------------------------
       CASO 2:
       NO EXISTE NINGUNA COINCIDENCIA LITERAL.
       Enter activa la búsqueda semántica.
       ---------------------------------------------------------- */

    if (
      queryLimpia.length <
      MIN_LARGO_QUERY_SEMANTICO
    ) {
      return;
    }

    const resultadoSemantico =
      await buscarSemantico(
        queryLimpia
      );

    /* ----------------------------------------------------------
       SI ENCONTRAMOS UNA COINCIDENCIA SEMÁNTICA
       ---------------------------------------------------------- */

    if (resultadoSemantico) {
      elegir(resultadoSemantico);
    }
  }

  /* ============================================================
     NAVEGACIÓN CON FLECHAS
     ============================================================ */

  const {
    focusedIdx,
    handleKeyDown,
  } = useArrowKeyList(
    resultados,
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
    query.trim().length >=
    MIN_LARGO_QUERY_TEXTO;

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
            {resultados.length > 0 ? (
              resultados.map(
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
                        query
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

                      {matchTitulo ? (
                        <span className="theory-search__item-seccion">
                          <ResaltarCoincidencia
                            texto={
                              punto.seccionTitulo
                            }
                            query={
                              query
                            }
                          />
                        </span>
                      ) : matchTexto ? (
                        <span>
                          <ResaltarCoincidencia
                            texto={
                              punto.texto
                            }
                            query={
                              query
                            }
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
            ) : (
              <p className="theory-search__empty">
                No hay coincidencias
              </p>
            )}

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