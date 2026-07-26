import { useState } from "react";
import {
  DIAS_SEMANA,
  DIA_LABELS,
  MAX_CURSOS_POR_DIA,
  LIMITE_NOMBRE_CURSO,
} from "../../lib/scheduleStorage";

const NOMBRE_DIA = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const OPCIONES_POMODOROS = [1, 2, 3, 4, 5, 6];

// Editor completo del horario: lista de días configurados (se pueden
// eliminar), botón "+" para agregar un día nuevo, y al tocar un día se
// entra a editar sus cursos (agregar, editar, eliminar).
export default function ScheduleEditor({ open, horarioInicial, onGuardar, onCerrar }) {
  const [horario, setHorario] = useState(horarioInicial || {});
  const [vista, setVista] = useState("lista"); // lista | elegir_dia_nuevo | dia | agregar_curso
  const [diaEditando, setDiaEditando] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [nombreCurso, setNombreCurso] = useState("");
  const [pomodoros, setPomodoros] = useState(4);

  if (!open) return null;

  const diasConfigurados = DIAS_SEMANA.filter((d) => horario[d] && horario[d].length > 0);
  const diasDisponibles = DIAS_SEMANA.filter((d) => !diasConfigurados.includes(d));
  const cursosDelDia = diaEditando ? horario[diaEditando] || [] : [];
  const nombreExcedido = nombreCurso.length > LIMITE_NOMBRE_CURSO;

  function actualizar(nuevoHorario) {
    setHorario(nuevoHorario);
    onGuardar(nuevoHorario);
  }

  function eliminarDia(dia) {
    const copia = { ...horario };
    delete copia[dia];
    actualizar(copia);
  }

  function abrirDia(dia) {
    setDiaEditando(dia);
    setVista("dia");
  }

  function empezarAgregarCurso() {
    setNombreCurso("");
    setPomodoros(4);
    setEditIdx(null);
    setVista("agregar_curso");
  }

  function confirmarAgregarCurso() {
    const limpio = nombreCurso.trim();
    if (!limpio || nombreExcedido) return;
    const listaActual = horario[diaEditando] || [];
    actualizar({ ...horario, [diaEditando]: [...listaActual, { subject: limpio, pomodoros }] });
    setVista("dia");
  }

  function empezarEditarCurso(idx) {
    const curso = cursosDelDia[idx];
    setNombreCurso(curso.subject);
    setPomodoros(curso.pomodoros);
    setEditIdx(idx);
  }

  function guardarEdicionCurso() {
    const limpio = nombreCurso.trim();
    if (!limpio || nombreExcedido) return;
    const listaActual = [...cursosDelDia];
    listaActual[editIdx] = { subject: limpio, pomodoros };
    actualizar({ ...horario, [diaEditando]: listaActual });
    setEditIdx(null);
  }

  function eliminarCurso(idx) {
    const listaActual = cursosDelDia.filter((_, i) => i !== idx);
    if (listaActual.length === 0) {
      const copia = { ...horario };
      delete copia[diaEditando];
      actualizar(copia);
      setVista("lista");
    } else {
      actualizar({ ...horario, [diaEditando]: listaActual });
    }
  }

  return (
    <div className="editor-overlay">
      <style>{`
        .editor-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(4, 8, 12, 0.9);
          padding: 16px;
        }
        .editor-card {
          width: min(480px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 26px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .editor-titulo-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .editor-titulo {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ink);
        }
        .editor-cerrar {
          background: none;
          border: none;
          color: var(--ink-soft);
          font-size: 1.2rem;
          cursor: pointer;
        }
        .editor-dia-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 14px;
          background: var(--surface-alt);
          border-radius: var(--radius-md);
        }
        .editor-dia-main {
          flex: 1;
          background: none;
          border: none;
          text-align: left;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--ink);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .editor-dia-sub {
          font-size: 0.78rem;
          font-weight: 400;
          color: var(--ink-soft);
        }
        .editor-icon-btn {
          background: none;
          border: none;
          color: var(--ink-soft);
          font-size: 1rem;
          cursor: pointer;
          padding: 6px;
        }
        .editor-icon-btn.is-danger:hover {
          color: var(--danger);
        }
        .editor-agregar-dia {
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1px dashed var(--border-strong);
          background: none;
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
        }
        .editor-vacio {
          color: var(--ink-soft);
          font-size: 0.9rem;
          text-align: center;
          padding: 12px 0;
        }
        .editor-dias-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .editor-dia-pick-btn {
          padding: 12px 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
          background: var(--surface-alt);
          color: var(--ink);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .editor-curso-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--surface-alt);
          border-radius: var(--radius-sm);
        }
        .editor-curso-info {
          flex: 1;
          font-size: 0.88rem;
          color: var(--ink);
        }
        .editor-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
          background: var(--bg);
          color: var(--ink);
          font-size: 1rem;
        }
        .editor-input.is-error {
          border-color: var(--danger);
        }
        .editor-char-count {
          font-size: 0.78rem;
          text-align: right;
          color: var(--ink-soft);
          margin: -8px 2px 0 0;
        }
        .editor-char-count.is-error {
          color: var(--danger);
          font-weight: 700;
        }
        .editor-pomo-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
        }
        .editor-pomo-btn {
          padding: 10px 0;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-strong);
          background: var(--surface-alt);
          color: var(--ink);
          font-weight: 700;
          cursor: pointer;
        }
        .editor-pomo-btn.is-on {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }
        .editor-nav {
          display: flex;
          gap: 10px;
        }
        .editor-btn {
          flex: 1;
          padding: 13px;
          border-radius: var(--radius-md);
          border: none;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .editor-btn.is-primary {
          background: var(--primary);
          color: #fff;
        }
        .editor-btn.is-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .editor-btn.is-ghost {
          background: var(--surface-alt);
          color: var(--ink-soft);
        }
      `}</style>

      <div className="editor-card">
        {vista === "lista" && (
          <>
            <div className="editor-titulo-row">
              <h2 className="editor-titulo">Tu horario</h2>
              <button className="editor-cerrar" onClick={onCerrar}>
                <i className="fa-solid fa-times" />
              </button>
            </div>

            {diasConfigurados.length === 0 && (
              <p className="editor-vacio">Todavía no tienes días configurados.</p>
            )}

            {diasConfigurados.map((dia) => (
              <div key={dia} className="editor-dia-row">
                <button className="editor-dia-main" onClick={() => abrirDia(dia)}>
                  {NOMBRE_DIA[dia]}
                  <span className="editor-dia-sub">
                    {horario[dia].length} curso{horario[dia].length !== 1 ? "s" : ""}
                  </span>
                </button>
                <button className="editor-icon-btn is-danger" onClick={() => eliminarDia(dia)} title="Eliminar día">
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            ))}

            {diasDisponibles.length > 0 && (
              <button className="editor-agregar-dia" onClick={() => setVista("elegir_dia_nuevo")}>
                <i className="fa-solid fa-plus" /> Agregar día
              </button>
            )}
          </>
        )}

        {vista === "elegir_dia_nuevo" && (
          <>
            <div className="editor-titulo-row">
              <h2 className="editor-titulo">¿Qué día agregas?</h2>
              <button className="editor-cerrar" onClick={() => setVista("lista")}>
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <div className="editor-dias-grid">
              {diasDisponibles.map((dia) => (
                <button key={dia} className="editor-dia-pick-btn" onClick={() => abrirDia(dia)}>
                  {DIA_LABELS[dia]}
                </button>
              ))}
            </div>
          </>
        )}

        {vista === "dia" && (
          <>
            <div className="editor-titulo-row">
              <h2 className="editor-titulo">{NOMBRE_DIA[diaEditando]}</h2>
              <button className="editor-cerrar" onClick={() => { setVista("lista"); setEditIdx(null); }}>
                <i className="fa-solid fa-times" />
              </button>
            </div>

            {cursosDelDia.length === 0 && (
              <p className="editor-vacio">Sin cursos este día.</p>
            )}

            {cursosDelDia.map((c, idx) =>
              editIdx === idx ? (
                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    autoFocus
                    value={nombreCurso}
                    onChange={(e) => setNombreCurso(e.target.value)}
                    className={`editor-input ${nombreExcedido ? "is-error" : ""}`}
                  />
                  <p className={`editor-char-count ${nombreExcedido ? "is-error" : ""}`}>
                    {nombreExcedido
                      ? `Muy largo — máximo ${LIMITE_NOMBRE_CURSO} caracteres`
                      : `${nombreCurso.length}/${LIMITE_NOMBRE_CURSO}`}
                  </p>
                  <div className="editor-pomo-grid">
                    {OPCIONES_POMODOROS.map((n) => (
                      <button
                        key={n}
                        className={`editor-pomo-btn ${pomodoros === n ? "is-on" : ""}`}
                        onClick={() => setPomodoros(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="editor-nav">
                    <button className="editor-btn is-ghost" onClick={() => setEditIdx(null)}>
                      Cancelar
                    </button>
                    <button
                      className="editor-btn is-primary"
                      disabled={!nombreCurso.trim() || nombreExcedido}
                      onClick={guardarEdicionCurso}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div key={idx} className="editor-curso-row">
                  <span className="editor-curso-info">{c.subject} · {c.pomodoros} 🍅</span>
                  <button className="editor-icon-btn" onClick={() => empezarEditarCurso(idx)} title="Editar">
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button className="editor-icon-btn is-danger" onClick={() => eliminarCurso(idx)} title="Eliminar">
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              ),
            )}

            {editIdx === null && cursosDelDia.length < MAX_CURSOS_POR_DIA && (
              <button className="editor-agregar-dia" onClick={empezarAgregarCurso}>
                <i className="fa-solid fa-plus" /> Agregar curso
              </button>
            )}

            {editIdx === null && (
              <button className="editor-btn is-ghost" onClick={() => setVista("lista")}>
                Volver a mis días
              </button>
            )}
          </>
        )}

        {vista === "agregar_curso" && (
          <>
            <div className="editor-titulo-row">
              <h2 className="editor-titulo">Nuevo curso — {NOMBRE_DIA[diaEditando]}</h2>
              <button className="editor-cerrar" onClick={() => setVista("dia")}>
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <input
              autoFocus
              value={nombreCurso}
              onChange={(e) => setNombreCurso(e.target.value)}
              placeholder="Nombre del curso..."
              className={`editor-input ${nombreExcedido ? "is-error" : ""}`}
            />
            <p className={`editor-char-count ${nombreExcedido ? "is-error" : ""}`}>
              {nombreExcedido
                ? `Muy largo — máximo ${LIMITE_NOMBRE_CURSO} caracteres`
                : `${nombreCurso.length}/${LIMITE_NOMBRE_CURSO}`}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>¿Cuántos pomodoros?</p>
            <div className="editor-pomo-grid">
              {OPCIONES_POMODOROS.map((n) => (
                <button
                  key={n}
                  className={`editor-pomo-btn ${pomodoros === n ? "is-on" : ""}`}
                  onClick={() => setPomodoros(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              className="editor-btn is-primary"
              disabled={!nombreCurso.trim() || nombreExcedido}
              onClick={confirmarAgregarCurso}
            >
              Agregar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
