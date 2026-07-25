import { useState } from "react";
import {
  DIAS_SEMANA,
  DIA_LABELS,
  MAX_CURSOS_POR_DIA,
  LIMITE_NOMBRE_CURSO,
} from "../../lib/scheduleStorage";

const OPCIONES_POMODOROS = [1, 2, 3, 4, 5, 6];

// Asistente: 1) elegir días → 2) por cada día elegido, agregar cursos +
// cantidad de pomodoros (máx. 4 por día, se puede omitir para cortar
// antes). Al terminar el último día, entrega el horario armado.
export default function ScheduleSetup({ open, onComplete, onCancel }) {
  const [paso, setPaso] = useState("dias"); // dias | curso | pomodoros
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [diaIdx, setDiaIdx] = useState(0);
  const [horario, setHorario] = useState({});
  const [nombreCurso, setNombreCurso] = useState("");
  const [pomodoros, setPomodoros] = useState(4);

  if (!open) return null;

  const diaActual = diasSeleccionados[diaIdx];
  const cursosDelDia = horario[diaActual] || [];
  const nombreExcedido = nombreCurso.length > LIMITE_NOMBRE_CURSO;

  function toggleDia(dia) {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  }

  function empezarConfiguracionCursos() {
    if (diasSeleccionados.length === 0) return;
    // Mantener el orden natural lunes → domingo, sin importar el orden de clic.
    const ordenados = DIAS_SEMANA.filter((d) => diasSeleccionados.includes(d));
    setDiasSeleccionados(ordenados);
    setDiaIdx(0);
    setHorario({});
    setPaso("curso");
  }

  function agregarCurso() {
    const limpio = nombreCurso.trim();
    if (!limpio || nombreExcedido) return;
    setPaso("pomodoros");
  }

  function confirmarPomodoros() {
    const limpio = nombreCurso.trim();
    setHorario((prev) => {
      const listaActual = prev[diaActual] || [];
      return { ...prev, [diaActual]: [...listaActual, { subject: limpio, pomodoros }] };
    });
    setNombreCurso("");
    setPomodoros(4);

    const nuevaCantidad = cursosDelDia.length + 1;
    if (nuevaCantidad >= MAX_CURSOS_POR_DIA) {
      avanzarDia();
    } else {
      setPaso("curso");
    }
  }

  function avanzarDia() {
    setNombreCurso("");
    setPomodoros(4);
    if (diaIdx + 1 < diasSeleccionados.length) {
      setDiaIdx((i) => i + 1);
      setPaso("curso");
    } else {
      onComplete(horario);
    }
  }

  return (
    <div className="setup-overlay">
      <style>{`
        .setup-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(4, 8, 12, 0.9);
          padding: 16px;
        }
        .setup-card {
          width: min(420px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .setup-titulo {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ink);
          text-align: center;
        }
        .setup-sub {
          margin: -10px 0 0;
          font-size: 0.85rem;
          color: var(--ink-soft);
          text-align: center;
        }
        .setup-dias-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .setup-dia-btn {
          padding: 12px 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
          background: var(--surface-alt);
          color: var(--ink-soft);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .setup-dia-btn.is-on {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }
        .setup-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
          background: var(--bg);
          color: var(--ink);
          font-size: 1rem;
        }
        .setup-input.is-error {
          border-color: var(--danger);
        }
        .setup-char-count {
          font-size: 0.78rem;
          text-align: right;
          color: var(--ink-soft);
          margin: -10px 2px 0 0;
        }
        .setup-char-count.is-error {
          color: var(--danger);
          font-weight: 700;
        }
        .setup-lista-cursos {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .setup-lista-curso-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--surface-alt);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--ink);
        }
        .setup-pomo-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
        }
        .setup-pomo-btn {
          padding: 10px 0;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-strong);
          background: var(--surface-alt);
          color: var(--ink);
          font-weight: 700;
          cursor: pointer;
        }
        .setup-pomo-btn.is-on {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }
        .setup-nav {
          display: flex;
          gap: 10px;
        }
        .setup-btn {
          flex: 1;
          padding: 13px;
          border-radius: var(--radius-md);
          border: none;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .setup-btn.is-primary {
          background: var(--primary);
          color: #fff;
        }
        .setup-btn.is-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .setup-btn.is-ghost {
          background: var(--surface-alt);
          color: var(--ink-soft);
        }
      `}</style>

      <div className="setup-card">
        {paso === "dias" && (
          <>
            <h2 className="setup-titulo">¿Qué días vas a estudiar?</h2>
            <p className="setup-sub">Elige uno o más días de la semana.</p>
            <div className="setup-dias-grid">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia}
                  className={`setup-dia-btn ${diasSeleccionados.includes(dia) ? "is-on" : ""}`}
                  onClick={() => toggleDia(dia)}
                >
                  {DIA_LABELS[dia]}
                </button>
              ))}
            </div>
            <div className="setup-nav">
              {onCancel && (
                <button className="setup-btn is-ghost" onClick={onCancel}>
                  Cancelar
                </button>
              )}
              <button
                className="setup-btn is-primary"
                disabled={diasSeleccionados.length === 0}
                onClick={empezarConfiguracionCursos}
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {paso === "curso" && (
          <>
            <h2 className="setup-titulo">{DIA_LABELS[diaActual]} — Curso {cursosDelDia.length + 1}</h2>
            <p className="setup-sub">
              {cursosDelDia.length}/{MAX_CURSOS_POR_DIA} cursos agregados este día
            </p>

            {cursosDelDia.length > 0 && (
              <div className="setup-lista-cursos">
                {cursosDelDia.map((c, i) => (
                  <div key={i} className="setup-lista-curso-item">
                    <span>{c.subject}</span>
                    <span>{c.pomodoros} 🍅</span>
                  </div>
                ))}
              </div>
            )}

            <input
              autoFocus
              value={nombreCurso}
              onChange={(e) => setNombreCurso(e.target.value)}
              placeholder="Nombre del curso..."
              className={`setup-input ${nombreExcedido ? "is-error" : ""}`}
            />
            <p className={`setup-char-count ${nombreExcedido ? "is-error" : ""}`}>
              {nombreExcedido
                ? `Muy largo — máximo ${LIMITE_NOMBRE_CURSO} caracteres`
                : `${nombreCurso.length}/${LIMITE_NOMBRE_CURSO}`}
            </p>

            <div className="setup-nav">
              {cursosDelDia.length > 0 && (
                <button className="setup-btn is-ghost" onClick={avanzarDia}>
                  Omitir
                </button>
              )}
              <button
                className="setup-btn is-primary"
                disabled={!nombreCurso.trim() || nombreExcedido}
                onClick={agregarCurso}
              >
                Agregar curso
              </button>
            </div>
          </>
        )}

        {paso === "pomodoros" && (
          <>
            <h2 className="setup-titulo">¿Cuántos pomodoros?</h2>
            <p className="setup-sub">Para "{nombreCurso.trim()}" en {DIA_LABELS[diaActual]}.</p>
            <div className="setup-pomo-grid">
              {OPCIONES_POMODOROS.map((n) => (
                <button
                  key={n}
                  className={`setup-pomo-btn ${pomodoros === n ? "is-on" : ""}`}
                  onClick={() => setPomodoros(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="setup-nav">
              <button className="setup-btn is-primary" onClick={confirmarPomodoros}>
                Confirmar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
