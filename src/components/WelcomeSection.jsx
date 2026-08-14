import manifest from "../data/manifest.json";

// Descripciones breves por curso, escritas a mano a partir de lo que
// realmente cubre cada uno (sin inventar cifras, alumnos ni respaldos
// que no se puedan verificar).
const DESCRIPCIONES_CURSO = {
  CIV: "Normas, Constitución, derechos humanos, ciudadanía y democracia.",
  FIL: "Origen del pensamiento filosófico, corrientes y grandes autores.",
  HIS: "Desde la prehistoria hasta la historia contemporánea del Perú y el mundo.",
  LEN: "Comunicación, gramática y uso correcto del lenguaje.",
  LIT: "Géneros, figuras literarias y autores clave de la literatura peruana y universal.",
  RVE: "Comprensión lectora, sinonimia, antonimia y conectores lógicos.",
  BIO: "Célula, seres vivos, genética y los grandes sistemas del cuerpo.",
  ECO: "Conceptos económicos básicos, mercado, producción y política económica.",
  FIS: "Fenómenos físicos y su análisis, como el movimiento armónico simple.",
  GEO: "Geografía del Perú y del mundo: relieve, clima y dinámica terrestre.",
  PSI: "Procesos psicológicos, personalidad y orientación vocacional.",
  QUI: "Materia, átomos, reacciones y compuestos químicos.",
  ALG: "Fundamentos y ejercicios de álgebra.",
  ARI: "Razones, proporciones y problemas clásicos de aritmética.",
  GEM: "Fundamentos y ejercicios de geometría.",
  RMA: "Problemas de lógica, tiempo y razonamiento matemático aplicado.",
  TRI: "Ángulos, razones trigonométricas y triángulos notables.",
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
    a: "Sí, la teoría cuenta con lectura en voz alta para repasar sin necesidad de tener la vista fija en la pantalla.",
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
];

export default function WelcomeSection({ onSelectTema }) {
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

        <ul className="welcome-section__cursos">
          {cursosConTemas.map((c) => (
            <li key={c.codigo} className="welcome-section__curso">
              <details className="welcome-section__curso-details">
                <summary className="welcome-section__curso-summary">
                  <div className="welcome-section__curso-info">
                    <span className="welcome-section__curso-nombre">{c.nombre}</span>
                    <span className="welcome-section__curso-count">
                      {c.temas.length} tema{c.temas.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="welcome-section__curso-desc">
                    {DESCRIPCIONES_CURSO[c.codigo] || "Temario disponible para repasar."}
                  </p>
                </summary>

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
              </details>
            </li>
          ))}
        </ul>
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
