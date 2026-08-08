import { useState, useEffect } from "react";
import {
  DIAS_SEMANA,
  DIA_LABELS,
  MAX_CURSOS_POR_DIA,
  LIMITE_NOMBRE_CURSO,
} from "../../lib/scheduleStorage";
import manifest from "../../data/manifest.json";
import { buscarConPuntaje, normalizarTexto } from "../../lib/buscador";

const OPCIONES_POMODOROS = [1, 2, 3, 4, 5, 6];

export default function ScheduleEditor({
  open,
  horarioInicial,
  onGuardar,
  onCerrar,
}) {
  const [horario, setHorario] = useState({});
  const [diaActivo, setDiaActivo] = useState("lunes");

  // Estado para el formulario (Agregar/Editar)
  const [showForm, setShowForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  const [nombreCurso, setNombreCurso] = useState("");
  const [pomodoros, setPomodoros] = useState(4);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);

  const cursosDelDia = horario[diaActivo] || [];
  const nombreExcedido = nombreCurso.length > LIMITE_NOMBRE_CURSO;
  const puedeAgregarMas = cursosDelDia.length < MAX_CURSOS_POR_DIA;

  useEffect(() => {
    if (open) {
      setHorario(JSON.parse(JSON.stringify(horarioInicial || {})));
      const configurados = DIAS_SEMANA.filter(
        (d) => horarioInicial[d] && horarioInicial[d].length > 0
      );
      setDiaActivo(configurados[0] || "lunes");
      setShowForm(false);
      setEditingIdx(null);
      setNombreCurso("");
      setPomodoros(4);
      setSugerenciaActiva(-1);
    }
  }, [open, horarioInicial]);

  // ==========================================
  // ATAJOS DE TECLADO GLOBALES
  // ==========================================
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      // 1. Esc: Cerrar formulario actual o cerrar el modal
      if (e.key === "Escape") {
        e.preventDefault();
        if (showForm) {
          setShowForm(false);
        } else {
          onCerrar();
        }
        return;
      }

      // 2. Ctrl + S (o Cmd + S): Guardar y salir
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onGuardar(horario);
        onCerrar();
        return;
      }

      // 3. Alt + N: Nuevo curso (Evita el choque con Ctrl+N del navegador)
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (!showForm && puedeAgregarMas) {
          abrirFormulario();
        }
        return;
      }

      // 4. Alt + Flechas: Cambiar de día (Pestañas)
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const currentIndex = DIAS_SEMANA.indexOf(diaActivo);
        if (e.key === "ArrowLeft") {
          const prevIndex = (currentIndex - 1 + DIAS_SEMANA.length) % DIAS_SEMANA.length;
          cambiarDia(DIAS_SEMANA[prevIndex]);
        } else {
          const nextIndex = (currentIndex + 1) % DIAS_SEMANA.length;
          cambiarDia(DIAS_SEMANA[nextIndex]);
        }
        return;
      }

      // 5. Alt + 1-6: Seleccionar pomodoros rápidamente
      if (showForm && e.altKey && e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        setPomodoros(parseInt(e.key, 10));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    showForm,
    horario,
    diaActivo,
    puedeAgregarMas,
    onGuardar,
    onCerrar,
  ]);
  // ==========================================

  if (!open) return null;

  const sugerencias = nombreCurso.trim()
    ? buscarConPuntaje(manifest.cursos, nombreCurso, (c) => c.nombre).slice(0, 6)
    : [];
  const coincideExacto = manifest.cursos.some(
    (c) => normalizarTexto(c.nombre) === normalizarTexto(nombreCurso)
  );

  function cambiarDia(dia) {
    setDiaActivo(dia);
    setShowForm(false);
  }

  function eliminarCurso(idx) {
    setHorario((prev) => {
      const lista = [...(prev[diaActivo] || [])];
      lista.splice(idx, 1);
      return { ...prev, [diaActivo]: lista };
    });
  }

  function abrirFormulario(idx = null) {
    if (idx !== null) {
      setEditingIdx(idx);
      setNombreCurso(cursosDelDia[idx].subject);
      setPomodoros(cursosDelDia[idx].pomodoros);
    } else {
      setEditingIdx(null);
      setNombreCurso("");
      setPomodoros(4);
    }
    setSugerenciaActiva(-1);
    setShowForm(true);
  }

  function guardarCursoFormulario() {
    const limpio = nombreCurso.trim();
    const cursoReal = manifest.cursos.find(
      (c) => normalizarTexto(c.nombre) === normalizarTexto(limpio)
    );
    if (!cursoReal || nombreExcedido) return;

    setHorario((prev) => {
      const listaActual = [...(prev[diaActivo] || [])];

      if (editingIdx !== null) {
        listaActual[editingIdx] = { subject: cursoReal.nombre, pomodoros };
      } else {
        if (!puedeAgregarMas) return prev;
        listaActual.push({ subject: cursoReal.nombre, pomodoros });
      }

      return { ...prev, [diaActivo]: listaActual };
    });

    setShowForm(false);
  }

  function handleInputKeyDown(e) {
    if (sugerencias.length === 0) {
      if (e.key === "Enter" && coincideExacto && !nombreExcedido) {
        e.preventDefault();
        guardarCursoFormulario();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSugerenciaActiva((prev) => (prev < sugerencias.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSugerenciaActiva((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (sugerenciaActiva >= 0 && sugerenciaActiva < sugerencias.length) {
        setNombreCurso(sugerencias[sugerenciaActiva].nombre);
        setSugerenciaActiva(-1);
      } else if (coincideExacto && !nombreExcedido) {
        guardarCursoFormulario();
      }
    }
  }

  return (
    <div className="editor-overlay">
      <div className="editor-card">
        <div className="editor-header">
          <h2 className="editor-titulo">Editar Horario</h2>
          <button 
            className="editor-cerrar" 
            onClick={onCerrar} 
            title="Cerrar (Esc)"
            aria-label="Cerrar modal"
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>

        <div className="editor-tabs">
          {DIAS_SEMANA.map((dia) => (
            <button
              key={dia}
              className={`editor-tab-btn ${diaActivo === dia ? "is-active" : ""}`}
              onClick={() => cambiarDia(dia)}
              title={`Ver ${DIA_LABELS[dia]} (Alt + ⬅️/➡️)`}
            >
              {DIA_LABELS[dia].substring(0, 3)}
            </button>
          ))}
        </div>

        <div className="editor-body">
          <h3 className="editor-seccion-titulo">Cursos para el {DIA_LABELS[diaActivo]}</h3>

          {/* VISTA 1: Lista de Cursos */}
          {!showForm && (
            <>
              {cursosDelDia.length === 0 ? (
                <p className="editor-texto-vacio">
                  Día libre. No hay cursos agregados.
                </p>
              ) : (
                <div className="editor-lista">
                  {cursosDelDia.map((c, i) => (
                    <div key={i} className="editor-item">
                      <div className="editor-item-info">
                        <span className="editor-item-nombre">{c.subject}</span>
                        <span className="editor-item-pomo">{c.pomodoros} pomodoros ({(c.pomodoros * 30)} min)</span>
                      </div>
                      <div className="editor-acciones-item">
                        <button
                          className="editor-icon-btn"
                          onClick={() => abrirFormulario(i)}
                          title="Editar curso"
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          className="editor-icon-btn is-danger"
                          onClick={() => eliminarCurso(i)}
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

          {/* VISTA 2: Formulario de Agregar / Editar */}
          {showForm && (
            <div className="editor-add-box">
              <h4 className="editor-form-titulo">
                {editingIdx !== null ? "Editar curso" : "Agregar un curso nuevo"}
              </h4>

              <div className="editor-input-wrap">
                <input
                  autoFocus
                  value={nombreCurso}
                  onChange={(e) => {
                    setNombreCurso(e.target.value);
                    setSugerenciaActiva(-1);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Escribe el nombre..."
                  className={`editor-input ${nombreExcedido ? "is-error" : ""}`}
                />
                {sugerencias.length > 0 && !coincideExacto && (
                  <div className="editor-sugerencias">
                    {sugerencias.map((c, index) => (
                      <button
                        key={c.nombre}
                        className={`editor-sugerencia-item ${sugerenciaActiva === index ? "is-active" : ""}`}
                        onClick={() => {
                          setNombreCurso(c.nombre);
                          setSugerenciaActiva(-1);
                        }}
                      >
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="editor-feedback-container">
                {nombreCurso.trim() && sugerencias.length === 0 && !coincideExacto ? (
                  <p className="editor-error-msg">
                    Curso no encontrado
                  </p>
                ) : (
                  <span />
                )}
                <p className={`editor-char-count ${nombreExcedido ? "is-error" : ""}`}>
                  {nombreCurso.length}/{LIMITE_NOMBRE_CURSO}
                </p>
              </div>

              <p className="editor-pomo-label">
                Cantidad de pomodoros (Usa Alt + 1-6)
              </p>

              <div
                className="editor-pomo-grid"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setPomodoros((p) => Math.min(6, p + 1));
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setPomodoros((p) => Math.max(1, p - 1));
                  }
                }}
              >
                {OPCIONES_POMODOROS.map((n) => (
                  <button
                    key={n}
                    tabIndex={-1}
                    className={`editor-pomo-btn ${pomodoros === n ? "is-on btn-primary" : ""}`}
                    onClick={() => setPomodoros(n)}
                    title={`Seleccionar ${n} pomodoros (Alt + ${n})`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="editor-form-acciones">
                <button
                  className="editor-btn-add is-primary btn-primary"
                  disabled={!coincideExacto || nombreExcedido}
                  onClick={guardarCursoFormulario}
                  title="Guardar curso (Enter)"
                >
                  {editingIdx !== null ? "Guardar cambios" : "Añadir curso"}
                </button>
                <button
                  className="editor-btn-add editor-btn-outline"
                  onClick={() => setShowForm(false)}
                  title="Cancelar edición (Esc)"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER PRINCIPAL: Iconos de Agregar y Guardar */}
        {!showForm && (
          <div className="editor-footer">
            <button
              className="editor-btn-outline icon-only-btn"
              onClick={() => abrirFormulario()}
              disabled={!puedeAgregarMas}
              title={!puedeAgregarMas ? `Límite de ${MAX_CURSOS_POR_DIA} cursos alcanzado` : "Agregar curso (Alt + N)"}
              aria-label="Agregar curso"
            >
              <i className="fa-solid fa-plus" />Agregar
            </button>
            <button
              className="editor-btn-outline icon-only-btn"
              onClick={onCerrar}
              title="Cancelar (Esc)"
            >
              Cancelar
            </button>
            <button
              className="editor-btn-save btn-primary icon-only-btn"
              onClick={() => {
                onGuardar(horario);
                onCerrar();
              }}
              title="Guardar Todo (Ctrl + S)"
              aria-label="Guardar Cambios"
            >
              <i className="fa-solid fa-floppy-disk" /> 
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}