import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  DIAS_SEMANA,
  DIA_LABELS,
  MAX_CURSOS_POR_DIA,
  LIMITE_NOMBRE_CURSO,
  leerHorario,
  guardarHorario,
} from "../../lib/scheduleStorage";
import manifest from "../../data/manifest.json";
import { buscarConPuntaje, normalizarTexto } from "../../lib/buscador";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";

const OPCIONES_POMODOROS = [1, 2, 3, 4, 5, 6];

export default function ScheduleEditor() {
  const navigate = useNavigate();
  const [nombreUsuario] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const nombreMostrar = nombreUsuario
    ? nombreUsuario.charAt(0).toUpperCase() + nombreUsuario.slice(1)
    : "Horario";

  const [horarioInicial, setHorarioInicial] = useState(
    () => leerHorario() || {}
  );
  const [horario, setHorario] = useState(
    () => leerHorario() || {}
  );
  const [diaActivo, setDiaActivo] = useState(() => {
    const hoy = new Date();
    const indiceDia = (hoy.getDay() + 6) % 7;
    return DIAS_SEMANA[indiceDia];
  });

  const [showForm, setShowForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [nombreCurso, setNombreCurso] = useState("");
  const [pomodoros, setPomodoros] = useState(4);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(null);
  const [salidaPendiente, setSalidaPendiente] = useState(null);
  const [cursoOriginal, setCursoOriginal] = useState(null);

  const [mostrarNoCambios, setMostrarNoCambios] = useState(false);
  const [mostrarNoCambiosCurso, setMostrarNoCambiosCurso] =
    useState(false);

  const hayCambiosSinGuardar =
    JSON.stringify(horario) !==
    JSON.stringify(horarioInicial || {});

  const cursosDelDia = horario[diaActivo] || [];

  const nombreExcedido =
    nombreCurso.length > LIMITE_NOMBRE_CURSO;

  const puedeAgregarMas =
    cursosDelDia.length < MAX_CURSOS_POR_DIA;

  const sugerencias = nombreCurso.trim()
    ? buscarConPuntaje(
        manifest.cursos,
        nombreCurso,
        (c) => c.nombre
      ).slice(0, 6)
    : [];

  const coincideExacto = manifest.cursos.some(
    (c) =>
      normalizarTexto(c.nombre) ===
      normalizarTexto(nombreCurso)
  );

  const cursoSinCambios =
    editingIdx !== null &&
    cursoOriginal &&
    normalizarTexto(nombreCurso.trim()) ===
      normalizarTexto(cursoOriginal.subject) &&
    pomodoros === cursoOriginal.pomodoros;

  function mostrarMensajeNoCambios() {
    setMostrarNoCambios(true);

    setTimeout(() => {
      setMostrarNoCambios(false);
    }, 2200);
  }

  function mostrarMensajeNoCambiosCurso() {
    setMostrarNoCambiosCurso(true);

    setTimeout(() => {
      setMostrarNoCambiosCurso(false);
    }, 2200);
  }

  function guardarTodo() {
    if (!hayCambiosSinGuardar) {
      mostrarMensajeNoCambios();
      return;
    }

    guardarHorario(horario);
    setHorarioInicial(horario);
    navigate(-1);
  }

  function intentarCerrar() {
    if (hayCambiosSinGuardar) {
      setSalidaPendiente("cerrar");
    } else {
      navigate(-1);
    }
  }

  function resolverSalida(guardarAntes) {
    if (guardarAntes) {
      guardarHorario(horario);
      setHorarioInicial(horario);
    }

    setSalidaPendiente(null);
    navigate(-1);
  }

  function cambiarDia(dia) {
    setDiaActivo(dia);
    setShowForm(false);
    setConfirmandoBorrar(null);
    setCursoOriginal(null);
    setMostrarNoCambiosCurso(false);
  }

  function abrirFormulario(idx = null) {
    setMostrarNoCambiosCurso(false);

    if (idx !== null) {
      const curso = cursosDelDia[idx];

      setEditingIdx(idx);
      setNombreCurso(curso.subject);
      setPomodoros(curso.pomodoros);

      setCursoOriginal({
        subject: curso.subject,
        pomodoros: curso.pomodoros,
      });
    } else {
      setEditingIdx(null);
      setNombreCurso("");
      setPomodoros(4);
      setCursoOriginal(null);
    }

    setSugerenciaActiva(-1);
    setShowForm(true);
  }

  function cerrarFormulario() {
    setShowForm(false);
    setEditingIdx(null);
    setCursoOriginal(null);
    setNombreCurso("");
    setPomodoros(4);
    setSugerenciaActiva(-1);
    setMostrarNoCambiosCurso(false);
  }

  function eliminarCurso(idx) {
    setHorario((prev) => {
      const lista = [...(prev[diaActivo] || [])];

      lista.splice(idx, 1);

      return {
        ...prev,
        [diaActivo]: lista,
      };
    });

    setConfirmandoBorrar(null);
  }

  function guardarCursoFormulario() {
    if (cursoSinCambios) {
      mostrarMensajeNoCambiosCurso();
      return;
    }

    const limpio = nombreCurso.trim();

    const cursoReal = manifest.cursos.find(
      (c) =>
        normalizarTexto(c.nombre) ===
        normalizarTexto(limpio)
    );

    if (!cursoReal || nombreExcedido) {
      return;
    }

    setHorario((prev) => {
      const listaActual = [
        ...(prev[diaActivo] || []),
      ];

      if (editingIdx !== null) {
        listaActual[editingIdx] = {
          subject: cursoReal.nombre,
          pomodoros,
        };
      } else {
        if (!puedeAgregarMas) {
          return prev;
        }

        listaActual.push({
          subject: cursoReal.nombre,
          pomodoros,
        });
      }

      return {
        ...prev,
        [diaActivo]: listaActual,
      };
    });

    cerrarFormulario();
  }

  function handleInputKeyDown(e) {
    if (sugerencias.length === 0) {
      if (
        e.key === "Enter" &&
        coincideExacto &&
        !nombreExcedido
      ) {
        e.preventDefault();
        guardarCursoFormulario();
      }

      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setSugerenciaActiva((prev) =>
        prev < sugerencias.length - 1
          ? prev + 1
          : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();

      setSugerenciaActiva((prev) =>
        prev > 0 ? prev - 1 : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (
        sugerenciaActiva >= 0 &&
        sugerenciaActiva < sugerencias.length
      ) {
        setNombreCurso(
          sugerencias[sugerenciaActiva].nombre
        );

        setSugerenciaActiva(-1);
      } else if (
        coincideExacto &&
        !nombreExcedido
      ) {
        guardarCursoFormulario();
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();

        if (searchOpen) {
          setSearchOpen(false);
        } else if (salidaPendiente !== null) {
          setSalidaPendiente(null);
        } else if (confirmandoBorrar !== null) {
          setConfirmandoBorrar(null);
        } else if (showForm) {
          cerrarFormulario();
        } else {
          intentarCerrar();
        }

        return;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();
        guardarTodo();
        return;
      }

      if (
        e.altKey &&
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();

        if (!showForm && puedeAgregarMas) {
          abrirFormulario();
        }

        return;
      }

      if (
        e.altKey &&
        (e.key === "ArrowLeft" ||
          e.key === "ArrowRight")
      ) {
        e.preventDefault();

        const currentIndex =
          DIAS_SEMANA.indexOf(diaActivo);

        if (e.key === "ArrowLeft") {
          const prevIndex =
            (currentIndex -
              1 +
              DIAS_SEMANA.length) %
            DIAS_SEMANA.length;

          cambiarDia(DIAS_SEMANA[prevIndex]);
        } else {
          const nextIndex =
            (currentIndex + 1) %
            DIAS_SEMANA.length;

          cambiarDia(DIAS_SEMANA[nextIndex]);
        }

        return;
      }

      if (
        showForm &&
        e.altKey &&
        e.key >= "1" &&
        e.key <= "6"
      ) {
        e.preventDefault();
        setPomodoros(parseInt(e.key, 10));
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    showForm,
    horario,
    diaActivo,
    puedeAgregarMas,
    confirmandoBorrar,
    salidaPendiente,
    hayCambiosSinGuardar,
    searchOpen,
    cursoSinCambios,
  ]);

  return (
    <>
      <AppHeader
        section="editar"
        onAbrirBuscador={() =>
          setSearchOpen(true)
        }
      />

      <div className="editor-page">
        <div className="editor-card container">

          <div className="editor-header">
            <h2 className="editor-titulo">
              Editar Horario {nombreMostrar}
            </h2>
          </div>

          <div className="editor-tabs">
            {DIAS_SEMANA.map((dia) => (
              <button
                key={dia}
                className={`editor-tab-btn ${
                  diaActivo === dia
                    ? "is-active"
                    : ""
                }`}
                onClick={() => cambiarDia(dia)}
                title={`Ver ${DIA_LABELS[dia]}`}
              >
                {DIA_LABELS[dia].substring(0, 3)}
              </button>
            ))}
          </div>

          <div className="editor-body">
            <h3 className="editor-seccion-titulo">
              Cursos para el {diaActivo}
            </h3>

            {!showForm && (
              <>
                {cursosDelDia.length === 0 ? (
                  <p className="editor-texto-vacio">
                    Día libre. No hay cursos agregados.
                  </p>
                ) : (
                  <div className="editor-lista">
                    {cursosDelDia.map((c, i) => (
                      <div
                        key={i}
                        className="editor-item"
                      >
                        <div className="editor-item-info">
                          <span className="editor-item-nombre">
                            {c.subject}
                          </span>

                          <span className="editor-item-pomo">
                            {c.pomodoros} pomodoros (
                            {c.pomodoros * 30} min)
                          </span>
                        </div>

                        <div className="editor-acciones-item">
                          <button
                            className="editor-icon-btn"
                            onClick={() =>
                              abrirFormulario(i)
                            }
                            title="Editar curso"
                          >
                            <i className="fa-solid fa-pen" />
                          </button>

                          <button
                            className="editor-icon-btn is-danger"
                            onClick={() =>
                              setConfirmandoBorrar(i)
                            }
                            title="Eliminar curso"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {showForm && (
              <div className="editor-add-box">
                <h4 className="editor-form-titulo">
                  {editingIdx !== null
                    ? "Editar curso"
                    : "Agregar un curso nuevo"}
                </h4>

                <div className="editor-input-wrap">
                  <input
                    autoComplete="off"
                    autoFocus
                    value={nombreCurso}
                    onChange={(e) => {
                      setNombreCurso(e.target.value);
                      setSugerenciaActiva(-1);
                      setMostrarNoCambiosCurso(false);
                    }}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Escribe el nombre..."
                    className={`editor-input ${
                      nombreExcedido
                        ? "is-error"
                        : ""
                    }`}
                  />

                  {sugerencias.length > 0 &&
                    !coincideExacto && (
                      <div className="editor-sugerencias">
                        {sugerencias.map(
                          (c, index) => (
                            <button
                              key={c.nombre}
                              className={`editor-sugerencia-item ${
                                sugerenciaActiva ===
                                index
                                  ? "is-active"
                                  : ""
                              }`}
                              onClick={() => {
                                setNombreCurso(
                                  c.nombre
                                );
                                setSugerenciaActiva(
                                  -1
                                );
                                setMostrarNoCambiosCurso(
                                  false
                                );
                              }}
                            >
                              {c.nombre}
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>

                <div className="editor-feedback-container">
                  {nombreCurso.trim() &&
                  sugerencias.length === 0 &&
                  !coincideExacto ? (
                    <p className="editor-error-msg">
                      Curso no encontrado
                    </p>
                  ) : (
                    <span />
                  )}

                  <p
                    className={`editor-char-count ${
                      nombreExcedido
                        ? "is-error"
                        : ""
                    }`}
                  >
                    {nombreCurso.length}/
                    {LIMITE_NOMBRE_CURSO}
                  </p>
                </div>

                <p className="editor-pomo-label">
                  Cantidad de pomodoros
                </p>

                <div
                  className="editor-pomo-grid"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") {
                      e.preventDefault();

                      setPomodoros((p) =>
                        Math.min(6, p + 1)
                      );

                      setMostrarNoCambiosCurso(
                        false
                      );
                    } else if (
                      e.key === "ArrowLeft"
                    ) {
                      e.preventDefault();

                      setPomodoros((p) =>
                        Math.max(1, p - 1)
                      );

                      setMostrarNoCambiosCurso(
                        false
                      );
                    }
                  }}
                >
                  {OPCIONES_POMODOROS.map((n) => (
                    <button
                      key={n}
                      tabIndex={-1}
                      className={`editor-pomo-btn ${
                        pomodoros === n
                          ? "is-on btn-primary"
                          : ""
                      }`}
                      onClick={() => {
                        setPomodoros(n);
                        setMostrarNoCambiosCurso(
                          false
                        );
                      }}
                      title={`Seleccionar ${n} pomodoros`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <div className="editor-form-acciones">
                  <button
                    className={`editor-btn-add is-primary editor-btn-save ${
                      cursoSinCambios
                        ? "is-no-changes"
                        : ""
                    }`}
                    disabled={
                      !coincideExacto ||
                      nombreExcedido
                    }
                    onClick={
                      guardarCursoFormulario
                    }
                    title={
                      cursoSinCambios
                        ? "No hay cambios para guardar"
                        : "Guardar curso"
                    }
                  >
                    <i className="fa-solid fa-floppy-disk" />

                    {editingIdx !== null
                      ? "Guardar cambios"
                      : "Añadir curso"}

                    {mostrarNoCambiosCurso && (
                      <span className="editor-no-cambios">
                        No hay cambios para guardar
                      </span>
                    )}
                  </button>

                  <button
                    className="editor-btn-add editor-btn-outline"
                    onClick={cerrarFormulario}
                    title="Cancelar edición"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {!showForm && (
            <div className="editor-footer">

              <button
                className="editor-btn-outline icon-only-btn"
                onClick={() =>
                  abrirFormulario()
                }
                disabled={!puedeAgregarMas}
                title={
                  !puedeAgregarMas
                    ? `Límite de ${MAX_CURSOS_POR_DIA} cursos alcanzado`
                    : "Agregar curso"
                }
                aria-label="Agregar curso"
              >
                <i className="fa-solid fa-plus" />
                Agregar
              </button>

              <button
                className="editor-btn-outline icon-only-btn"
                onClick={intentarCerrar}
                title="Cancelar"
              >
                Cancelar
              </button>

              <button
                className={`editor-btn-save btn-primary icon-only-btn ${
                  !hayCambiosSinGuardar
                    ? "is-no-changes"
                    : ""
                }`}
                onClick={guardarTodo}
                title={
                  hayCambiosSinGuardar
                    ? "Guardar cambios"
                    : "No hay cambios para guardar"
                }
                aria-label="Guardar Cambios"
              >
                <i className="fa-solid fa-floppy-disk" />
                Guardar

                {mostrarNoCambios && (
                  <span className="editor-no-cambios">
                    No hay cambios para guardar
                  </span>
                )}
              </button>

            </div>
          )}
        </div>

        <SearchModal
          open={searchOpen}
          onClose={() =>
            setSearchOpen(false)
          }
          onSelect={(item) => {
            setSearchOpen(false);

            navigate(
              `/?q=${encodeURIComponent(
                item.type === "curso"
                  ? item.nombre
                  : item.tema
              )}`
            );
          }}
        />

        {confirmandoBorrar !== null &&
          cursosDelDia[confirmandoBorrar] && (
            <div
              className="editor-confirm-backdrop"
              onClick={() =>
                setConfirmandoBorrar(null)
              }
            >
              <div
                className="editor-confirm-box"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <i className="fa-solid fa-triangle-exclamation editor-confirm-icon" />

                <p className="editor-confirm-texto">
                  ¿Eliminar{" "}
                  <strong>
                    {
                      cursosDelDia[
                        confirmandoBorrar
                      ].subject
                    }
                  </strong>
                  ?
                </p>

                <div className="editor-confirm-acciones">
                  <button
                    className="editor-btn-outline"
                    onClick={() =>
                      setConfirmandoBorrar(null)
                    }
                  >
                    No
                  </button>

                  <button
                    className="editor-confirm-btn-si"
                    onClick={() =>
                      eliminarCurso(
                        confirmandoBorrar
                      )
                    }
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

        {salidaPendiente !== null && (
          <div
            className="editor-confirm-backdrop"
            onClick={() =>
              setSalidaPendiente(null)
            }
          >
            <div
              className="editor-confirm-box"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <i className="fa-solid fa-triangle-exclamation editor-confirm-icon" />

              <p className="editor-confirm-texto">
                Tienes cambios sin guardar. Si
                sales ahora, se van a perder.
              </p>

              <div className="editor-confirm-acciones">
                <button
                  className="editor-btn-outline"
                  onClick={() =>
                    setSalidaPendiente(null)
                  }
                >
                  Seguir editando
                </button>

                <button
                  className="editor-confirm-btn-si"
                  onClick={() =>
                    resolverSalida(false)
                  }
                >
                  Salir sin guardar
                </button>
              </div>

              <button
                className="editor-confirm-guardar-tambien"
                onClick={() =>
                  resolverSalida(true)
                }
              >
                <i className="fa-solid fa-floppy-disk" />
                Mejor guardar y salir
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}