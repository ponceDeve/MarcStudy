import { useState, useRef, useEffect, useMemo } from "react";
import {
  puntajeDeTexto,
  buscarCoincidencia,
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
   useBuscadorTeoria
   ============================================================ */
// Lógica del buscador de teoría (compartida por TheorySearchBar y por el
// buscador del mapa de temas). Nada es en vivo, todo ocurre al buscar:
//
// 1. Mientras escribes no se busca ni se muestra nada.
// 2. Al buscar (Enter o botón "Buscar"):
//    - Se buscan coincidencias literales y se muestran como sugerencias.
//    - Si NO hay ninguna coincidencia literal, se hace la búsqueda
//      semántica y se muestra la más parecida como sugerencia.
// 3. Con las sugerencias visibles, Enter de nuevo elige la enfocada
//    (flechas) o la primera; también se puede hacer clic en una.
//
// onSelect recibe { puntoId, campo, matchText }.
export function useBuscadorTeoria(flatPuntos = [], onSelect) {
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
  // Lanza una búsqueda nueva con lo que hay escrito (la usa el botón
  // "Buscar" y también Enter cuando todavía no hay sugerencias).
  function ejecutarBusqueda() {
    const queryLimpia = query.trim();
    if (queryLimpia.length < MIN_LARGO_QUERY_TEXTO) {
      return;
    }
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
  // Vuelve el buscador a cero (cambió el tema, se cerró el modal, etc.).
  function reiniciar() {
    idPeticionRef.current += 1;
    setQuery("");
    setQueryBuscada("");
    setResultadoSemantico(null);
    setBusquedaLista(false);
    setBuscandoSemantico(false);
    setBuscadorFocus(false);
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
  return {
    query,
    setQuery,
    buscadorFocus,
    setBuscadorFocus,
    queryBuscada,
    resultadosVisibles,
    focusedIdx,
    buscandoSemantico,
    busquedaLista,
    mostrarDropdown,
    hayQuery,
    elegir,
    ejecutarBusqueda,
    onKeyDownInput,
    reiniciar,
  };
}
