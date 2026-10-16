import { filtrarLiteral, agregarSemanticos } from "../../lib/buscarNombres";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  puntajeDeTexto,
  buscarCoincidencia,
  buscarTypo,
  extraerFragmento,
} from "../../lib/buscador";
import {
  embeberTextos,
  embeberTexto,
  similitudCoseno,
} from "../../lib/semantico";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";
import GlossaryText from "./GlossaryText";
const MIN_LARGO_QUERY_TEXTO = 2;
// Detecta si el texto pide examen, ejercicios o ambos.
function tipoPedidoExamen(texto) {
  const t = String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const pideExamen = /examen/.test(t);
  const pideEjercicio = /ejercicio/.test(t);
  if (pideExamen && pideEjercicio) return "ambos";
  if (pideExamen) return "examen";
  if (pideEjercicio) return "ejercicio";
  return null;
}
const MIN_LARGO_QUERY_SEMANTICO = 4;
const UMBRAL_SIMILITUD = 0.60;
/* ============================================================
   RESALTAR COINCIDENCIA
   ============================================================ */
function contieneFormula(texto) {
  return (
    /\$\$[\s\S]*?\$\$/.test(texto) ||
    /\$[^$\n]+?\$/.test(texto) ||
    /\\\([\s\S]*?\\\)/.test(texto) ||
    /\\\[[\s\S]*?\\\]/.test(texto)
  );
}
export function ResaltarCoincidencia({
  texto,
  query,
  match,
  glosario,
}) {
  const textoOriginal = String(texto ?? "");
  if (
    !query?.trim() ||
    !match ||
    typeof match.indice !== "number" ||
    typeof match.largo !== "number" ||
    match.indice < 0 ||
    match.largo <= 0
  ) {
    return (
      <GlossaryText
        text={textoOriginal}
        glosario={glosario}
      />
    );
  }
  const { indice, largo } = match;
  const final = indice + largo;
  if (final > textoOriginal.length) {
    return (
      <GlossaryText
        text={textoOriginal}
        glosario={glosario}
      />
    );
  }
  // No dividir una fórmula LaTeX: hacerlo podría romper sus delimitadores.
  const formulas = [
    /\$\$[\s\S]*?\$\$/g,
    /\$[^$\n]+?\$/g,
    /\\\([\s\S]*?\\\)/g,
    /\\\[[\s\S]*?\\\]/g,
  ];
  const coincideDentroDeFormula = formulas.some((regex) => {
    let formula;
    while ((formula = regex.exec(textoOriginal)) !== null) {
      const inicioFormula = formula.index;
      const finalFormula = inicioFormula + formula[0].length;
      if (indice < finalFormula && final > inicioFormula) {
        return true;
      }
    }
    return false;
  });
  if (coincideDentroDeFormula) {
    return (
      <GlossaryText
        text={textoOriginal}
        glosario={glosario}
      />
    );
  }
  const antes = textoOriginal.slice(0, indice);
  const coincidencia = textoOriginal.slice(indice, final);
  const despues = textoOriginal.slice(final);
  return (
    <>
      {antes && (
        <GlossaryText
          text={antes}
          glosario={glosario}
        />
      )}
      <span className="search-match">
        <GlossaryText
          text={coincidencia}
          glosario={glosario}
        />
      </span>
      {despues && (
        <GlossaryText
          text={despues}
          glosario={glosario}
        />
      )}
    </>
  );
}
/* ============================================================
   THEORY SEARCH BAR
   ============================================================ */
const TheorySearchBar = forwardRef(function TheorySearchBar(
  {
    flatPuntos: flatPuntosBase = [],
    onSelect,
    placeholder = "Buscar título, texto o explicación...",
    modoChat = false,
    encabezado = null,
    onPedirExamen,
    glosario = {},
    temasDelCurso = null,
    temaActual = "",
    onCargarTema = null,
  },
  ref
) {
  const [modoElegirTema, setModoElegirTema] = useState(false);
  const [temaTemporal, setTemaTemporal] = useState(null);
  const [temasEncontrados, setTemasEncontrados] = useState([]);
  const [cargandoTema, setCargandoTema] = useState(false);
  const flatPuntos = temaTemporal ? temaTemporal.puntos : flatPuntosBase;
  const [query, setQuery] = useState("");
  const [buscadorFocus, setBuscadorFocus] = useState(false);
  const [buscandoSemantico, setBuscandoSemantico] = useState(false);
  const cacheEmbeddingsRef = useRef({
    flatPuntos: null,
    promesa: null,
  });
  const idPeticionRef = useRef(0);
  const inputRef = useRef(null);
  useEffect(() => {
    if (!modoChat) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [modoChat]);
  const [queryBuscada, setQueryBuscada] = useState("");
  const [rondaBusqueda, setRondaBusqueda] = useState(0);
  const [resultadoSemantico, setResultadoSemantico] = useState(null);
  const [busquedaLista, setBusquedaLista] = useState(false);
  const [tituloSeleccionado, setTituloSeleccionado] = useState(null);
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
    if (tituloSeleccionado) {
      return flatPuntos
        .filter(
          (punto) =>
            punto.seccionTitulo === tituloSeleccionado
        )
        .map((punto) => ({
          punto,
          textScore: 1,
          scoreTitulo: 1,
          scoreTexto: 0,
          scoreExplicacion: 0,
          matchTitulo: buscarCoincidencia(
            punto.seccionTitulo || "",
            tituloSeleccionado
          ),
          matchTexto: null,
          matchExplicacion: null,
          tieneCoincidenciaReal: true,
          soloExplicacion: false,
        }));
    }
    return flatPuntos
      .map((punto) => {
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
        const textScore = Math.max(
          scoreTitulo,
          scoreTexto,
          scoreExplicacion
        );
        const matchTitulo =
          buscarCoincidencia(punto.seccionTitulo || "", queryLimpia) ||
          buscarTypo(punto.seccionTitulo || "", queryLimpia);
        const matchTexto =
          buscarCoincidencia(punto.texto || "", queryLimpia) ||
          buscarTypo(punto.texto || "", queryLimpia);
        const matchExplicacion =
          buscarCoincidencia(punto.explicacion || "", queryLimpia) ||
          buscarTypo(punto.explicacion || "", queryLimpia);
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
      .filter(({ tieneCoincidenciaReal }) => tieneCoincidenciaReal);
  }, [
    flatPuntos,
    queryBuscada,
    hayQuery,
    tituloSeleccionado,
  ]);
  /* ============================================================
     RESULTADOS VISIBLES
     ============================================================ */
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
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8);
  }, [candidatosTexto, queryBuscada, hayQuery]);
  /* ============================================================
     BÚSQUEDA SEMÁNTICA
     ============================================================ */
  async function buscarSemantico(queryLimpia) {
    if (queryLimpia.length < MIN_LARGO_QUERY_SEMANTICO) {
      return null;
    }
    const miPeticion = ++idPeticionRef.current;
    setBuscandoSemantico(true);
    try {
      if (
        cacheEmbeddingsRef.current.flatPuntos !== flatPuntos
      ) {
        cacheEmbeddingsRef.current = {
          flatPuntos,
          promesa: embeberTextos(
            flatPuntos.map(
              (punto) =>
                `${punto.texto || ""} ${
                  punto.explicacion || ""
                }`.trim()
            )
          ),
        };
      }
      const [vectoresPuntos, vectorQuery] = await Promise.all([
        cacheEmbeddingsRef.current.promesa,
        embeberTexto(queryLimpia),
      ]);
      if (miPeticion !== idPeticionRef.current) {
        return null;
      }
      let mejorPunto = null;
      let mejorSimilitud = -Infinity;
      flatPuntos.forEach((punto, i) => {
        const vector = vectoresPuntos[i];
        if (!vector || !vectorQuery) {
          return;
        }
        const similitud = similitudCoseno(
          vectorQuery,
          vector
        );
        if (
          similitud >= UMBRAL_SIMILITUD &&
          similitud > mejorSimilitud
        ) {
          mejorSimilitud = similitud;
          mejorPunto = punto;
        }
      });
      if (!mejorPunto) {
        return null;
      }
      return {
        punto: mejorPunto,
        finalScore: mejorSimilitud * 700,
        soloExplicacion: false,
        esSemantico: true,
        similitud: mejorSimilitud,
      };
    } catch {
      return null;
    } finally {
      if (miPeticion === idPeticionRef.current) {
        setBuscandoSemantico(false);
      }
    }
  }
  /* ============================================================
     ELEGIR RESULTADO
     ============================================================ */
  function elegir(resultado) {
    const { punto } = resultado;
    const queryLimpia = queryBuscada.trim();
    const matchTexto =
      buscarCoincidencia(punto.texto || "", queryLimpia) ||
      buscarTypo(punto.texto || "", queryLimpia);
    const matchExplicacion =
      buscarCoincidencia(punto.explicacion || "", queryLimpia) ||
      buscarTypo(punto.explicacion || "", queryLimpia);
    let campo = null;
    let matchText = null;
    if (matchTexto) {
      campo = "texto";
      matchText = punto.texto.slice(
        matchTexto.indice,
        matchTexto.indice + matchTexto.largo
      );
    } else if (matchExplicacion) {
      campo = "explicacion";
      matchText = punto.explicacion.slice(
        matchExplicacion.indice,
        matchExplicacion.indice + matchExplicacion.largo
      );
    } else {
      campo = punto.explicacion ? "explicacion" : "texto";
    }
    onSelect({
      puntoId: punto.id,
      campo,
      matchText,
      temaTemporal,
    });
    setQuery("");
    setQueryBuscada("");
    setResultadoSemantico(null);
    setBuscadorFocus(false);
    setTituloSeleccionado(null);
  }
  /* ============================================================
     OTROS TEMAS DEL CURSO (solo modo chat)
     ============================================================ */
  useEffect(() => {
    if (!modoElegirTema) return undefined;
    const q = query.trim();
    const lista = temasDelCurso || [];
    if (!q) {
      setTemasEncontrados([]);
      return undefined;
    }
    const literales = filtrarLiteral(lista, q, (t) => t.tema);
    setTemasEncontrados(literales);
    let vigente = true;
    agregarSemanticos(lista, q, (t) => t.tema, literales).then((res) => {
      if (vigente) setTemasEncontrados(res);
    });
    return () => {
      vigente = false;
    };
  }, [query, modoElegirTema, temasDelCurso]);
  async function elegirTemaDelCurso(item) {
    if (!onCargarTema || cargandoTema) return;
    setCargandoTema(true);
    try {
      const puntos = await onCargarTema(item);
      setTemaTemporal({ ...item, puntos });
      setModoElegirTema(false);
      setTemasEncontrados([]);
      setTituloSeleccionado(null);
      setQuery("");
      setQueryBuscada("");
      setResultadoSemantico(null);
      setBusquedaLista(false);
    } catch {
      setQuery("");
    } finally {
      setCargandoTema(false);
    }
  }
  function volverTemaOriginal() {
    setTemaTemporal(null);
    setTituloSeleccionado(null);
    setQuery("");
    setQueryBuscada("");
    setResultadoSemantico(null);
    setBusquedaLista(false);
  }
  /* ============================================================
     SELECCIONAR TÍTULO DEL CHAT
     ============================================================ */
  function seleccionarTitulo(titulo) {
    setTituloSeleccionado(titulo);
    setQuery("");
    setResultadoSemantico(null);
    setBuscandoSemantico(false);
    setBusquedaLista(false);
    setQueryBuscada(titulo);
    setRondaBusqueda((r) => r + 1);
    setBuscadorFocus(true);
  }
  /* ============================================================
     ENTER
     ============================================================ */
  function ejecutarBusqueda(texto) {
    const queryLimpia = (
      typeof texto === "string" ? texto : query
    ).trim();
    if (queryLimpia.length < MIN_LARGO_QUERY_TEXTO) {
      return;
    }
    // Pedir examen o ejercicios abre ChatGPT con la teoría del tema.
    if (modoChat && onPedirExamen) {
      const tipo = tipoPedidoExamen(queryLimpia);
      if (tipo) {
        setQuery("");
        onPedirExamen(tipo);
        return;
      }
    }
    setTituloSeleccionado(null);
    setQuery(modoChat ? "" : queryLimpia);
    setResultadoSemantico(null);
    setBusquedaLista(false);
    setQueryBuscada(queryLimpia);
    setRondaBusqueda((r) => r + 1);
    setBuscadorFocus(true);
  }
  function buscarConEnter() {
    const queryLimpia = query.trim();
    if (modoElegirTema) {
      if (temasEncontrados.length > 0) {
        elegirTemaDelCurso(temasEncontrados[0]);
      }
      return;
    }
    if (modoChat && queryLimpia === "") {
      if (
        resultadosVisibles.length > 0 &&
        focusedIdx >= 0
      ) {
        elegir(resultadosVisibles[focusedIdx]);
      }
      return;
    }
    if (queryLimpia.length < MIN_LARGO_QUERY_TEXTO) {
      return;
    }
    if (
      !modoChat &&
      queryLimpia === queryBuscada &&
      resultadosVisibles.length > 0
    ) {
      elegir(
        resultadosVisibles[
          focusedIdx >= 0 ? focusedIdx : 0
        ]
      );
      return;
    }
    ejecutarBusqueda();
  }
  useImperativeHandle(ref, () => ({
    buscar: () => ejecutarBusqueda(),
  }));
  /* ============================================================
     SEMÁNTICO COMO RESPALDO
     ============================================================ */
  useEffect(() => {
    if (rondaBusqueda === 0 || !queryBuscada) {
      return undefined;
    }
    if (tituloSeleccionado) {
      setBusquedaLista(true);
      setBuscandoSemantico(false);
      return undefined;
    }
    if (resultados.length > 0) {
      setBusquedaLista(true);
      return undefined;
    }
    if (
      queryBuscada.length < MIN_LARGO_QUERY_SEMANTICO
    ) {
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
  }, [rondaBusqueda, tituloSeleccionado]);
  const resultadosVisibles =
    resultados.length > 0
      ? resultados
      : resultadoSemantico
        ? [resultadoSemantico]
        : [];
  /* ============================================================
     NAVEGACIÓN CON FLECHAS
     ============================================================ */
  const { focusedIdx, handleKeyDown } = useArrowKeyList(
    resultadosVisibles,
    (resultado) => elegir(resultado)
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
    if (e.key === "Enter") {
      e.preventDefault();
      buscarConEnter();
      return;
    }
    handleKeyDown(e);
  }
  /* ============================================================
     SUGERENCIAS DE TÍTULOS — SOLO MODO CHAT
     ============================================================ */
  const sugerenciasTitulos = useMemo(() => {
    const vistos = [];
    for (const p of flatPuntos) {
      if (
        p.seccionTitulo &&
        !vistos.includes(p.seccionTitulo)
      ) {
        vistos.push(p.seccionTitulo);
      }
    }
    return vistos;
  }, [flatPuntos]);
  /* ============================================================
     MOSTRAR RESULTADOS
     ============================================================ */
  const hayResultadosPendientes =
    resultadosVisibles.length > 0 ||
    buscandoSemantico ||
    busquedaLista;
  const mostrarDropdown =
    buscadorFocus &&
    hayQuery &&
    query.trim() === queryBuscada &&
    hayResultadosPendientes;
  const mostrarMensajesChat =
    hayQuery && hayResultadosPendientes;
  /* ============================================================
     ITEMS — TEXTO Y EXPLICACIÓN COMPLETOS
     ============================================================ */
  function renderItems() {
    return resultadosVisibles.map((r, idx) => {
      const {
        punto,
        matchTitulo,
        matchTexto,
        matchExplicacion,
      } = r;
      // Prioridad: si la palabra está en título y texto, se oculta el
      // título y se muestra el texto. Si además está en la explicación,
      // se muestra el texto y, debajo, solo un fragmento de la explicación
      // alrededor de la palabra.
      const hayTexto = !!matchTexto;
      const esTriple =
        !!matchTitulo && hayTexto && !!matchExplicacion;
      const mostrarTitulo = !!matchTitulo && !hayTexto;
      const mostrarTexto = !!punto.texto;
      const mostrarExplicacion =
        !!punto.explicacion &&
        (esTriple || !!matchExplicacion || !punto.texto);
      const textoExplicacion = esTriple
        ? extraerFragmento(punto.explicacion, matchExplicacion.indice)
        : punto.explicacion;
      const matchExplicacionMostrado = esTriple
        ? buscarCoincidencia(textoExplicacion, queryBuscada) ||
          buscarTypo(textoExplicacion, queryBuscada)
        : matchExplicacion;
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
          {mostrarTitulo && (
            <span className="theory-search__item-seccion">
              <strong>
                <ResaltarCoincidencia
                  texto={punto.seccionTitulo}
                  query={queryBuscada}
                  match={matchTitulo}
                  glosario={glosario}
                />
              </strong>
            </span>
          )}
          {mostrarTexto && (
            <span className="theory-search__item-seccion">
              <ResaltarCoincidencia
                texto={punto.texto}
                query={r.esSemantico ? "" : queryBuscada}
                match={r.esSemantico ? null : matchTexto}
                glosario={glosario}
              />
            </span>
          )}
          {mostrarExplicacion && (
            <span className="theory-search__item-texto">
              <ResaltarCoincidencia
                texto={textoExplicacion}
                query={r.esSemantico ? "" : queryBuscada}
                match={
                  r.esSemantico ? null : matchExplicacionMostrado
                }
                glosario={glosario}
              />
            </span>
          )}
        </button>
      );
    });
  }
  function renderElegirTema() {
    const q = query.trim();
    const nombreCurso = temasDelCurso?.[0]?.curso;
    return (
      <>
        {nombreCurso && (
          <p className="teoria-chat__hint">
            Busca otros temas del curso {nombreCurso}
          </p>
        )}
        {q !== "" && temasEncontrados.length > 0 && (
          <div className="theory-search__sugerencias">
            {temasEncontrados.map((t) => (
              <button
                key={t.archivo}
                type="button"
                className="theory-search__sugerencia"
                onClick={() => elegirTemaDelCurso(t)}
              >
                {t.tema}
              </button>
            ))}
          </div>
        )}
        {q !== "" && temasEncontrados.length === 0 && (
          <div className="theory-search__burbuja">
            No hay este tema. Intenta con otro tema.
          </div>
        )}
        {cargandoTema && (
          <div className="theory-search__burbuja">Cargando tema...</div>
        )}
        <button
          type="button"
          className="theory-search__sugerencia theory-search__sugerencia--secundaria"
          onClick={() => {
            setModoElegirTema(false);
            setQuery("");
          }}
        >
          Cancelar
        </button>
      </>
    );
  }
  const inputEl = (
    <input
      ref={inputRef}
      autoFocus={modoChat}
      autoComplete="off"
      type="search"
      name="buscar-teoria"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => setBuscadorFocus(true)}
      onBlur={() =>
        setTimeout(() => setBuscadorFocus(false), 150)
      }
      onKeyDown={onKeyDownInput}
      placeholder={
        modoElegirTema
          ? "Escribe el nombre de un tema de este curso"
          : placeholder
      }
      className={`theory-search__input ${
        mostrarDropdown ? "has-results" : ""
      }`}
    />
  );
  /* ============================================================
     RENDER — MODO CHAT
     ============================================================ */
  if (modoChat) {
    return (
      <div className="theory-search theory-search--chat">
        <div className="theory-search__mensajes">
          {encabezado}
          {modoElegirTema ? (
            renderElegirTema()
          ) : mostrarMensajesChat ? (
            <>
              <div className="theory-search__burbuja theory-search__burbuja--usuario">
                {queryBuscada}
              </div>
              {resultadosVisibles.length > 0 ? (
                renderItems()
              ) : busquedaLista && !buscandoSemantico ? (
                <div className="theory-search__burbuja">
                  No hay coincidencias. Intenta con otro tema.
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
              {temaTemporal && (
                <>
                  <p className="teoria-chat__hint">
                    Buscando en: {temaTemporal.tema}
                  </p>
                  <div className="theory-search__sugerencias">
                    <button
                      type="button"
                      className="theory-search__sugerencia"
                      onClick={volverTemaOriginal}
                    >
                      Volver a {temaActual}
                    </button>
                  </div>
                </>
              )}
              {sugerenciasTitulos.length > 0 && (
                <div className="theory-search__sugerencias">
                  {sugerenciasTitulos.slice(0, 3).map((titulo) => (
                    <button
                      key={titulo}
                      type="button"
                      className="theory-search__sugerencia"
                      onClick={() => seleccionarTitulo(titulo)}
                    >
                      {titulo}
                    </button>
                  ))}
                  {temasDelCurso && temasDelCurso.length > 0 && (
                    <button
                      type="button"
                      className="theory-search__sugerencia theory-search__sugerencia--secundaria"
                      onClick={() => {
                        setModoElegirTema(true);
                        setQuery("");
                      }}
                    >
                      Otros temas
                    </button>
                  )}
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
     RENDER — MODO NORMAL (MAPA DE TEMAS)
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