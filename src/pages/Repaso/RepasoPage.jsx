import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";
import { obtenerRecomendacionesHoy } from "../../lib/repasoRecomendado";
import {
  construirPromptRepaso,
  construirPromptJson,
  construirPromptExamen,
  copiarTexto
} from "../../lib/promptsRepaso";
import temarioSesiones from "../../data/coursesSemanas.json";
import {
  leerLog,
  marcarRepasoHecho,
  clasificarRepasos,
  intervaloClasses,
  formatearFecha,
  diffDias,
  REPASO_INTERVALOS,
  eliminarRepaso,
  leerRepasosVistos,
  marcarRepasoVisto,
  limpiarRepasoVisto,
  claveRepasoVisto
} from "../../lib/repasoStorage";
const TABS = [
  { id: "hoy", label: "Hoy" },
  { id: "proximos", label: "Próximos" },
  { id: "temario", label: "Temario" }
];
// ─────────────────────────────────────────────────────────────────────────
// Datos del temario (todo queda en esta pestaña).
// ─────────────────────────────────────────────────────────────────────────
const TODOS_LOS_CURSOS = [
  "Habilidad Verbal",
  "Lenguaje",
  "Literatura",
  "Filosofía",
  "Historia Universal",
  "Historia del Perú",
  "Geografía",
  "Educación Cívica",
  "Economía",
  "Psicología",
  "Biología",
  "Física",
  "Química",
  "Habilidad Lógico Matemático",
  "Aritmética",
  "Álgebra",
  "Geometría",
  "Trigonometría"
];

function numeroSemana(clave) {
  return parseInt(String(clave).replace("semana_", ""), 10);
}

// [{ semana: 1, temas: [...] }, …] en orden de semana.
function semanasDelCurso(curso) {
  const semanas = temarioSesiones[curso] || {};
  return Object.keys(semanas)
    .sort((a, b) => numeroSemana(a) - numeroSemana(b))
    .map((clave) => ({
      semana: numeroSemana(clave),
      temas: semanas[clave].flat().filter(Boolean)
    }));
}

// Cuántos temas hay antes de una semana (para no reiniciar la numeración).
function inicioSemana(curso, semana) {
  let acumulado = 0;
  for (const s of semanasDelCurso(curso)) {
    if (s.semana === semana) return acumulado;
    acumulado += s.temas.length;
  }
  return acumulado;
}

// Número de un tema dentro de su curso (para búsqueda y recomendados).
function numeroDeTema(curso, tema) {
  let acumulado = 0;
  for (const s of semanasDelCurso(curso)) {
    const i = s.temas.indexOf(tema);
    if (i !== -1) return acumulado + i + 1;
    acumulado += s.temas.length;
  }
  return null;
}

// Texto "Semana N: tema | tema" que esperan construirPromptRepaso y construirPromptJson.
function temarioTexto(curso) {
  return semanasDelCurso(curso)
    .map((s) => `Semana ${s.semana}: ${s.temas.join(" | ")}`)
    .join("\n");
}

const OPCIONES_SEMANA = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  value: String(n),
  label: `Semana ${n}`
}));

function sinAcentos(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────
// Select hecho desde cero (no usa <select> nativo).
// ─────────────────────────────────────────────────────────────────────────
function SelectPersonalizado({
  placeholder = "Elegir",
  valor,
  opciones,
  onCambiar,
  etiqueta,
  disabled = false,
  mostrarValor = true,
  copiadoAhora = false
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (disabled && abierto) setAbierto(false);
  }, [disabled, abierto]);

  useEffect(() => {
    if (!abierto) return;
    function cerrarSiFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    function cerrarConEscape(e) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", cerrarSiFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarSiFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  const actual = opciones.find((o) => o.value === valor);
  const mostrarActual = mostrarValor && actual;

  return (
    <div className="selp" ref={ref}>
      <button
        type="button"
        className={`selp__disparador${
          copiadoAhora ? " selp__disparador--ok" : ""
        }`}
        aria-label={etiqueta || placeholder}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        disabled={disabled}
        onClick={() => setAbierto((a) => !a)}
      >
        <span className={mostrarActual ? "" : "selp__placeholder"}>
          {mostrarActual ? actual.label : placeholder}
        </span>
        <span className="selp__flecha" aria-hidden="true">
          ▾
        </span>
      </button>
      {abierto && (
        <ul className="selp__menu" role="listbox">
          {opciones.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === valor}
              className={`selp__opcion ${
                o.value === valor ? "selp__opcion--activa" : ""
              } ${o.copiado ? "selp__opcion--copiado" : ""}`}
              onClick={() => {
                onCambiar(o.value);
                setAbierto(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Resalta la parte del texto que coincide con la búsqueda (sin acentos ni mayúsculas),
// igual que en el buscador general (clase search-match).
function ResaltarCoincidencia({ texto, query }) {
  const consulta = query.trim();
  if (!consulta) return texto;
  const indice = sinAcentos(texto).indexOf(sinAcentos(consulta));
  if (indice === -1) return texto;
  const largo = sinAcentos(consulta).length;
  return (
    <span>
      {texto.slice(0, indice)}
      <span className="search-match">{texto.slice(indice, indice + largo)}</span>
      {texto.slice(indice + largo)}
    </span>
  );
}

const PASOS_TEMARIO = [
  { value: "1", label: "Paso 1 · Apuntes" },
  { value: "2", label: "Paso 2 · JSON" },
  { value: "3", label: "Paso 3 · Examen" }
];

// Temas (curso + tema) que contienen el texto, sin acentos ni mayúsculas.
function buscarTemas(cursos, textoNorm) {
  const salida = [];
  cursos.forEach((c) =>
    semanasDelCurso(c).forEach((s) =>
      s.temas.forEach((t) => {
        if (sinAcentos(t).includes(textoNorm)) salida.push({ c, tema: t });
      })
    )
  );
  return salida;
}

export default function RepasoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("hoy");
  const [log, setLog] = useState(() => leerLog());
  const [searchOpen, setSearchOpen] = useState(false);
  const [repasosVistos, setRepasosVistos] = useState(() =>
    leerRepasosVistos()
  );
  const [confirmarMarcar, setConfirmarMarcar] = useState({
    isOpen: false,
    id: null,
    intervaloIdx: null,
    tema: ""
  });
  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    id: null,
    phase: 1
  });

  const [curso, setCurso] = useState(null);
  const [semana, setSemana] = useState("1");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false);
  const [pasosCopiados, setPasosCopiados] = useState({});
  // Aviso temporal "✓ Paso N copiado" en el select del tema recién copiado.
  const [avisoPaso, setAvisoPaso] = useState(null);
  const avisoTimer = useRef(null);
  const [avisoCopiado, setAvisoCopiado] = useState(null);
  const recomendados = useMemo(() => obtenerRecomendacionesHoy(), []);

  const opcionesCurso = TODOS_LOS_CURSOS.map((c) => ({ value: c, label: c }));
  const busquedaNorm = sinAcentos(busquedaAplicada.trim());
  // Sugerencias en vivo (solo la cajita; no cambian la lista).
  const sugerencias = useMemo(() => {
    const txt = sinAcentos(busqueda.trim());
    if (!txt) return [];
    return buscarTemas(TODOS_LOS_CURSOS, txt).slice(0, 6);
  }, [busqueda]);

  function aplicarBusqueda() {
    setBusquedaAplicada(busqueda);
    setSugerenciasAbiertas(false);
  }

  function elegirSugerencia(tema) {
    setBusqueda(tema);
    setBusquedaAplicada(tema);
    setSugerenciasAbiertas(false);
  }

  function elegirCurso(c) {
    setCurso(c);
  }

  async function copiar(id, texto, abrirClaude = false) {
    // Solo Investigar abre Claude; el paso JSON únicamente copia.
    // Se abre en la misma acción del clic (así el navegador no lo bloquea).
    if (abrirClaude) {
      window.open("https://claude.ai/new", "_blank", "noopener,noreferrer");
    }
    const ok = await copiarTexto(texto);
    if (ok) {
      setAvisoCopiado(id);
      setTimeout(() => setAvisoCopiado(null), 1600);
    }
    return ok;
  }

  // Pasos del flujo (una sola opción por tema): 1 apuntes, 2 JSON, 3 examen.
  // Solo el paso 1 abre Claude; los demás únicamente copian.
  function copiarPaso(c, tema, paso) {
    const clave = `${c}|${tema}`;
    let texto;
    if (paso === "1") {
      texto = construirPromptRepaso({
        curso: c,
        tema,
        temarioCurso: temarioTexto(c),
        paraJson: true
      });
    } else if (paso === "2") {
      texto = construirPromptJson({
        curso: c,
        tema,
        temarioCurso: temarioTexto(c)
      });
    } else {
      texto = construirPromptExamen({ curso: c, tema });
    }
    copiar(`paso${paso}|${clave}`, texto, paso === "1").then((ok) => {
      if (!ok) return;
      setPasosCopiados((prev) => ({
        ...prev,
        [clave]: { ...(prev[clave] || {}), [paso]: true }
      }));
      setAvisoPaso({ clave, paso });
      clearTimeout(avisoTimer.current);
      avisoTimer.current = setTimeout(() => setAvisoPaso(null), 2000);
    });
  }

  // `numero` es el número del tema dentro del curso (continuo entre semanas).
  // Si no se pasa (búsqueda y recomendados), se calcula con numeroDeTema.
  function filaTema({ c, tema, numero }) {
    const clave = `${c}|${tema}`;
    const n = numero ?? numeroDeTema(c, tema);
    const copiados = pasosCopiados[clave] || {};
    // Los pasos ya copiados van al final del menú, en verde.
    const opciones = [
      ...PASOS_TEMARIO.filter((p) => !copiados[p.value]),
      ...PASOS_TEMARIO.filter((p) => copiados[p.value])
    ].map((p) => ({ ...p, copiado: !!copiados[p.value] }));
    const avisando = avisoPaso && avisoPaso.clave === clave;
    return (
      <div
        key={clave}
        className={`repaso__temario-item${
          copiados["1"] ? " repaso__temario-item--success" : ""
        }`}
      >
        <div className="repaso__temario-info">
          <span className="repaso__temario-tema">
            {n != null && (
              <span className="repaso__temario-numero">{n}.</span>
            )}{" "}
            {tema}
          </span>
        </div>
        <div className="repaso__temario-acciones">
          <SelectPersonalizado
            etiqueta={`Pasos de ${tema}`}
            placeholder={
              avisando ? `✓ Paso ${avisoPaso.paso} copiado` : "Elegir paso"
            }
            copiadoAhora={!!avisando}
            valor={null}
            opciones={opciones}
            onCambiar={(paso) => copiarPaso(c, tema, paso)}
          />
        </div>
      </div>
    );
  }

  let contenido;
  if (busquedaNorm) {
    const coincidencias = buscarTemas(TODOS_LOS_CURSOS, busquedaNorm);
    contenido =
      coincidencias.length === 0 ? (
        <p className="repaso__temario-hint">
          Ningún tema coincide con la búsqueda.
        </p>
      ) : (
        coincidencias.map(({ c, tema }) => filaTema({ c, tema }))
      );
  } else if (curso) {
    const bloques = semanasDelCurso(curso)
      .filter((s) => String(s.semana) === semana)
      .map((s) => ({
        semana: s.semana,
        inicio: inicioSemana(curso, s.semana),
        temas: s.temas.filter(
          (t) => !busquedaNorm || sinAcentos(t).includes(busquedaNorm)
        )
      }))
      .filter((s) => s.temas.length > 0);
    contenido =
      bloques.length === 0 ? (
        <p className="repaso__temario-hint">Sin temas para mostrar.</p>
      ) : (
        bloques.map((b) => (
          <div key={b.semana} className="repaso__temario-semana">
            {b.temas.map((t, i) =>
              filaTema({ c: curso, tema: t, numero: b.inicio + i + 1 })
            )}
          </div>
        ))
      );
  } else {
    contenido =
      recomendados.length === 0 ? (
        <p className="repaso__temario-hint">
          No hay cursos recomendados para hoy. Elige una categoría y un curso.
        </p>
      ) : (
        <div className="repaso__temario-recomendados">
          {recomendados.map((r) => (
            <div key={r.curso} className="repaso__temario-semana">
              <h3 className="repaso__temario-semana-titulo">{r.curso}</h3>
              {r.temas.map((t) => filaTema({ c: r.curso, tema: t }))}
            </div>
          ))}
        </div>
      );
  }


  const { repasosHoy, proximos } = useMemo(
    () => clasificarRepasos(log),
    [log]
  );
  const porFecha = useMemo(() => {
    const map = {};
    proximos.forEach((item) => {
      if (!map[item.fecha]) {
        map[item.fecha] = [];
      }
      map[item.fecha].push(item);
    });
    return map;
  }, [proximos]);
  function irAMiEstudio(nombre) {
    navigate(`/?q=${encodeURIComponent(nombre)}`);
  }
  function marcar(id, intervaloIdx) {
    setLog(marcarRepasoHecho(id, [intervaloIdx]));
  }
  function irARepasarTema(id, intervaloIdx, nombre) {
    marcarRepasoVisto(id, intervaloIdx);
    setRepasosVistos((prev) => {
      const clave = claveRepasoVisto(id, intervaloIdx);
      return prev.includes(clave) ? prev : [...prev, clave];
    });
    irAMiEstudio(nombre);
  }
  function pedirMarcar(id, intervaloIdx, tema) {
    if (!repasosVistos.includes(claveRepasoVisto(id, intervaloIdx))) {
      return;
    }
    setConfirmarMarcar({ isOpen: true, id, intervaloIdx, tema });
  }
  function confirmarMarcarRepaso() {
    const { id, intervaloIdx } = confirmarMarcar;
    setLog(marcarRepasoHecho(id, [intervaloIdx]));
    limpiarRepasoVisto(id, intervaloIdx);
    setRepasosVistos((prev) =>
      prev.filter((c) => c !== claveRepasoVisto(id, intervaloIdx))
    );
    setConfirmarMarcar({
      isOpen: false,
      id: null,
      intervaloIdx: null,
      tema: ""
    });
  }
  function cancelarMarcarRepaso() {
    setConfirmarMarcar({
      isOpen: false,
      id: null,
      intervaloIdx: null,
      tema: ""
    });
  }
  function iniciarBorrado(id) {
    setDeleteState({
      isOpen: true,
      id,
      phase: 1
    });
  }
  function confirmarBorrado() {
    if (deleteState.phase === 1) {
      setDeleteState((prev) => ({
        ...prev,
        phase: 2
      }));
      return;
    }
    setLog(eliminarRepaso(deleteState.id));
    setDeleteState({
      isOpen: false,
      id: null,
      phase: 1
    });
  }
  function cancelarBorrado() {
    setDeleteState({
      isOpen: false,
      id: null,
      phase: 1
    });
  }
  const temarioJsx = (
    <section className="repaso__section repaso__temario-seccion">
      <div className="repaso__temario-toolbar">
        <div className="repaso__temario-selects">
        <SelectPersonalizado
          etiqueta="Curso"
          placeholder="Curso"
          valor={curso}
          opciones={opcionesCurso}
          onCambiar={elegirCurso}
        />
        <SelectPersonalizado
          etiqueta="Semana"
          placeholder="Semana"
          valor={semana}
          opciones={OPCIONES_SEMANA}
          onCambiar={setSemana}
          disabled={!curso}
        />
        </div>
        <div className="repaso__temario-buscar-wrap">
          <input
            type="search"
            className="repaso__temario-buscar"
            placeholder="Buscar tema…"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setSugerenciasAbiertas(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") aplicarBusqueda();
              if (e.key === "Escape") setSugerenciasAbiertas(false);
            }}
            onBlur={() =>
              setTimeout(() => setSugerenciasAbiertas(false), 150)
            }
          />
          {sugerenciasAbiertas && busqueda.trim() && (
            sugerencias.length > 0 ? (
              <ul className="repaso__temario-sugerencias" role="listbox">
                {sugerencias.map(({ c, tema }) => (
                  <li key={`${c}|${tema}`}>
                    <button
                      type="button"
                      className="repaso__temario-sugerencia"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => elegirSugerencia(tema)}
                    >
                      <span>
                      <ResaltarCoincidencia texto={tema} query={busqueda} />
                    </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="repaso__temario-sugerencias repaso__temario-sugerencias--vacia">
                Sin resultados
              </div>
            )
          )}
        </div>
      </div>
      <div className="repaso__temario-lista">{contenido}</div>
    </section>
  );

  return (
    <main className="container__repaso">
      <div className="repaso">
        <AppHeader
          section="repaso"
          onAbrirBuscador={() => setSearchOpen(true)}
        />
        <div className="repaso__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`repaso__tab ${
                tab === t.id
                  ? "repaso__tab--active"
                  : ""
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "hoy" && (
          <section className="repaso__section">
            <div className="repaso__list">
              {repasosHoy.map(
                ({ entrada, intervaloIdx, vencido }) => {
                  const lc = intervaloClasses(intervaloIdx);
                  const numRepaso = intervaloIdx + 1;
                  return (
                    <div
                      key={entrada.id}
                      className={`repaso__item ${lc.box}`}
                    >
                      <div className="repaso__item-body">
                        <div className="repaso__item-tags">
                          <span
                            className={`repaso__badge ${lc.badge}`}
                          >
                            Repaso {numRepaso}
                          </span>
                          {entrada.day && (
                            <span className="repaso__item-day">
                              {entrada.day}
                            </span>
                          )}
                          {vencido && (
                            <span className="repaso__item-overdue">
                              Vencido
                            </span>
                          )}
                        </div>
                        <h3 className="repaso__item-subject">
                          {entrada.subject}
                        </h3>
                        {entrada.tema && (
                          <p className="repaso__item-tema">
                            Tema: {entrada.tema}
                          </p>
                        )}
                        <p className="repaso__item-meta">
                          Repaso {numRepaso} de{" "}
                          {REPASO_INTERVALOS.length}
                          {" · "}
                          Intervalo{" "}
                          {REPASO_INTERVALOS[intervaloIdx]} día
                          {REPASO_INTERVALOS[intervaloIdx] > 1
                            ? "s"
                            : ""}
                        </p>
                        <button
                          onClick={() =>
                            irARepasarTema(
                              entrada.id,
                              intervaloIdx,
                              entrada.tema ||
                                entrada.subject
                            )
                          }
                          className="repaso__item-link"
                        >
                          <i className="bi bi-book" />
                          Repasar
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          pedirMarcar(
                            entrada.id,
                            intervaloIdx,
                            entrada.tema || entrada.subject
                          )
                        }
                        className="repaso__check"
                        aria-label="Marcar repaso como realizado"
                        title={
                          repasosVistos.includes(
                            claveRepasoVisto(entrada.id, intervaloIdx)
                          )
                            ? "Marcar repaso como realizado"
                            : "Primero dale a Repasar"
                        }
                        disabled={
                          !repasosVistos.includes(
                            claveRepasoVisto(entrada.id, intervaloIdx)
                          )
                        }
                      >
                        <svg
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          fill="none"
                          strokeWidth="2.5"
                          width="16"
                          height="16"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          iniciarBorrado(entrada.id)
                        }
                        className="repaso__trash"
                        aria-label="Eliminar repaso"
                        title="Eliminar repaso"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  );
                }
              )}
            </div>
            {repasosHoy.length === 0 && (
              <div className="repaso__empty">
                <div className="repaso__empty-emoji">
                  🎉
                </div>
                <p className="repaso__empty-title">
                  No tienes repasos pendientes hoy
                </p>
                <p className="repaso__empty-sub">
                  Vuelve mañana o completa más cursos en el
                  cronograma
                </p>
              </div>
            )}
          </section>
        )}
        {tab === "proximos" && (
          <section className="repaso__section">
            {proximos.length === 0 ? (
              <div className="repaso__empty">
                <div className="repaso__empty-emoji">
                  🎉
                </div>
                <p className="repaso__empty-title">
                  No tienes repasos próximos
                </p>
                <p className="repaso__empty-sub">
                  Cuando guardes temas, aquí verás cuándo te
                  toca repasarlos
                </p>
              </div>
            ) : (
              <div className="repaso__proximos-list">
                {Object.keys(porFecha)
                  .sort()
                  .map((fecha) => {
                    const grupo = porFecha[fecha];
                    const diff = diffDias(fecha);
                    const etiqueta =
                      diff === 1
                        ? "Mañana"
                        : `En ${diff} días`;
                    return (
                      <div
                        key={fecha}
                        className="repaso__proximos-group"
                      >
                        <div className="repaso__proximos-group-header">
                          <span className="repaso__proximos-fecha">
                            {formatearFecha(fecha)}
                          </span>
                          <span className="repaso__proximos-etiqueta">
                            {etiqueta}
                          </span>
                        </div>
                        {grupo.map(
                          ({ entrada, intervaloIdx }) => (
                            <div
                              key={entrada.id}
                              className="repaso__proximos-row"
                            >
                              <div className="repaso__proximos-row-content">
                                <span
                                  className={`repaso__dot ${
                                    intervaloClasses(
                                      intervaloIdx
                                    ).badge
                                  }`}
                                />
                                <span className="repaso__proximos-subject">
                                  {entrada.subject}
                                  {entrada.tema && (
                                    <span className="repaso__proximos-tema">
                                      {" "}
                                      — {entrada.tema}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  iniciarBorrado(
                                    entrada.id
                                  )
                                }
                                className="repaso__proximos-trash"
                                aria-label="Eliminar repaso"
                                title="Eliminar repaso"
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={(item) => {
            setSearchOpen(false);
            irAMiEstudio(
              item.type === "curso"
                ? item.nombre
                : item.tema
            );
          }}
        />
        {deleteState.isOpen && (
          <div className="delete-modal-overlay">
            <div className="delete-modal-content">
              <div className="delete-modal-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <h3 className="delete-modal-title">
                ¿Eliminar repaso?
              </h3>
              <p className="delete-modal-text">
                {deleteState.phase === 1
                  ? "Esta acción requiere confirmación. Selecciona Aceptar para continuar."
                  : "¡Atención! ¿Estás completamente seguro de borrarlo?"}
              </p>
              <div
                className={`delete-modal-buttons ${
                  deleteState.phase === 1
                    ? "delete-modal-buttons--reverse"
                    : ""
                }`}
              >
                <button
                  onClick={confirmarBorrado}
                  className={`btn-confirm ${
                    deleteState.phase === 1
                      ? "btn-confirm--phase1"
                      : "btn-confirm--phase2"
                  }`}
                >
                  {deleteState.phase === 1
                    ? "Aceptar"
                    : "Sí, borrar"}
                </button>
                <button
                  onClick={cancelarBorrado}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {tab === "temario" && temarioJsx}
        {confirmarMarcar.isOpen && (
          <div className="repaso__confirm-toast">
            <div className="repaso__confirm-toast-content">
              <div className="repaso__confirm-toast-info">
                <i className="fa-solid fa-calendar-check" />
                <div>
                  <strong>¿Seguro que quieres guardar?</strong>
                  <span>{confirmarMarcar.tema}</span>
                </div>
              </div>
              <div className="repaso__confirm-toast-actions">
                <button
                  type="button"
                  className="repaso__confirm-toast-cancel"
                  onClick={cancelarMarcarRepaso}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="repaso__confirm-toast-confirm"
                  onClick={confirmarMarcarRepaso}
                >
                  Sí, guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}