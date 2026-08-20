import { useState, useMemo } from "react";
import manifest from "../data/manifest.json";

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
  TRI: "Ángulos, razones trigonométricas y los triángulos que no te dejan tranquilo hasta dominar."
};

const FAQS = [
  {
    icon: "fa-graduation-cap",
    q: "¿Cómo funciona el modo estudio?",
    a: "Eliges un curso o tema, revisas la teoría y luego puedes responder preguntas para practicar."
  },
  {
    icon: "fa-rotate",
    q: '¿Qué es "Repaso"?',
    a: "Te indica qué temas conviene volver a estudiar según cuándo los estudiaste."
  },
  {
    icon: "fa-clock",
    q: "¿Cómo se calcula mi próximo repaso?",
    a: "La app registra cuándo estudias cada tema y utiliza esa información para organizar tus próximos repasos."
  },
  {
    icon: "fa-trash",
    q: "¿Puedo quitar un tema de mis repasos?",
    a: "Sí. Puedes eliminar un tema de la lista de próximos repasos cuando quieras."
  },
  {
    icon: "fa-heart",
    q: '¿Qué son las "vidas"?',
    a: "Son tus intentos disponibles al responder preguntas dentro de una sesión."
  },
  {
    icon: "fa-hourglass-half",
    q: "¿Qué es el Pomodoro?",
    a: "Es un temporizador que divide el estudio en bloques de trabajo y descanso. También puedes usarlo para organizar tu horario."
  },
  {
    icon: "fa-floppy-disk",
    q: "¿Se guarda mi progreso?",
    a: "Sí. Tu progreso, horario y preguntas vistas se guardan automáticamente en tu dispositivo."
  },
  {
    icon: "fa-volume-high",
    q: "¿Puedo escuchar la teoría?",
    a: "Sí. Los temas que tienen lectura en voz alta incluyen un botón para escuchar la teoría."
  },
  {
    icon: "fa-circle-info",
    q: "¿Qué son las palabras subrayadas?",
    a: "Son términos que tienen información adicional. Puedes interactuar con ellos para consultar su definición."
  },
  {
    icon: "fa-list-check",
    q: "¿Puedo ir directamente a las preguntas?",
    a: "Sí. Puedes elegir estudiar la teoría o pasar directamente a las preguntas cuando el tema lo permita."
  },
  {
    icon: "fa-magnifying-glass",
    q: "¿Cómo busco un curso o tema?",
    a: "Usa el buscador de las páginas principales para encontrar rápidamente el curso o tema que necesitas."
  },
  {
    icon: "fa-calendar-days",
    q: "¿Cómo edito mi horario?",
    a: "Desde Pomodoro puedes organizar tus cursos por día y decidir cuántos bloques dedicarás a cada uno."
  },
  {
    icon: "fa-pause",
    q: "¿Qué pasa si cierro la página durante un Pomodoro?",
    a: "El temporizador guarda su estado para que puedas continuar cuando vuelvas."
  },
  {
    icon: "fa-mobile-screen",
    q: "¿Puedo usar Mi Estudio desde el celular?",
    a: "Sí. La plataforma está adaptada para celulares, tablets y computadoras."
  },
  {
    icon: "fa-heart-crack",
    q: "¿Qué pasa si me quedo sin vidas?",
    a: "La sesión de preguntas termina y puedes volver al tema más adelante."
  },
  {
    icon: "fa-shield-halved",
    q: "¿Mi progreso se mantiene si cierro el navegador?",
    a: "Sí. El progreso permanece guardado en el dispositivo mientras no borres los datos de la aplicación."
  },
  {
    icon: "fa-circle-question",
    q: "¿Cómo son las preguntas del examen?",
    a: "Son preguntas de opción múltiple relacionadas directamente con el tema estudiado."
  },
  {
    icon: "fa-bell",
    q: "¿Por qué suena una alarma al terminar el Pomodoro?",
    a: "La alarma te avisa que terminó el bloque de estudio. Puedes configurar las opciones de sonido."
  },
  {
    icon: "fa-user",
    q: "¿Por qué me pide mi nombre?",
    a: "Solo se utiliza para personalizar algunos mensajes de la aplicación."
  },
  {
    icon: "fa-layer-group",
    q: "¿Hay niveles dentro de un tema?",
    a: "Sí. Algunos temas están divididos en niveles que se desbloquean progresivamente."
  }
];

export default function WelcomeSection({ onSelectTema, ultimoTema, temasCompletadosLista = [] }) {
  const [cursoAbierto, setCursoAbierto] = useState(null);
  const [faqAbierto, setFaqAbierto] = useState(null);

  const cursosConTemas = useMemo(
    () =>
      manifest.cursos.filter(
        (curso) => curso.temas.length > 0
      ),
    []
  );

  const totalTemas = useMemo(
    () =>
      cursosConTemas.reduce(
        (total, curso) =>
          total + curso.temas.length,
        0
      ),
    [cursosConTemas]
  );

  function logrosDelCurso(curso) {
    return temasCompletadosLista.filter(
      (id) =>
        id.startsWith(`${curso.nombre}_`)
    ).length;
  }

  function alternarCurso(i) {
    setCursoAbierto((actual) =>
      actual === i ? null : i
    );
  }

  function manejarClickTema(curso, tema) {
    onSelectTema?.({
      type: "tema",
      curso: curso.nombre,
      tema: tema.tema,
      archivo: tema.archivo
    });
  }

  function alternarFaq(i) {
    setFaqAbierto((actual) =>
      actual === i ? null : i
    );
  }

  return (
    <div className="welcome-section">
      <section className="welcome-section__courses">
        <div className="welcome-section__intro container">
          {ultimoTema && (
            <button
              type="button"
              className="welcome-section__continuar-btn"
              onClick={() =>
                onSelectTema?.({
                  type: "tema",
                  curso: ultimoTema.curso,
                  tema: ultimoTema.tema,
                  archivo: ultimoTema.archivo
                })
              }
            >
              <i className="fa-solid fa-play" />
              <span>
                Continuar: {ultimoTema.tema}
              </span>
            </button>
          )}

          <h2 className="welcome-section__title">
            Qué encontrarás en Mi Estudio
          </h2>

          <div className="welcome-section__logros">
            <i className="fa-solid fa-trophy welcome-section__logros-icon" />
            <div className="welcome-section__logros-text">
              <span className="welcome-section__logros-num">
                {temasCompletadosLista.length} / {totalTemas}
              </span>
              <span className="welcome-section__logros-label">
                temas completados
              </span>
            </div>
          </div>

          <p className="welcome-section__lead">
            Teoría, preguntas de práctica, repasos y
            herramientas para organizar tu estudio.
            Actualmente hay{" "}
            <strong>
              {cursosConTemas.length} cursos
            </strong>{" "}
            y{" "}
            <strong>{totalTemas} temas</strong>.
          </p>

          <div className="welcome-section__grid">
            {cursosConTemas.map((curso, i) => {
              const abierto =
                cursoAbierto === i;

              return (
                <article
                  key={curso.codigo}
                  className={`welcome-section__curso welcome-section__curso--${i % 4
                    }${abierto ? " is-open" : ""}`}
                >
                  <div className="welcome-section__curso-top">
                    <div className="welcome-section__curso-info">
                      <span className="welcome-section__curso-nombre">
                        {curso.nombre}
                      </span>

                      <div className="box-nombre-logros">
                        <span className="welcome-section__curso-count">
                          {curso.temas.length} tema
                          {curso.temas.length !==
                            1
                            ? "s"
                            : ""}
                        </span>

                        <span className="welcome-section__curso-logros">
                          <i className="fa-solid fa-trophy" />
                          {logrosDelCurso(curso)}/{curso.temas.length}
                        </span>
                      </div>
                    </div>

                    <p className="welcome-section__curso-desc">
                      {DESCRIPCIONES_CURSO[
                        curso.codigo
                      ] ||
                        "Temario disponible para estudiar."}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`welcome-section__ver-btn${abierto
                        ? " is-open"
                        : ""
                      }`}
                    aria-expanded={
                      abierto
                    }
                    onClick={() =>
                      alternarCurso(i)
                    }
                  >
                    <span>
                      {abierto
                        ? "Ocultar temas"
                        : "Ver temas"}
                    </span>

                    <i
                      className={`fa-solid fa-chevron-down welcome-section__ver-btn-icon${abierto
                          ? " is-open"
                          : ""
                        }`}
                    />
                  </button>

                  {abierto && (
                    <ul className="welcome-section__temas">
                      {curso.temas.map(
                        (tema) => (
                          <li
                            key={
                              tema.archivo
                            }
                            className="welcome-section__tema-item"
                          >
                            <div className="welcome-section__tema-content">
                              <button
                                type="button"
                                className="welcome-section__tema-btn"
                                onClick={() =>
                                  manejarClickTema(
                                    curso,
                                    tema
                                  )
                                }
                              >
                                {tema.tema}
                              </button>
                            </div>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="welcome-section__faq">
        <div className="welcome-section__faq-inner container">
          <h2 className="welcome-section__title">
            Preguntas frecuentes
          </h2>

          <div className="welcome-section__faq-list">
            {FAQS.map((item, i) => {
              const abierto =
                faqAbierto === i;

              return (
                <details
                  key={i}
                  className={`welcome-section__faq-item${abierto
                      ? " is-open"
                      : ""
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
                      <span>
                        {item.q}
                      </span>
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