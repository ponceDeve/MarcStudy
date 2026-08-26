import { useState, useEffect } from "react";

// Cada paso del tutorial: ícono + título + texto corto.
// El último paso ("nombre") es especial: en vez de ícono, pide el nombre.
const PASOS = [
  {
    icon: "fa-solid fa-graduation-cap",
    titulo: "¡Vamos allá!",
    texto: "Son varios pasos cortos. Puedes avanzar y retroceder cuando quieras con las flechas.",
  },
  {
    icon: "fa-solid fa-book-open",
    titulo: "La teoría",
    texto: "Cada punto tiene un check para marcarlo como pregunta de examen, un botón de bocina para que te lo lea, y un botón con un mando que te lleva directo a su pregunta.",
  },
  {
    icon: "fa-solid fa-flag-checkered",
    titulo: "Ir al examen",
    texto: "Cuando termines de marcar textos, usa \"Ir al Examen\" o \"Completar Tema\" para pasar a las preguntas.",
  },
  {
    icon: "fa-solid fa-heart",
    titulo: "Tus vidas",
    texto: "Si fallas, repites las veces que quieras sin ver la respuesta. Rendirte te muestra la respuesta al toque, pero cuesta una vida; si llegan a 0, se reinicia el tema.",
  },
  {
    icon: "fa-solid fa-caret-right",
    titulo: "Avanzar y retroceder",
    texto: "Las flechas de abajo mueven las preguntas. La de avanzar recién se activa cuando respondes bien o te rindes.",
  },
  {
    icon: "fa-solid fa-magnifying-glass",
    titulo: "Buscador",
    texto: "La lupa te lleva directo a cualquier tema o curso, sin salir de donde estás.",
  },
  {
    icon: "fa-solid fa-gear",
    titulo: "Configuración",
    texto: "En el engranaje tienes un mini cronómetro, pantalla completa y otras opciones, sin salir del tema.",
  },
  {
    icon: "fa-solid fa-calendar-alt",
    titulo: "Pomodoro",
    texto: "Te lleva al Pomodoro de este curso: sesiones de estudio con descansos programados.",
  },
  {
    icon: "fa-solid fa-brain",
    titulo: "Repaso",
    texto: "El botón de guardar programa este tema para repasarlo por repetición espaciada, así no se te olvida.",
  },
  { nombre: true },
];

// paso === -1 es la pantalla previa donde el usuario elige si quiere
// ver el tutorial completo o saltarlo. El nombre (último paso de PASOS)
// nunca se puede saltar: si eligen "omitir", igual se llega ahí.
const ULTIMO_PASO = PASOS.length - 1;

export default function WelcomeModal({ open, onSubmit }) {
  const [paso, setPaso] = useState(-1);
  const [nombre, setNombre] = useState("");

  const total = PASOS.length;
  const enEleccion = paso === -1;
  const actual = enEleccion ? null : PASOS[paso];

  function verTutorial() {
    setPaso(0);
  }

  function omitirTutorial() {
    setPaso(ULTIMO_PASO);
  }

  function siguiente() {
    if (enEleccion) return;
    if (actual.nombre) {
      const limpio = nombre.trim();
      if (!limpio) return;
      onSubmit(limpio);
      return;
    }
    setPaso((p) => Math.min(p + 1, total - 1));
  }

  function anterior() {
    if (enEleccion) return;
    setPaso((p) => Math.max(p - 1, -1));
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      const enInput = ["INPUT", "TEXTAREA"].includes(
        e.target.tagName
      );
      if (enInput) return;

      if (e.key === "ArrowRight") siguiente();
      if (e.key === "ArrowLeft") anterior();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className={`welcome-overlay welcome-overlay--dark ${open ? "" : "is-closed"}`} aria-hidden={!open}>
      <div className="welcome-card">
        {!enEleccion && (
          <div className="welcome-dots">
            {PASOS.map((_, i) => (
              <div key={i} className={`welcome-dot ${i === paso ? "is-active" : ""}`} />
            ))}
          </div>
        )}

        {enEleccion ? (
          <>
            <div className="welcome-icon-ring">
              <i className="fa-solid fa-graduation-cap" />
            </div>
            <h2 className="welcome-titulo">¡Bienvenido a Mi Estudio!</h2>
            <p className="welcome-texto">
              ¿Quieres ver un repaso rápido de cómo se usa antes de empezar?
            </p>
            <div className="welcome-choice-nav">
              <button className="welcome-btn is-next btn-primary" onClick={verTutorial}>
                Ver el tutorial
              </button>
              <button className="welcome-btn is-skip" onClick={omitirTutorial}>
                Ya sé cómo funciona
              </button>
            </div>
          </>
        ) : actual.nombre ? (
          <>
            <div className="welcome-icon-ring">
              <i className="fa-solid fa-user" />
            </div>
            <h2 className="welcome-titulo">¿Cómo te llamas?</h2>
            <p className="welcome-texto">Lo usamos para saludarte y en tus resultados.</p>
            <input
              type="text"
              name="apodo-usuario"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
              maxLength={16}
              value={nombre}
              onChange={(e) => {
                const valor = e.target.value
                  .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
                  .toUpperCase();

                setNombre(valor);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  siguiente();
                }
              }}
              placeholder="TU NOMBRE..."
              className="welcome-input"
            />
          </>
        ) : (
          <>
            <div className="welcome-icon-ring">
              <i className={actual.icon} />
            </div>
            <h2 className="welcome-titulo">{actual.titulo}</h2>
            <p className="welcome-texto">{actual.texto}</p>
          </>
        )}

        {!enEleccion && (
          <div className="welcome-nav">
            <button className="welcome-btn is-back" onClick={anterior}>
              <i className="fa-solid fa-caret-left" />
            </button>
            <button
              className="welcome-btn is-next btn-primary"
              onClick={siguiente}
              disabled={actual.nombre && !nombre.trim()}
            >
              {actual.nombre ? "Empezar a estudiar" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}