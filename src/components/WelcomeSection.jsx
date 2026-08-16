import { useState } from "react";
import manifest from "../data/manifest.json";

/**
 * ============================================================
 * DESCRIPCIONES DE LOS CURSOS
 * ============================================================
 */

const DESCRIPCIONES_CURSO = {
  CIV: "Entiende cómo funciona el país en el que vives: leyes, derechos y tu rol de ciudadano hoy.",
  FIL: "Las preguntas que la humanidad lleva siglos haciéndose, contadas por quienes las plantean.",
  HIS: "Un recorrido desde los primeros pueblos hasta el mundo actual, para entender cómo llegamos.",
  LEN: "Domina las reglas del idioma que usas todos los días, pero que nunca te enseñaron bien hoy.",
  LIT: "Historias, autores y estilos que marcaron la forma de contar y de leer el mundo hasta hoy.",
  RVE: "Entrena tu lectura crítica: comprender rápido, deducir mejor y no caer en trampas de examen.",
  BIO: "De la célula al cuerpo humano completo: cómo funciona la vida por dentro, paso a paso hoy.",
  ECO: "Por qué suben los precios, cómo se mueve el mercado y qué hay detrás de cada decisión hoy.",
  FIS: "El movimiento, la energía y las leyes invisibles que rigen todo lo que pasa a tu alrededor.",
  GEO: "El relieve, el clima y la geografía que moldean al Perú, sus regiones y todo el mundo hoy.",
  PSI: "Cómo pensamos, sentimos y actuamos, explicado con lógica, evidencia y ejemplos cotidianos.",
  QUI: "Átomos, reacciones y compuestos: la química que está detrás de todo lo que tocas y respiras.",
  ALG: "Fundamentos y ejercicios de álgebra para resolver problemas paso a paso, sin complicaciones.",
  ARI: "Razones, proporciones y esos problemas clásicos que casi siempre caen en el examen de hoy.",
  GEM: "Ángulos, figuras y áreas: la geometría que explica las formas que ves todos los días, hoy.",
  RMA: "Problemas de lógica y tiempo que ponen a prueba cómo piensas, no solo cuánto memorizas hoy.",
  TRI: "Ángulos, razones trigonométricas y los triángulos que no te dejan tranquilo hasta dominar.",
};

/**
 * ============================================================
 * PREGUNTAS FRECUENTES
 * ============================================================
 */

const FAQS = [
  {
    icon: "fa-graduation-cap",
    q: "¿Cómo funciona el modo estudio?",
    a: "Eliges un curso o tema, primero puedes leer la teoría y luego responder preguntas relacionadas para reforzar lo aprendido.",
  },
  {
    icon: "fa-rotate",
    q: '¿Qué es "Repaso"?',
    a: "Es una sección que te recuerda qué temas conviene repasar según cuándo los estudiaste, para que no se te olviden con el tiempo.",
  },
  {
    icon: "fa-clock",
    q: "¿Cómo se guarda mi Repaso exactamente?",
    a: "Cada vez que estudias un tema, la app recuerda cuándo lo hiciste. Con eso, Repaso te avisa el momento justo para volver a verlo.",
  },
  {
    icon: "fa-trash",
    q: "¿Puedo quitar un tema de mis repasos pendientes?",
    a: "Sí, desde la lista de próximos repasos puedes eliminar cualquier tema que ya no quieras seguir repasando.",
  },
  {
    icon: "fa-heart",
    q: '¿Qué son las "vidas"?',
    a: "Representan tus intentos disponibles al responder preguntas dentro de un tema. Se van descontando si fallas y te indican cuánto margen de error tienes en esa sesión.",
  },
  {
    icon: "fa-hourglass-half",
    q: "¿Qué es el Pomodoro y cómo se relaciona con los cursos?",
    a: "Es un temporizador de estudio por bloques (trabajo/descanso). Puedes armar tu horario semanal asignando cursos a cada bloque de Pomodoro.",
  },
  {
    icon: "fa-floppy-disk",
    q: "¿Se guarda mi progreso?",
    a: "Sí, tu progreso, horario y preguntas vistas se guardan automáticamente en el celular o la computadora que estés usando.",
  },
  {
    icon: "fa-volume-high",
    q: "¿Puedo escuchar la teoría en vez de leerla?",
    a: "Sí, dentro de cada tema hay un botón para activar la lectura en voz alta de la teoría, por si prefieres escucharla en vez de leerla.",
  },
  {
    icon: "fa-circle-info",
    q: "¿Qué son las palabras subrayadas en la teoría?",
    a: "Son términos con una explicación adicional: al interactuar con ellas puedes ver su definición sin salir de la página.",
  },
  {
    icon: "fa-list-check",
    q: "¿Puedo estudiar solo preguntas, sin repasar la teoría primero?",
    a: "Sí, puedes elegir el modo de estudio que prefieras al entrar a un tema, incluyendo ir directo a las preguntas.",
  },
  {
    icon: "fa-magnifying-glass",
    q: "¿Cómo busco un curso o tema específico?",
    a: "Usa el buscador disponible en la parte superior de las páginas principales: escribe el nombre y selecciona el resultado para ir directo a él.",
  },
  {
    icon: "fa-calendar-days",
    q: "¿Cómo edito mi horario de estudio?",
    a: "Desde la sección de Pomodoro puedes entrar al editor de horario, donde agregas o quitas cursos por día y defines cuántos Pomodoros le dedicas a cada uno.",
  },
  {
    icon: "fa-pause",
    q: "¿Qué pasa si cierro la página a mitad de un Pomodoro?",
    a: "No pasa nada: el Pomodoro sigue contando donde lo dejaste la próxima vez que entres.",
  },
  {
    icon: "fa-mobile-screen",
    q: "¿Se puede usar desde el celular?",
    a: "Sí, la app está pensada para verse bien tanto en el celular como en la computadora.",
  },
  {
    icon: "fa-heart-crack",
    q: "¿Qué pasa cuando me quedo sin vidas?",
    a: "Se te indica que agotaste tus intentos en esa sesión de preguntas, para que retomes el tema más adelante con calma.",
  },
  {
    icon: "fa-shield-halved",
    q: "¿Se guarda mi progreso si cierro el navegador?",
    a: "Sí, tu progreso queda guardado en tu celular o computadora y sigue ahí la próxima vez que entres, mientras no borres el historial o los datos de la app.",
  },
  {
    icon: "fa-circle-question",
    q: "¿De qué tipo son las preguntas del examen?",
    a: "Son preguntas de opción múltiple, ligadas directamente al tema y la teoría que acabas de revisar.",
  },
  {
    icon: "fa-bell",
    q: "¿Por qué suena una alarma al terminar el Pomodoro? / ¿Puedo silenciarla?",
    a: "La alarma avisa que terminó el bloque de tiempo para que tomes tu descanso o sigas con el siguiente curso; puedes silenciarla o cambiarla desde las opciones de sonido.",
  },
  {
    icon: "fa-user",
    q: "¿Por qué me pide mi nombre al entrar?",
    a: "Solo para personalizar los mensajes de la app (por ejemplo, saludarte por tu nombre). No necesitas crear una cuenta ni ingresar más datos.",
  },
  {
    icon: "fa-layer-group",
    q: "¿Hay niveles dentro de un tema?",
    a: "Sí, algunos temas están organizados en niveles progresivos: al avanzar en uno se desbloquea el siguiente.",
  },
];

/**
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function WelcomeSection({ onSelectTema }) {
  const [cursoAbierto, setCursoAbierto] = useState(null);
  const [faqAbierto, setFaqAbierto] = useState(null);

  const cursosConTemas = manifest.cursos.filter(
    (curso) => curso.temas.length > 0
  );

  const totalTemas = cursosConTemas.reduce(
    (acc, curso) => acc + curso.temas.length,
    0
  );

  function alternarCurso(i) {
    setCursoAbierto((actual) => (actual === i ? null : i));
  }

  function manejarClickTema(curso, tema) {
    onSelectTema?.({
      type: "tema",
      curso: curso.nombre,
      tema: tema.tema,
      archivo: tema.archivo,
    });
  }

  function alternarFaq(i) {
    setFaqAbierto((actual) => (actual === i ? null : i));
  }

  return (
    <div className="welcome-section">

      {/* ======================================================
          SECCIÓN DE CURSOS
          El fondo ocupa TODO el ancho.
          El container limita únicamente el contenido.
      ====================================================== */}

      <section className="welcome-section__courses">

        <div className="welcome-section__intro container">

          <h2 className="welcome-section__title">
            Qué encontrarás en Mi Estudio
          </h2>

          <p className="welcome-section__lead">
            Una plataforma para preparar tus exámenes: teoría organizada por
            temas, preguntas de práctica, repaso espaciado y un Pomodoro para
            armar tu horario de estudio. En total hay{" "}
            <strong>{cursosConTemas.length} cursos</strong> con{" "}
            <strong>{totalTemas} temas</strong> disponibles.
          </p>

          <div className="welcome-section__grid">
            {cursosConTemas.map((curso, i) => {
              const abierto = cursoAbierto === i;

              return (
                <article
                  key={curso.codigo}
                  className={`welcome-section__curso welcome-section__curso--${i % 4} ${abierto ? "is-open" : ""
                    }`}
                >
                  <div className="welcome-section__curso-top">
                    <div className="welcome-section__curso-info">
                      <span className="welcome-section__curso-nombre">
                        {curso.nombre}
                      </span>

                      <span className="welcome-section__curso-count">
                        {curso.temas.length} tema
                        {curso.temas.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <p className="welcome-section__curso-desc">
                      {DESCRIPCIONES_CURSO[curso.codigo] ||
                        "Temario disponible para repasar."}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="welcome-section__ver-btn"
                    aria-expanded={abierto}
                    onClick={() => alternarCurso(i)}
                  >
                    <span>{abierto ? "Ocultar temas" : "Ver temas"}</span>

                    <i
                      className={`fa-solid fa-chevron-down welcome-section__ver-btn-icon ${abierto ? "is-open" : ""
                        }`}
                    />
                  </button>

                  {abierto && (
                    <ul className="welcome-section__temas">
                      {curso.temas.map((tema) => (
                        <li key={tema.archivo}>
                          <button
                            type="button"
                            className="welcome-section__tema-btn"
                            onClick={() => manejarClickTema(curso, tema)}
                          >
                            {tema.tema}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>

        </div>

      </section>

      {/* ======================================================
          PREGUNTAS FRECUENTES
          También tiene fondo a TODO el ancho.
      ====================================================== */}

      <section className="welcome-section__faq">

        <div className="welcome-section__faq-inner container">

          <h2 className="welcome-section__title">
            Preguntas frecuentes
          </h2>

          <div className="welcome-section__faq-list">

            {FAQS.map((item, i) => {
              const abierto = faqAbierto === i;

              return (
                <details
                  key={i}
                  className={`welcome-section__faq-item ${abierto ? "is-open" : ""
                    }`}
                  open={abierto}
                >

                  <summary
                    onClick={(e) => {
                      e.preventDefault();
                      alternarFaq(i);
                    }}
                  >

                    <span className="welcome-section__faq-summary-text">

                      <i
                        className={`fa-solid ${item.icon} welcome-section__faq-icon`}
                      />

                      <span>{item.q}</span>

                    </span>



                  </summary>

                  <div className="welcome-section__faq-answer">
                    <p>{item.a}</p>
                  </div>

                </details>
              );
            })}

          </div>

        </div>

      </section>

    </div>
  );
}