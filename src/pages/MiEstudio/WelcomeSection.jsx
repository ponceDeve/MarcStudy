import { useState, useMemo } from "react";
import manifest from "../data/manifest.json";

const DESCRIPCIONES_CURSO = {
  CIV: "Tus derechos, tus deberes y cómo funciona el país donde vives: todo lo que deberías saber para moverte como ciudadano, no solo para el examen.",
  FIL: "Las grandes preguntas que la humanidad se hace hace siglos, explicadas para que por fin tengan sentido y puedas discutirlas con tus propias ideas.",
  HIS: "Desde los primeros pueblos hasta hoy: un hilo conductor que te ayuda a entender por qué el mundo terminó siendo como es.",
  LEN: "Las reglas del idioma que usas todos los días pero que en el colegio nunca terminaron de quedarte claras. Aquí sí se entienden.",
  LIT: "Autores, obras y estilos que cambiaron la forma de contar historias, contados de una manera que dan ganas de leerlos.",
  RVE: "Practica leer más rápido, entender mejor y detectar las trampas típicas del examen antes de que te agarren desprevenido.",
  BIO: "De la célula al cuerpo humano completo: cómo funciona la vida por dentro, explicado paso a paso y sin tecnicismos innecesarios.",
  ECO: "Por qué suben los precios, cómo se mueve el mercado y qué decisiones hay detrás de todo eso que ves en las noticias.",
  FIS: "El movimiento, la energía y las leyes invisibles que explican todo lo que pasa a tu alrededor, incluso lo que no notas.",
  GEO: "El relieve, el clima y la geografía que moldean al Perú y al mundo, para que dejes de memorizar mapas y empieces a entenderlos.",
  PSI: "Cómo pensamos, sentimos y actuamos las personas, con lógica, evidencia y ejemplos que reconocerás en tu día a día.",
  QUI: "Átomos, reacciones y compuestos: la química que está detrás de todo lo que tocas, comes y respiras sin que te des cuenta.",
  ALG: "Fundamentos y ejercicios de álgebra resueltos paso a paso, para que dejes de temerle a las ecuaciones.",
  ARI: "Razones, proporciones y esos problemas clásicos que siempre caen en el examen, explicados de una forma que por fin se entiende.",
  GEM: "Ángulos, figuras y áreas: la geometría detrás de las formas que ves todos los días, aunque nunca lo hayas notado.",
  RMA: "Problemas de lógica y tiempo que ponen a prueba cómo piensas, no cuánto memorizas. Aquí aprendes a resolverlos con calma.",
  TRI: "Ángulos, razones trigonométricas y esos triángulos que parecen no tener sentido hasta que por fin haces clic."
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

export default function WelcomeSection({ onSelectTema, temasCompletadosLista = [] }) {
  // Solo conservamos el estado del FAQ, ya no necesitamos el del curso.
  const [faqAbierto, setFaqAbierto] = useState(null);

  // Por curso, en qué página de temas está (páginas de TEMAS_POR_PAGINA).
  const [paginaPorCurso, setPaginaPorCurso] = useState({});

  const TEMAS_POR_PAGINA = 6;

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

  function estadoTema(curso, tema) {
    const id = `${curso.nombre}_${tema.tema}`;

    if (temasCompletadosLista.includes(id)) {
      return "completado";
    }

    try {
      const abierto = localStorage.getItem(
        `ultimaCard_${curso.nombre}_${tema.tema}`
      );

      if (abierto !== null) {
        return "en_curso";
      }
    } catch {
      // localStorage no disponible: se asume pendiente
    }

    return "pendiente";
  }

  function logrosDelCurso(curso) {
    return temasCompletadosLista.filter(
      (id) =>
        id.startsWith(`${curso.nombre}_`)
    ).length;
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
            Aquí tienes todo lo que necesitas para prepararte
            de verdad: teoría explicada con calma, preguntas
            para practicar, repasos que te avisan cuándo volver
            a un tema y herramientas para organizar tu tiempo.
            Ahora mismo hay{" "}
            <strong>
              {cursosConTemas.length} cursos
            </strong>{" "}
            y{" "}
            <strong>{totalTemas} temas</strong>{" "}
            esperando a que empieces.
          </p>

          <div className="welcome-section__grid">
            {cursosConTemas.map((curso, i) => {
              return (
                <article
                  key={curso.codigo}
                  className={`welcome-section__curso welcome-section__curso--${i % 4}`}
                >
                  <div className="welcome-section__curso-top">
                    <div className="welcome-section__curso-info">
                      {/* El nombre del curso arriba */}
                      <span className="welcome-section__curso-nombre">
                        {curso.nombre}
                      </span>

                      {/* La caja con el contador de temas y los logros al lado */}
                      <div className="box-nombre-logros">
                        <span className="welcome-section__curso-count">
                          {curso.temas.length} tema{curso.temas.length !== 1 ? "s" : ""}
                        </span>

                        {/* ¡Aquí están de vuelta los logros! */}
                        <span className="welcome-section__curso-logros">
                          <i className="fa-solid fa-trophy" />
                          {logrosDelCurso(curso)}/{curso.temas.length}
                        </span>
                      </div>
                    </div>

                    <p className="welcome-section__curso-desc">
                      {DESCRIPCIONES_CURSO[curso.codigo] || "Temario disponible para estudiar."}
                    </p>
                  </div>

                  {/* LISTA DE TEMAS: se muestra de a TEMAS_POR_PAGINA */}
                  <ul className="welcome-section__temas">
                    {(() => {
                      const pagina = paginaPorCurso[curso.codigo] || 0;
                      const inicio = pagina * TEMAS_POR_PAGINA;
                      return curso.temas.slice(inicio, inicio + TEMAS_POR_PAGINA);
                    })().map((tema) => {
                      const estado = estadoTema(curso, tema);

                      return (
                        <li
                          key={tema.archivo}
                          className="welcome-section__tema-item"
                        >
                          <div className="welcome-section__tema-content">
                            <button
                              type="button"
                              className="welcome-section__tema-btn"
                              onClick={() => manejarClickTema(curso, tema)}
                            >
                              {/* 1. Ícono de estado a la izquierda */}
                              <span className={`welcome-section__tema-estado welcome-section__tema-estado--${estado}`}>
                                <i
                                  className={
                                    estado === "completado"
                                      ? "fa-solid fa-circle-check" // Check verdecito
                                      : estado === "en_curso"
                                        ? "fa-regular fa-circle-check" // Check amarillo
                                        : "fa-regular fa-circle" // Circulo vacío pendiente
                                  }
                                  title={
                                    estado === "completado"
                                      ? "Completado"
                                      : estado === "en_curso"
                                        ? "En curso"
                                        : "No iniciado"
                                  }
                                />
                              </span>

                              {/* 2. Texto del tema a la derecha */}
                              <span>{tema.tema}</span>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {curso.temas.length > TEMAS_POR_PAGINA && (() => {
                    const pagina = paginaPorCurso[curso.codigo] || 0;
                    const hayMas = (pagina + 1) * TEMAS_POR_PAGINA < curso.temas.length;
                    const hayMenos = pagina > 0;

                    return (
                      <div className="welcome-section__temas-nav">
                        {hayMenos && (
                          <button
                            type="button"
                            className="welcome-section__temas-toggle"
                            onClick={() =>
                              setPaginaPorCurso((prev) => ({
                                ...prev,
                                [curso.codigo]: pagina - 1
                              }))
                            }
                          >
                            <i className="fa-solid fa-chevron-up" />
                            Mostrar menos
                          </button>
                        )}

                        {hayMas && (
                          <button
                            type="button"
                            className="welcome-section__temas-toggle"
                            onClick={() =>
                              setPaginaPorCurso((prev) => ({
                                ...prev,
                                [curso.codigo]: pagina + 1
                              }))
                            }
                          >
                            Mostrar más
                            <i className="fa-solid fa-chevron-down" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
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
              const abierto = faqAbierto === i;

              return (
                <details
                  key={i}
                  className={`welcome-section__faq-item${abierto ? " is-open" : ""}`}
                  open={abierto}
                >
                  <summary
                    onClick={(e) => {
                      e.preventDefault();
                      alternarFaq(i);
                    }}
                  >
                    <span className="welcome-section__faq-summary-text">
                      <i className={`fa-solid ${item.icon} welcome-section__faq-icon`} />
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