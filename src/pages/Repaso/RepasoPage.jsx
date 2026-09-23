import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";
import coursesSemanas from "../../data/coursesSemanas.json";
import {
  leerLog,
  marcarRepasoHecho,
  registrarCursoCompletado,
  clasificarRepasos,
  intervaloClasses,
  formatearFecha,
  diffDias,
  REPASO_INTERVALOS,
  eliminarRepaso
} from "../../lib/repasoStorage";
import { obtenerRecomendacionesDia } from "../../lib/repasoRecomendado";
import {
  construirPromptRepaso,
  construirPromptJson,
  construirPromptExamen,
  copiarTexto
} from "../../lib/promptsRepaso";

const TABS = [
  { id: "hoy", label: "Hoy" },
  { id: "proximos", label: "Próximos" },
  { id: "temario", label: "Temario" }
];

const CATEGORIAS_TEMARIO = [
  {
    id: "letras",
    label: "Letras",
    cursos: [
      "Habilidad Verbal",
      "Lenguaje",
      "Literatura",
      "Historia Universal",
      "Historia del Perú",
      "Filosofía"
    ]
  },
  {
    id: "ciencias",
    label: "Ciencias",
    cursos: [
      "Biología",
      "Física",
      "Química",
      "Geografía",
      "Educación Cívica",
      "Psicología"
    ]
  },
  {
    id: "matematica",
    label: "Matemática",
    cursos: [
      "Habilidad Lógico Matemático",
      "Aritmética",
      "Álgebra",
      "Geometría",
      "Trigonometría",
      "Economía"
    ]
  }
];

const SEMANAS_TEMARIO = [1, 2, 3, 4, 5, 6, 7, 8];

const LABELS_CORTOS_TEMARIO = {
  "Habilidad Lógico Matemático": "R. Matemático",
  "Habilidad Verbal": "R. Verbal"
};

function labelCursoTemario(curso) {
  return LABELS_CORTOS_TEMARIO[curso] || curso;
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function RepasoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("hoy");
  const [log, setLog] = useState(() => leerLog());
  const [searchOpen, setSearchOpen] = useState(false);
  const [diaRecomendado, setDiaRecomendado] = useState(0);

  const [confirmarRepaso, setConfirmarRepaso] = useState({
    isOpen: false,
    curso: "",
    semana: null,
    tema: ""
  });

  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    id: null,
    phase: 1
  });

  const [cursoTemario, setCursoTemario] = useState("");
  const [categoriaTemario, setCategoriaTemario] = useState("");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [semanaSelectorAbierto, setSemanaSelectorAbierto] = useState(false);
  const [semanaTemario, setSemanaTemario] = useState(1);
  const [busquedaTemario, setBusquedaTemario] = useState("");
  const [temaSeleccionado, setTemaSeleccionado] = useState(null);
  const [busquedaTemarioAbierta, setBusquedaTemarioAbierta] = useState(false);
  const [copiadoKey, setCopiadoKey] = useState("");
  const [accionMenuAbierta, setAccionMenuAbierta] = useState("");

  const selectRef = useRef(null);
  const semanaRef = useRef(null);
  const buscadorTemarioRef = useRef(null);

  const recomendacionesHoy = useMemo(
    () => obtenerRecomendacionesDia(diaRecomendado),
    [diaRecomendado, log]
  );

  const recomendacionesConTemas = useMemo(
    () => recomendacionesHoy.filter((r) => r.temas.length > 0),
    [recomendacionesHoy]
  );

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

  const cursosDeCategoria = useMemo(() => {
    if (!categoriaTemario) return [];

    const categoria = CATEGORIAS_TEMARIO.find(
      (cat) => cat.id === categoriaTemario
    );

    return categoria ? categoria.cursos : [];
  }, [categoriaTemario]);

  const temasSemana = useMemo(() => {
    if (!cursoTemario) return [];

    return (
      coursesSemanas[cursoTemario]?.[`semana_${semanaTemario}`] || []
    );
  }, [cursoTemario, semanaTemario]);

  const numeroInicialSemana = useMemo(() => {
    if (!cursoTemario) return 1;

    let total = 0;

    for (let semana = 1; semana < semanaTemario; semana++) {
      total += (
        coursesSemanas[cursoTemario]?.[`semana_${semana}`] || []
      ).length;
    }

    return total + 1;
  }, [cursoTemario, semanaTemario]);

  function obtenerNumeroTema(curso, semana, indice) {
    let total = 0;

    for (let numeroSemana = 1; numeroSemana < semana; numeroSemana++) {
      total += (
        coursesSemanas[curso]?.[`semana_${numeroSemana}`] || []
      ).length;
    }

    return total + indice + 1;
  }

  const resultadosBusquedaTemario = useMemo(() => {
    const termino = normalizarTexto(busquedaTemario.trim());

    if (!termino) return [];

    const resultados = [];

    for (const [curso, semanas] of Object.entries(coursesSemanas)) {
      for (const [claveSemana, temas] of Object.entries(semanas || {})) {
        const numeroSemana = Number(
          claveSemana.replace("semana_", "")
        );

        for (let indice = 0; indice < (temas || []).length; indice++) {
          const tema = temas[indice];

          if (normalizarTexto(tema).includes(termino)) {
            resultados.push({
              curso,
              semana: numeroSemana,
              numeroTema: obtenerNumeroTema(
                curso,
                numeroSemana,
                indice
              ),
              tema
            });
          }
        }
      }
    }

    return resultados;
  }, [busquedaTemario]);

  const resultadoBusquedaTemario =
    resultadosBusquedaTemario[0] || null;

  const temasRecomendadosIniciales = useMemo(() => {
    const resultado = [];

    recomendacionesConTemas.forEach((recomendacion) => {
      const curso = recomendacion.curso;
      const semanas = coursesSemanas[curso] || {};

      recomendacion.temas.forEach((tema) => {
        let encontrado = null;

        for (const [claveSemana, temas] of Object.entries(semanas)) {
          const indice = (temas || []).indexOf(tema);

          if (indice !== -1) {
            const semana = Number(
              claveSemana.replace("semana_", "")
            );

            encontrado = {
              curso,
              semana,
              numeroTema: obtenerNumeroTema(
                curso,
                semana,
                indice
              ),
              tema
            };

            break;
          }
        }

        if (
          encontrado &&
          !resultado.some(
            (item) =>
              item.curso === encontrado.curso &&
              item.tema === encontrado.tema
          )
        ) {
          resultado.push(encontrado);
        }
      });
    });

    return resultado;
  }, [recomendacionesConTemas]);

  const mostrarTemarioInicial =
    !cursoTemario && !busquedaTemario.trim();

  const temasVisiblesTemario = useMemo(() => {
    if (temaSeleccionado) {
      return [temaSeleccionado];
    }

    if (busquedaTemario.trim()) {
      return resultadosBusquedaTemario;
    }

    if (!cursoTemario) {
      return temasRecomendadosIniciales;
    }

    return temasSemana.map((tema, indice) => ({
      curso: cursoTemario,
      semana: semanaTemario,
      numeroTema: numeroInicialSemana + indice,
      tema
    }));
  }, [
    temaSeleccionado,
    busquedaTemario,
    resultadosBusquedaTemario,
    cursoTemario,
    semanaTemario,
    temasSemana,
    numeroInicialSemana,
    temasRecomendadosIniciales
  ]);

  const cursoSelectorTemario =
    cursoTemario || resultadoBusquedaTemario?.curso || "";

  const semanaSelectorTemario = cursoTemario
    ? semanaTemario
    : resultadoBusquedaTemario?.semana || 1;

  const semanaHabilitada =
    Boolean(cursoTemario) || Boolean(resultadoBusquedaTemario);

  useEffect(() => {
    function manejarClickFuera(e) {
      if (
        selectRef.current &&
        !selectRef.current.contains(e.target)
      ) {
        setSelectorAbierto(false);
      }

      if (
        semanaRef.current &&
        !semanaRef.current.contains(e.target)
      ) {
        setSemanaSelectorAbierto(false);
      }

      if (
        buscadorTemarioRef.current &&
        !buscadorTemarioRef.current.contains(e.target)
      ) {
        setBusquedaTemarioAbierta(false);
      }

      if (!e.target.closest(".repaso__temario-accion-wrapper")) {
        setAccionMenuAbierta("");
      }
    }

    document.addEventListener("mousedown", manejarClickFuera);

    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
    };
  }, []);

  function irAMiEstudio(nombre) {
    navigate(`/?q=${encodeURIComponent(nombre)}`);
  }

  function marcar(id, intervaloIdx) {
    setLog(marcarRepasoHecho(id, [intervaloIdx]));
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

  function elegirCategoria(catId) {
    setCategoriaTemario(catId);
    setCursoTemario("");
    setSemanaTemario(1);
    setTemaSeleccionado(null);
    setBusquedaTemario("");
    setSelectorAbierto(true);
    setSemanaSelectorAbierto(false);
  }

  function elegirCurso(nombre) {
    const categoria = CATEGORIAS_TEMARIO.find((cat) =>
      cat.cursos.includes(nombre)
    );

    setCursoTemario(nombre);
    setCategoriaTemario(categoria?.id || "");
    setSemanaTemario(1);
    setTemaSeleccionado(null);
    setBusquedaTemario("");
    setSelectorAbierto(false);
  }

  function volverCategorias() {
    setCategoriaTemario("");
    setCursoTemario("");
    setSemanaTemario(1);
    setTemaSeleccionado(null);
    setBusquedaTemario("");
    setSelectorAbierto(true);
    setSemanaSelectorAbierto(false);
  }

  function elegirSemana(semana) {
    const cursoBusqueda = resultadoBusquedaTemario?.curso;

    const categoriaBusqueda = CATEGORIAS_TEMARIO.find((cat) =>
      cat.cursos.includes(cursoBusqueda)
    );

    if (!cursoTemario && cursoBusqueda) {
      setCursoTemario(cursoBusqueda);
      setCategoriaTemario(categoriaBusqueda?.id || "");
    }

    setSemanaTemario(semana);
    setTemaSeleccionado(null);
    setSemanaSelectorAbierto(false);
    setBusquedaTemario("");
    setBusquedaTemarioAbierta(false);
  }

  function seleccionarResultadoBusqueda(resultado) {
    const categoria = CATEGORIAS_TEMARIO.find((cat) =>
      cat.cursos.includes(resultado.curso)
    );

    setCategoriaTemario(categoria?.id || "");
    setCursoTemario(resultado.curso);
    setSemanaTemario(resultado.semana);

    setTemaSeleccionado({
      curso: resultado.curso,
      semana: resultado.semana,
      numeroTema: resultado.numeroTema,
      tema: resultado.tema
    });

    setBusquedaTemarioAbierta(false);
    setSelectorAbierto(false);
    setSemanaSelectorAbierto(false);
  }

  function manejarBusquedaTemarioKeyDown(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();
    setBusquedaTemarioAbierta(false);
  }

  function limpiarBusquedaTemario() {
    setBusquedaTemario("");
    setBusquedaTemarioAbierta(false);
  }

  function resaltarCoincidencia(texto) {
    const termino = busquedaTemario.trim();

    if (!termino) return texto;

    const terminoNormalizado = normalizarTexto(termino);
    const partes = [];
    let posicion = 0;

    while (posicion < texto.length) {
      const posicionNormalizada = normalizarTexto(
        texto.slice(posicion)
      ).indexOf(terminoNormalizado);

      if (posicionNormalizada === -1) {
        partes.push(
          <span key={posicion}>
            {texto.slice(posicion)}
          </span>
        );
        break;
      }

      let inicio = posicion;
      let caracteresNormalizados = 0;

      while (
        inicio < texto.length &&
        caracteresNormalizados < posicionNormalizada
      ) {
        caracteresNormalizados += normalizarTexto(
          texto[inicio]
        ).length;
        inicio++;
      }

      if (inicio > posicion) {
        partes.push(
          <span key={`${posicion}-antes`}>
            {texto.slice(posicion, inicio)}
          </span>
        );
      }

      let fin = inicio;
      let longitudNormalizada = 0;

      while (
        fin < texto.length &&
        longitudNormalizada < terminoNormalizado.length
      ) {
        longitudNormalizada += normalizarTexto(
          texto[fin]
        ).length;
        fin++;
      }

      partes.push(
        <mark
          key={`${inicio}-${fin}`}
          className="repaso__temario-search-highlight"
        >
          {texto.slice(inicio, fin)}
        </mark>
      );

      posicion = fin;
    }

    return partes;
  }

  function temaEstaRecomendadoHoy(curso, tema) {
    return recomendacionesHoy.some(
      (r) =>
        r.curso === curso &&
        r.temas.includes(tema)
    );
  }

  function temaEstaProgramado(curso, semana, tema) {
    return log.some(
      (entrada) =>
        entrada.subject === curso &&
        entrada.tema === tema &&
        entrada.day === `Semana ${semana}`
    );
  }

  function abrirConfirmacionRepaso(curso, semana, tema) {
    if (temaEstaProgramado(curso, semana, tema)) return;

    setConfirmarRepaso({
      isOpen: true,
      curso,
      semana,
      tema
    });
  }

  function cancelarProgramacionRepaso() {
    setConfirmarRepaso({
      isOpen: false,
      curso: "",
      semana: null,
      tema: ""
    });
  }

  function confirmarProgramacionRepaso() {
    if (
      !confirmarRepaso.curso ||
      !confirmarRepaso.tema ||
      !confirmarRepaso.semana
    ) {
      cancelarProgramacionRepaso();
      return;
    }

    registrarCursoCompletado({
      subject: confirmarRepaso.curso,
      tema: confirmarRepaso.tema,
      day: `Semana ${confirmarRepaso.semana}`
    });

    setLog(leerLog());
    cancelarProgramacionRepaso();
  }

  function abrirTemaEnYoutube(curso, tema) {
    const query = `${curso} ${tema} preuniversitario`;

    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        query
      )}`,
      "_blank"
    );
  }

  function armarTemarioCurso(curso) {
    return Object.entries(coursesSemanas[curso] || {})
      .map(([claveSemana, temas]) => {
        const numeroSemana = claveSemana.replace("semana_", "");

        return `Semana ${numeroSemana}: ${(temas || []).join(
          " | "
        )}`;
      })
      .join("\n");
  }

  async function copiarPasoJson(paso, curso, tema) {
    const texto =
      paso === 1
        ? construirPromptRepaso({
            curso,
            tema,
            temarioCurso: armarTemarioCurso(curso),
            paraJson: true
          })
        : paso === 3
          ? construirPromptExamen({ curso, tema })
          : construirPromptJson({ curso, tema });

    const clave = `${curso}|${tema}|${paso}`;
    const ok = await copiarTexto(texto);

    if (!ok) {
      window.alert("No se pudo copiar al portapapeles.");
      return;
    }

    setCopiadoKey(clave);

    setTimeout(() => {
      setCopiadoKey((actual) =>
        actual === clave ? "" : actual
      );
    }, 2000);
  }

  function abrirPaso1EnChatGPT(curso, tema) {
    const prompt = construirPromptRepaso({
      curso,
      tema,
      temarioCurso: armarTemarioCurso(curso)
    });

    window.open(
      `https://chatgpt.com/?q=${encodeURIComponent(
        prompt
      )}&hints=search`,
      "_blank"
    );

    copiarTexto(prompt);
  }

  function renderTemaItem(
    {
      curso,
      semana,
      numeroTema,
      tema
    },
    mostrarNumero = true,
    mostrarRecomendado = false
  ) {
    const programado = temaEstaProgramado(
      curso,
      semana,
      tema
    );

    const recomendadoHoy =
      !programado &&
      mostrarRecomendado &&
      temaEstaRecomendadoHoy(curso, tema);

    const claveAccion = `${curso}|${semana}|${tema}`;
    const menuAbierto = accionMenuAbierta === claveAccion;

    return (
      <div
        key={`${curso}|${semana}|${tema}`}
        className={`repaso__temario-item ${
          programado
            ? "repaso__temario-item--done"
            : recomendadoHoy
              ? "repaso__temario-item--recomendado"
              : ""
        }`}
      >
        <div className="repaso__temario-item-content">
          <button
            type="button"
            className="repaso__temario-item-nombre-button"
            onClick={() =>
              abrirConfirmacionRepaso(
                curso,
                semana,
                tema
              )
            }
            disabled={programado}
          >
            {mostrarNumero && (
              <span className="repaso__temario-item-numero">
                {numeroTema})
              </span>
            )}{" "}
            {tema}
          </button>
        </div>

        {!programado && (
          <div className="repaso__temario-actions">
            <button
              type="button"
              className="repaso__temario-action"
              onClick={() =>
                abrirTemaEnYoutube(curso, tema)
              }
            >
              ▶ YouTube
            </button>

            <div className="repaso__temario-accion-wrapper">
              <button
                type="button"
                className="repaso__temario-action"
                onClick={() =>
                  setAccionMenuAbierta((actual) =>
                    actual === claveAccion ? "" : claveAccion
                  )
                }
              >
                🤖 Prompts
                <i className="fa-solid fa-chevron-down" />
              </button>

              {menuAbierto && (
                <div className="repaso__temario-accion-menu">
                  <button
                    type="button"
                    className="repaso__temario-accion-menu-item"
                    onClick={() => {
                      abrirPaso1EnChatGPT(curso, tema);
                      setAccionMenuAbierta("");
                    }}
                  >
                    🤖 Investigar
                  </button>

                  <button
                    type="button"
                    className="repaso__temario-accion-menu-item"
                    onClick={() =>
                      copiarPasoJson(2, curso, tema)
                    }
                  >
                    {copiadoKey === `${curso}|${tema}|2`
                      ? "✅ Copiado"
                      : "📋 Copiar JSON"}
                  </button>

                  <button
                    type="button"
                    className="repaso__temario-accion-menu-item"
                    onClick={() =>
                      copiarPasoJson(3, curso, tema)
                    }
                  >
                    {copiadoKey === `${curso}|${tema}|3`
                      ? "✅ Copiado"
                      : "📄 Copiar Examen"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

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
                            irAMiEstudio(
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
                          marcar(
                            entrada.id,
                            intervaloIdx
                          )
                        }
                        className="repaso__check"
                        aria-label="Marcar repaso como realizado"
                        title="Marcar repaso como realizado"
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

        {tab === "temario" && (
          <section className="repaso__section">
            <div className="repaso__temario-toolbar">
              <div
                className="repaso__categoria-wrapper"
                ref={selectRef}
              >
                <button
                  type="button"
                  className={`repaso__categoria-tab ${
                    selectorAbierto
                      ? "repaso__categoria-tab--active"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectorAbierto((prev) => !prev);
                    setSemanaSelectorAbierto(false);
                  }}
                >
                  {cursoSelectorTemario
                    ? labelCursoTemario(
                        cursoSelectorTemario
                      )
                    : categoriaTemario
                      ? CATEGORIAS_TEMARIO.find(
                          (cat) =>
                            cat.id === categoriaTemario
                        )?.label
                      : "Curso"}

                  <i className="fa-solid fa-chevron-down" />
                </button>

                {selectorAbierto && (
                  <div className="repaso__select">
                    <div className="repaso__select-menu">
                      {!categoriaTemario ? (
                        CATEGORIAS_TEMARIO.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className="repaso__select-option"
                            onClick={() =>
                              elegirCategoria(cat.id)
                            }
                          >
                            {cat.label}
                          </button>
                        ))
                      ) : (
                        <>
                          <button
                            type="button"
                            className="repaso__select-back"
                            onClick={volverCategorias}
                          >
                            <i className="fa-solid fa-arrow-left" />
                            Categorías
                          </button>

                          {cursosDeCategoria.map(
                            (curso) => (
                              <button
                                key={curso}
                                type="button"
                                className={`repaso__select-option ${
                                  cursoTemario === curso
                                    ? "repaso__select-option--active"
                                    : ""
                                }`}
                                onClick={() =>
                                  elegirCurso(curso)
                                }
                              >
                                {labelCursoTemario(curso)}
                              </button>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="repaso__categoria-wrapper"
                ref={semanaRef}
              >
                <button
                  type="button"
                  disabled={!semanaHabilitada}
                  className={`repaso__categoria-tab ${
                    semanaSelectorAbierto
                      ? "repaso__categoria-tab--active"
                      : ""
                  }`}
                  onClick={() => {
                    if (!semanaHabilitada) return;

                    if (
                      !cursoTemario &&
                      resultadoBusquedaTemario
                    ) {
                      const categoria =
                        CATEGORIAS_TEMARIO.find((cat) =>
                          cat.cursos.includes(
                            resultadoBusquedaTemario.curso
                          )
                        );

                      setCursoTemario(
                        resultadoBusquedaTemario.curso
                      );

                      setCategoriaTemario(
                        categoria?.id || ""
                      );

                      setSemanaTemario(
                        resultadoBusquedaTemario.semana
                      );

                      setTemaSeleccionado({
                        curso:
                          resultadoBusquedaTemario.curso,
                        semana:
                          resultadoBusquedaTemario.semana,
                        numeroTema:
                          resultadoBusquedaTemario.numeroTema,
                        tema:
                          resultadoBusquedaTemario.tema
                      });
                    }

                    setSemanaSelectorAbierto(
                      (prev) => !prev
                    );

                    setSelectorAbierto(false);
                  }}
                >
                  Semana {semanaSelectorTemario}

                  <i className="fa-solid fa-chevron-down" />
                </button>

                {semanaSelectorAbierto &&
                  semanaHabilitada && (
                    <div className="repaso__select">
                      <div className="repaso__select-menu">
                        {SEMANAS_TEMARIO.map((semana) => (
                          <button
                            key={semana}
                            type="button"
                            className={`repaso__select-option ${
                              semanaSelectorTemario ===
                              semana
                                ? "repaso__select-option--active"
                                : ""
                            }`}
                            onClick={() =>
                              elegirSemana(semana)
                            }
                          >
                            Semana {semana}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div
                className="repaso__temario-search"
                ref={buscadorTemarioRef}
              >
                <div className="repaso__temario-search-input">
                  <i className="fa-solid fa-magnifying-glass" />

                  <input
                    type="text"
                    value={busquedaTemario}
                    placeholder="Buscar tema..."
                    onChange={(e) => {
                      setBusquedaTemario(e.target.value);
                      setTemaSeleccionado(null);
                      setBusquedaTemarioAbierta(true);
                    }}
                    onFocus={() => {
                      if (busquedaTemario.trim()) {
                        setBusquedaTemarioAbierta(true);
                      }
                    }}
                    onKeyDown={
                      manejarBusquedaTemarioKeyDown
                    }
                    aria-label="Buscar tema en el temario"
                  />

                  {busquedaTemario && (
                    <button
                      type="button"
                      onClick={limpiarBusquedaTemario}
                      aria-label="Limpiar búsqueda"
                      title="Limpiar búsqueda"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>

                {busquedaTemarioAbierta &&
                  busquedaTemario.trim() && (
                    <div className="repaso__temario-search-results">
                      {resultadosBusquedaTemario.length > 0 ? (
                        resultadosBusquedaTemario
                          .slice(0, 8)
                          .map((resultado) => (
                            <button
                              key={`${resultado.curso}|${resultado.semana}|${resultado.tema}`}
                              type="button"
                              className="repaso__temario-search-result"
                              onClick={() =>
                                seleccionarResultadoBusqueda(
                                  resultado
                                )
                              }
                            >
                              <span className="repaso__temario-search-result-tema">
                                {resaltarCoincidencia(
                                  resultado.tema
                                )}
                              </span>

                              <span className="repaso__temario-search-result-meta">
                                {labelCursoTemario(
                                  resultado.curso
                                )}
                                {" · "}
                                Semana {resultado.semana}
                                {" · "}
                                Tema{" "}
                                {String(
                                  resultado.numeroTema
                                ).padStart(2, "0")}
                              </span>
                            </button>
                          ))
                      ) : (
                        <div className="repaso__temario-search-empty">
                          No se encontró ningún tema.
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {mostrarTemarioInicial && (
              <>
                <div className="repaso__temario-recomendado-nav">
                  {diaRecomendado === 1 && (
                    <button
                      type="button"
                      className="repaso__temario-recomendado-nav-button"
                      onClick={() =>
                        setDiaRecomendado(0)
                      }
                      aria-label="Día anterior"
                    >
                      <i className="bi bi-arrow-left" />
                      Anterior
                    </button>
                  )}

                  {diaRecomendado === 0 && (
                    <button
                      type="button"
                      className="repaso__temario-recomendado-nav-button"
                      onClick={() =>
                        setDiaRecomendado(1)
                      }
                      aria-label="Día siguiente"
                    >
                      Siguiente
                      <i className="bi bi-arrow-right" />
                    </button>
                  )}
                </div>

                <div className="repaso__temario-list">
                  {(() => {
                    const grupos =
                      temasRecomendadosIniciales.reduce(
                        (acumulado, item) => {
                          if (!acumulado[item.curso]) {
                            acumulado[item.curso] = [];
                          }

                          acumulado[item.curso].push(item);

                          return acumulado;
                        },
                        {}
                      );

                    return Object.entries(grupos).map(
                      ([curso, temas]) => (
                        <div
                          key={curso}
                          className="repaso__temario-grupo"
                        >
                          <div className="repaso__temario-grupo-nombre">
                            {labelCursoTemario(curso)}
                          </div>

                          <div className="repaso__temario-list">
                            {temas.map((item) =>
                              renderTemaItem(
                                item,
                                false,
                                false
                              )
                            )}
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {temasRecomendadosIniciales.length === 0 && (
                    <p className="repaso__proximos-empty">
                      No tienes temas pendientes para este día.
                    </p>
                  )}
                </div>
              </>
            )}

            {(cursoTemario || busquedaTemario.trim()) && (
              <div className="repaso__temario-list">
                {temasVisiblesTemario.map((item) =>
                  renderTemaItem(
                    item,
                    true,
                    true
                  )
                )}

                {temasVisiblesTemario.length === 0 && (
                  <p className="repaso__proximos-empty">
                    No se encontró ningún tema.
                  </p>
                )}
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

        {confirmarRepaso.isOpen && (
          <div className="repaso__confirm-toast">
            <div className="repaso__confirm-toast-content">
              <div className="repaso__confirm-toast-info">
                <i className="fa-solid fa-calendar-check" />

                <div>
                  <strong>Guardar repaso</strong>
                  <span>{confirmarRepaso.tema}</span>
                </div>
              </div>

              <div className="repaso__confirm-toast-actions">
                <button
                  type="button"
                  className="repaso__confirm-toast-cancel"
                  onClick={cancelarProgramacionRepaso}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="repaso__confirm-toast-confirm"
                  onClick={confirmarProgramacionRepaso}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}