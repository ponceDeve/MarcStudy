import { useState } from "react";
import manifest from "../data/manifest.json";

// Descripciones con un poco de gancho, basadas en lo que cada curso
// realmente cubre (sin inventar cifras, alumnos ni respaldos). Todas
// tienen exactamente la misma cantidad de caracteres (90) para que
// las tarjetas de la grilla se vean parejas.
const DESCRIPCIONES_CURSO = {
  CIV: "Entiende cómo funciona el país en el que vives: leyes, derechos y tu rol de ciudadano hoy.",
  FIL: "Las preguntas que la humanidad lleva siglos haciéndose, contadas por quienes las plantean.",
  HIS: "Un recorrido desde los primeros pueblos hasta el mundo actual, para entender cómo llegamos",
  LEN: "Domina las reglas del idioma que usas todos los días, pero que nunca te enseñaron bien hoy",
  LIT: "Historias, autores y estilos que marcaron la forma de contar y de leer el mundo hasta hoy.",
  RVE: "Entrena tu lectura crítica: comprender rápido, deducir mejor y no caer en trampas de exame",
  BIO: "De la célula al cuerpo humano completo: cómo funciona la vida por dentro, paso a paso hoy.",
  ECO: "Por qué suben los precios, cómo se mueve el mercado y qué hay detrás de cada decisión hoy.",
  FIS: "El movimiento, la energía y las leyes invisibles que rigen todo lo que pasa a tu alrededor",
  GEO: "El relieve, el clima y la geografía que moldean al Perú, sus regiones y todo el mundo hoy.",
  PSI: "Cómo pensamos, sentimos y actuamos, explicado con lógica, evidencia y ejemplos cotidianos.",
  QUI: "Átomos, reacciones y compuestos: la química que está detrás de todo lo que tocas y respira",
  ALG: "Fundamentos y ejercicios de álgebra para resolver problemas paso a paso, sin complicaciones",
  ARI: "Razones, proporciones y esos problemas clásicos que casi siempre caen en el examen de hoy.",
  GEM: "Ángulos, figuras y áreas: la geometría que explica las formas que ves todos los días, hoy.",
  RMA: "Problemas de lógica y tiempo que ponen a prueba cómo piensas, no solo cuánto memorizas hoy",
  TRI: "Ángulos, razones trigonométricas y los triángulos que no te dejan tranquilo hasta dominar.",
};

const FAQS = [
  {
    q: "¿Cómo funciona el modo estudio?",
    a: "Eliges un curso o tema, primero puedes leer la teoría y luego responder preguntas relacionadas para reforzar lo aprendido.",
  },
  {
    q: '¿Qué es "Repaso"?',
    a: "Es una sección que te recuerda qué temas conviene repasar según cuándo los estudiaste, para que no se te olviden con el tiempo.",
  },
  {
    q: "¿Cómo se guarda mi Repaso exactamente?",
    a: "Cada vez que estudias un tema, la fecha queda guardada localmente en tu dispositivo. Con eso, Repaso calcula cuándo te conviene volver a verlo.",
  },
  {
    q: "¿Puedo quitar un tema de mis repasos pendientes?",
    a: "Sí, desde la lista de próximos repasos puedes eliminar cualquier tema que ya no quieras seguir repasando.",
  },
  {
    q: '¿Qué son las "vidas"?',
    a: "Representan tus intentos disponibles al responder preguntas dentro de un tema. Se van descontando si fallas y te indican cuánto margen de error tienes en esa sesión.",
  },
  {
    q: "¿Qué es el Pomodoro y cómo se relaciona con los cursos?",
    a: "Es un temporizador de estudio por bloques (trabajo/descanso). Puedes armar tu horario semanal asignando cursos a cada bloque de Pomodoro.",
  },
  {
    q: "¿Se guarda mi progreso?",
    a: "Sí, tu progreso, horario y preguntas vistas se guardan localmente en tu navegador o dispositivo.",
  },
  {
    q: "¿Puedo escuchar la teoría en vez de leerla?",
    a: "Sí, dentro de cada tema hay un botón para activar la lectura en voz alta de la teoría, por si prefieres escucharla en vez de leerla.",
  },
  {
    q: "¿Qué son las palabras subrayadas en la teoría?",
    a: "Son términos con una explicación adicional: al interactuar con ellas puedes ver su definición sin salir de la página.",
  },
  {
    q: "¿Puedo estudiar solo preguntas, sin repasar la teoría primero?",
    a: "Sí, puedes elegir el modo de estudio que prefieras al entrar a un tema, incluyendo ir directo a las preguntas.",
  },
  {
    q: "¿Cómo busco un curso o tema específico?",
    a: "Usa el buscador disponible en la parte superior de las páginas principales: escribe el nombre y selecciona el resultado para ir directo a él.",
  },
  {
    q: "¿Cómo edito mi horario de estudio?",
    a: "Desde la sección de Pomodoro puedes entrar al editor de horario, donde agregas o quitas cursos por día y defines cuántos Pomodoros le dedicas a cada uno.",
  },
  {
    q: "¿Qué pasa si cierro la página a mitad de un Pomodoro?",
    a: "El estado del Pomodoro se guarda, así que al volver a abrir la app puede continuar desde donde lo dejaste.",
  },
  {
    q: "¿Se puede usar desde el celular?",
    a: "Sí, la interfaz está pensada para adaptarse a pantallas de celular además de computadora.",
  },
  {
    q: "¿Tiene modo oscuro/claro?",
    a: "Sí, puedes cambiar entre tema oscuro y claro según tu preferencia.",
  },
  {
    q: "¿Qué pasa cuando me quedo sin vidas?",
    a: "Se te indica que agotaste tus intentos en esa sesión de preguntas, para que retomes el tema más adelante con calma.",
  },
  {
    q: "¿Se guarda mi progreso si cierro el navegador?",
    a: "Sí, al guardarse localmente en tu dispositivo, tu progreso sigue ahí la próxima vez que entres, mientras no borres los datos del navegador.",
  },
  {
    q: "¿De qué tipo son las preguntas del examen?",
    a: "Son preguntas de opción múltiple, ligadas directamente al tema y la teoría que acabas de revisar.",
  },
  {
    q: "¿Por qué suena una alarma al terminar el Pomodoro? / ¿Puedo silenciarla?",
    a: "La alarma avisa que terminó el bloque de tiempo para que tomes tu descanso o sigas con el siguiente curso; puedes silenciarla o cambiarla desde las opciones de sonido.",
  },
  {
    q: "¿Por qué me pide mi nombre al entrar?",
    a: "Solo para personalizar los mensajes de la app (por ejemplo, saludarte por tu nombre). No necesitas crear una cuenta ni ingresar más datos.",
  },
  {
    q: "¿Hay niveles dentro de un tema?",
    a: "Sí, algunos temas están organizados en niveles progresivos: al avanzar en uno se desbloquea el siguiente.",
  },
];

export default function WelcomeSection({ onSelectTema }) {
  const [cursoAbierto, setCursoAbierto] = useState(null);
  const cursosConTemas = manifest.cursos.filter((c) => c.temas.length > 0);
  const totalTemas = cursosConTemas.reduce((acc, c) => acc + c.temas.length, 0);

  return (
    <div className="welcome-section">
      <section className="welcome-section__intro">
        <h2 className="welcome-section__title">Qué encontrarás en Mi Estudio</h2>
        <p className="welcome-section__lead">
          Una plataforma para preparar tus exámenes: teoría organizada por temas,
          preguntas de práctica, repaso espaciado y un Pomodoro para armar tu
          horario de estudio. En total hay <strong>{cursosConTemas.length} cursos</strong> con{" "}
          <strong>{totalTemas} temas</strong> disponibles.
        </p>

        <div className="welcome-section__grid">
          {cursosConTemas.map((c, i) => {
            const abierto = cursoAbierto === i;
            return (
              <div
                key={c.codigo}
                className={`welcome-section__curso ${abierto ? "is-open" : ""}`}
              >
                <div className="welcome-section__curso-top">
                  <div className="welcome-section__curso-info">
                    <span className="welcome-section__curso-nombre">{c.nombre}</span>
                    <span className="welcome-section__curso-count">
                      {c.temas.length} tema{c.temas.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="welcome-section__curso-desc">
                    {DESCRIPCIONES_CURSO[c.codigo] || "Temario disponible para repasar."}
                  </p>
                </div>

                <button
                  type="button"
                  className="welcome-section__ver-btn"
                  aria-expanded={abierto}
                  onClick={() => setCursoAbierto(abierto ? null : i)}
                >
                  {abierto ? "Ocultar temas" : "Ver temas"}
                  <i className={`fa-solid fa-chevron-down welcome-section__ver-btn-icon ${abierto ? "is-open" : ""}`} />
                </button>

                {abierto && (
                  <ul className="welcome-section__temas">
                    {c.temas.map((t) => (
                      <li key={t.archivo}>
                        <button
                          type="button"
                          className="welcome-section__tema-btn"
                          onClick={() =>
                            onSelectTema?.({
                              type: "tema",
                              curso: c.nombre,
                              tema: t.tema,
                              archivo: t.archivo,
                            })
                          }
                        >
                          {t.tema}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="welcome-section__faq">
        <h2 className="welcome-section__title">Preguntas frecuentes</h2>
        <div className="welcome-section__faq-list">
          {FAQS.map((item, i) => (
            <details key={i} className="welcome-section__faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}