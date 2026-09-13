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

export default function RepasoPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("hoy");
  const [searchOpen, setSearchOpen] = useState(false);
  const [log, setLog] = useState(() => leerLog());

  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    id: null,
    phase: 1
  });

  function irAMiEstudio(nombre) {
    navigate(`/?q=${encodeURIComponent(nombre)}`);
  }

  const { repasosHoy, proximos } = useMemo(
    () => clasificarRepasos(log),
    [log]
  );

  function marcar(
    id,
    intervaloIdx,
    repasosDoneActual
  ) {
    const repasosDone = Array.isArray(repasosDoneActual)
      ? [...repasosDoneActual]
      : [];

    if (!repasosDone.includes(intervaloIdx)) {
      repasosDone.push(intervaloIdx);
    }

    setLog(
      marcarRepasoHecho(
        id,
        repasosDone
      )
    );
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
      setDeleteState({
        ...deleteState,
        phase: 2
      });
    } else {
      setLog(
        eliminarRepaso(
          deleteState.id
        )
      );

      setDeleteState({
        isOpen: false,
        id: null,
        phase: 1
      });
    }
  }

  function cancelarBorrado() {
    setDeleteState({
      isOpen: false,
      id: null,
      phase: 1
    });
  }

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

  /*
   * TEMARIO
   */

  const [cursoTemario, setCursoTemario] = useState("");
  const [categoriaTemario, setCategoriaTemario] = useState("");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [semanaTemario, setSemanaTemario] = useState(1);
  const [enYoutube, setEnYoutube] = useState({});

  const selectRef = useRef(null);

  const cursosDeCategoria = useMemo(() => {
    if (!categoriaTemario) {
      return [];
    }

    const categoria = CATEGORIAS_TEMARIO.find(
      (cat) => cat.id === categoriaTemario
    );

    if (!categoria) {
      return [];
    }

    return categoria.cursos;
  }, [categoriaTemario]);

  useEffect(() => {
    function manejarClickFuera(e) {
      if (
        selectRef.current &&
        !selectRef.current.contains(e.target)
      ) {
        setSelectorAbierto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      manejarClickFuera
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        manejarClickFuera
      );
    };
  }, []);

  function elegirCategoria(catId) {
    if (catId !== categoriaTemario) {
      setCursoTemario("");
      setSemanaTemario(1);
    }

    setCategoriaTemario(catId);
    setSelectorAbierto(true);
  }

  function elegirCurso(nombre) {
    setCursoTemario(nombre);
    setSemanaTemario(1);
    setSelectorAbierto(false);
  }

  const temasSemana = useMemo(() => {
    if (!cursoTemario) {
      return [];
    }

    return (
      coursesSemanas[cursoTemario]?.[
        `semana_${semanaTemario}`
      ] || []
    );
  }, [cursoTemario, semanaTemario]);

  function claveTema(curso, semana, tema) {
    return `${curso}|${semana}|${tema}`;
  }

  function temaEstaProgramado(curso, semana, tema) {
    return log.some(
      (entrada) =>
        entrada.subject === curso &&
        entrada.tema === tema &&
        entrada.day === `Semana ${semana}`
    );
  }

  function abrirTemaEnYoutube(curso, tema) {
    const query = `${curso} ${tema} preuniversitario`;

    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        query
      )}`,
      "_blank"
    );

    setEnYoutube((prev) => ({
      ...prev,
      [claveTema(curso, semanaTemario, tema)]: true
    }));
  }

  function programarRepasoTemario(curso, tema) {
    registrarCursoCompletado({
      subject: curso,
      tema,
      day: `Semana ${semanaTemario}`
    });

    setLog(leerLog());
  }

  return (
    <main className="container__repaso">
      <div className="repaso container">

        <AppHeader
          section="repaso"
          onAbrirBuscador={() =>
            setSearchOpen(true)
          }
        />

        {/* PESTAÑAS */}

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

        {/* HOY */}

        {tab === "hoy" && (
          <section className="repaso__section">

            <div className="repaso__list">

              {repasosHoy.map(
                ({
                  entrada,
                  intervaloIdx,
                  vencido
                }) => {

                  const lc =
                    intervaloClasses(
                      intervaloIdx
                    );

                  const numRepaso =
                    intervaloIdx + 1;

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
                          {REPASO_INTERVALOS[intervaloIdx]}{" "}
                          día
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
                            intervaloIdx,
                            entrada.repasosDone
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
                          iniciarBorrado(
                            entrada.id
                          )
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
                  Vuelve mañana o completa más
                  cursos en el cronograma
                </p>

              </div>
            )}

          </section>
        )}

        {/* PRÓXIMOS */}

        {tab === "proximos" && (
          <section className="repaso__section">

            {proximos.length === 0 ? (
              <div className="repaso__empty">

                <div className="repaso__empty-emoji">
                  🎉
                </div>

                <p className="repaso__empty-title">
                  No tienes repasos pendientes hoy
                </p>

                <p className="repaso__empty-sub">
                  Vuelve mañana o completa más
                  cursos en el cronograma
                </p>

              </div>
            ) : (
              <div className="repaso__proximos-list">

                {Object.keys(porFecha)
                  .sort()
                  .map((fecha) => {

                    const grupo =
                      porFecha[fecha];

                    const diff =
                      diffDias(fecha);

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

                        <div>

                          {grupo.map(
                            ({
                              entrada,
                              intervaloIdx
                            }) => (

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
                                        —{" "}
                                        {entrada.tema}
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

                      </div>
                    );
                  })}

              </div>
            )}

          </section>
        )}

        {/* TEMARIO */}

        {tab === "temario" && (
          <section className="repaso__section">

            <div className="repaso__temario-toolbar">

              <div className="repaso__categoria-tabs">

                {CATEGORIAS_TEMARIO.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`repaso__categoria-tab ${
                      categoriaTemario === cat.id
                        ? "repaso__categoria-tab--active"
                        : ""
                    }`}
                    onClick={() =>
                      elegirCategoria(cat.id)
                    }
                  >
                    {cat.label}
                  </button>
                ))}

              </div>

              {cursoTemario && (
                <select
                  className="repaso__semana-select"
                  value={semanaTemario}
                  onChange={(e) =>
                    setSemanaTemario(
                      Number(e.target.value)
                    )
                  }
                >

                  {SEMANAS_TEMARIO.map((semana) => (
                    <option
                      key={semana}
                      value={semana}
                    >
                      Semana {semana}
                    </option>
                  ))}

                </select>
              )}

            </div>

            {categoriaTemario && selectorAbierto && (
              <div
                className="repaso__select"
                ref={selectRef}
              >

                <div className="repaso__select-menu">

                  {cursosDeCategoria.map((curso) => (
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
                  ))}

                </div>

              </div>
            )}

            {!cursoTemario && (
              <div className="repaso__empty">

                <div className="repaso__empty-emoji">
                  📚
                </div>

                <p className="repaso__empty-title">
                  Elige un curso
                </p>

                <p className="repaso__empty-sub">
                  Selecciona un curso para ver sus temas
                </p>

              </div>
            )}

            {cursoTemario && (
              <>

                <div className="repaso__temario-list">

                  {temasSemana.map((tema) => {

                    const programado =
                      temaEstaProgramado(
                        cursoTemario,
                        semanaTemario,
                        tema
                      );

                    const abierto =
                      Boolean(
                        enYoutube[
                          claveTema(
                            cursoTemario,
                            semanaTemario,
                            tema
                          )
                        ]
                      );

                    return (
                      <div
                        key={tema}
                        className={`repaso__temario-item ${
                          programado
                            ? "repaso__temario-item--done"
                            : ""
                        }`}
                      >

                        <span className="repaso__temario-item-check">
                          {programado ? "✓" : ""}
                        </span>

                        <span className="repaso__temario-item-nombre">
                          {tema}
                        </span>

                        {!programado && (
                          abierto ? (
                            <button
                              type="button"
                              className="repaso__temario-action repaso__temario-action--repaso"
                              onClick={() =>
                                programarRepasoTemario(
                                  cursoTemario,
                                  tema
                                )
                              }
                            >
                              Repaso
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="repaso__temario-action"
                              onClick={() =>
                                abrirTemaEnYoutube(
                                  cursoTemario,
                                  tema
                                )
                              }
                            >
                              Estudiar
                            </button>
                          )
                        )}

                      </div>
                    );
                  })}

                  {temasSemana.length === 0 && (
                    <p className="repaso__proximos-empty">
                      No se encontró ningún tema.
                    </p>
                  )}

                </div>

              </>
            )}

          </section>
        )}

        {/* BUSCADOR */}

        <SearchModal
          open={searchOpen}
          onClose={() =>
            setSearchOpen(false)
          }
          onSelect={(item) => {

            setSearchOpen(false);

            irAMiEstudio(
              item.type === "curso"
                ? item.nombre
                : item.tema
            );

          }}
        />

        {/* MODAL ELIMINAR */}

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

      </div>
    </main>
  );
}