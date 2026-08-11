import { useState } from "react";
import {
  DIAS_SEMANA,
  DIA_LABELS,
  MAX_CURSOS_POR_DIA,
  LIMITE_NOMBRE_CURSO,
} from "../../lib/scheduleStorage";
import manifest from "../../data/manifest.json";
import { buscarConPuntaje, normalizarTexto } from "../../lib/buscador";

const OPCIONES_POMODOROS = [1, 2, 3, 4, 5, 6];

// Asistente: 1) elegir días → 2) por cada día elegido, agregar cursos +
// cantidad de pomodoros (máx. 4 por día, se puede omitir para cortar
// antes). Al terminar el último día, entrega el horario armado.
export default function ScheduleSetup({ open, onComplete, onCancel }) {
  const [paso, setPaso] = useState("dias"); // dias | curso
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [diaIdx, setDiaIdx] = useState(0);
  const [horario, setHorario] = useState({});
  const [nombreCurso, setNombreCurso] = useState("");
  const [pomodoros, setPomodoros] = useState(4);
  
  // NUEVO: Estado para saber qué sugerencia está seleccionada con las flechas
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);

  if (!open) return null;

  const diaActual = diasSeleccionados[diaIdx];
  const cursosDelDia = horario[diaActual] || [];
  const nombreExcedido = nombreCurso.length > LIMITE_NOMBRE_CURSO;

  const sugerencias = nombreCurso.trim()
    ? buscarConPuntaje(manifest.cursos, nombreCurso, (c) => c.nombre).slice(0, 6)
    : [];
  const coincideExacto = manifest.cursos.some(
    (c) => normalizarTexto(c.nombre) === normalizarTexto(nombreCurso),
  );

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
    const cursoReal = manifest.cursos.find(
      (c) => normalizarTexto(c.nombre) === normalizarTexto(limpio),
    );
    if (!cursoReal || nombreExcedido) return;

    setHorario((prev) => {
      const listaActual = prev[diaActual] || [];
      return { ...prev, [diaActual]: [...listaActual, { subject: cursoReal.nombre, pomodoros }] };
    });
    setNombreCurso("");
    setPomodoros(4);
    setSugerenciaActiva(-1);

    const nuevaCantidad = cursosDelDia.length + 1;
    if (nuevaCantidad >= MAX_CURSOS_POR_DIA) {
      avanzarDia();
    }
  }

  function avanzarDia() {
    setNombreCurso("");
    setPomodoros(4);
    setSugerenciaActiva(-1);
    if (diaIdx + 1 < diasSeleccionados.length) {
      setDiaIdx((i) => i + 1);
      setPaso("curso");
    } else {
      onComplete(horario);
    }
  }

  // NUEVO: Función para manejar las flechas y el Enter en el input
  function handleInputKeyDown(e) {
    if (sugerencias.length === 0) {
      if (e.key === "Enter" && coincideExacto && !nombreExcedido) {
        e.preventDefault();
        agregarCurso();
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
        agregarCurso();
      }
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
          border-color: var(--primary);
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
          font-size: 0.875rem;
          text-align: right;
          color: var(--ink-soft);
          margin: -10px 2px 0 0;
        }
        .setup-input-wrap {
          position: relative;
        }
        .setup-sugerencias {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 20;
          max-height: 220px;
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
        }
        .setup-sugerencia-item {
          text-align: left;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface-alt);
          color: var(--ink);
          font-size: 0.9rem;
        }
        /* ESTILO NUEVO: Sugerencia resaltada con teclado */
        .setup-sugerencia-item.is-active {
          background: var(--primary-light, #e0f2fe);
          border-color: var(--primary);
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
        /* ESTILO NUEVO: Para que se note cuando el grid de pomodoros tiene el foco */
        .setup-pomo-grid:focus {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
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
          border-color: var(--primary);
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
                  className={`setup-dia-btn ${diasSeleccionados.includes(dia) ? "is-on btn-primary" : ""}`}
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
                className="setup-btn is-primary btn-primary"
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

            <div className="setup-input-wrap">
              <input autoComplete="off"
                autoFocus
                value={nombreCurso}
                onChange={(e) => {
                  setNombreCurso(e.target.value);
                  setSugerenciaActiva(-1); // Resetea selección de flechas al escribir
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Escribe el nombre del curso..."
                className={`setup-input ${nombreExcedido ? "is-error" : ""}`}
              />
              {sugerencias.length > 0 && !coincideExacto && (
                <div className="setup-sugerencias">
                  {sugerencias.map((c, index) => (
                    <button
                      key={c.nombre}
                      className={`setup-sugerencia-item ${sugerenciaActiva === index ? "is-active" : ""}`}
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
            {nombreCurso.trim() && sugerencias.length === 0 && (
              <p className="setup-sub" style={{ margin: 0, color: "var(--danger)" }}>
                Ningún curso tuyo coincide con "{nombreCurso}". Configúralo primero en Mi Estudio.
              </p>
            )}
            <p className={`setup-char-count ${nombreExcedido ? "is-error" : ""}`}>
              {nombreExcedido
                ? `Muy largo — máximo ${LIMITE_NOMBRE_CURSO} caracteres`
                : `${nombreCurso.length}/${LIMITE_NOMBRE_CURSO}`}
            </p>

            <p className="setup-sub" style={{ margin: 0 }}>¿Cuántos pomodoros?</p>
            {/* NUEVO: El grid de pomodoros ahora responde a las flechas */}
            <div 
              className="setup-pomo-grid"
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
                  tabIndex={-1} // Evita que cada botón gane foco individualmente, el div padre lo controla
                  className={`setup-pomo-btn ${pomodoros === n ? "is-on btn-primary" : ""}`}
                  onClick={() => setPomodoros(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="setup-nav">
              {cursosDelDia.length > 0 && (
                <button className="setup-btn is-ghost" onClick={avanzarDia}>
                  Omitir
                </button>
              )}
              <button
                className="setup-btn is-primary btn-primary"
                disabled={!coincideExacto || nombreExcedido}
                onClick={agregarCurso}
              >
                Agregar curso
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}