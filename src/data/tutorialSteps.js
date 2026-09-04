/**
 * Pasos de cada tutorial tipo videojuego: cada uno apunta a un elemento REAL
 * de la interfaz (selector CSS). El componente TutorialSpotlight hace scroll
 * hasta ahí, lo resalta y muestra la explicación.
 *
 * IMPORTANTE: si agregas o renombras clases en el markup, actualiza los
 * selectores aquí también, o ese paso se saltará solo.
 */

export const TUTORIAL_WELCOME = [
  {
    selector: ".editar-nombre-foto",
    titulo: "Tu foto",
    texto: "Toca aquí para agregar una foto de perfil. Es opcional, puedes dejarlo así si prefieres."
  },
  {
    selector: ".welcome-input",
    titulo: "Tu nombre",
    texto: "Escribe cómo quieres que te llamemos dentro de la app. Luego puedes cambiarlo cuando quieras."
  }
];

export const TUTORIAL_INICIO = [
  {
    selector: ".topbar__search-bar",
    titulo: "Buscar",
    texto: "Si ya sabes qué tema buscas, usa esta barra para encontrarlo al instante. Puedes buscar tanto por curso como por tema."
  },
  {
    selector: "a[title='Ir a Mis Repasos']",
    titulo: "Repasos",
    texto: "Acá vuelven los temas que ya estudiaste, para reforzarlos antes de que se te olviden."
  },
  {
    selector: "a[title='Ir al Pomodoro']",
    titulo: "Pomodoro",
    texto: "Organiza tu horario de estudio y usa el cronómetro para enfocarte por bloques."
  },
  {
    selector: "a[title='Editar horario']",
    titulo: "Editar horario",
    texto: "Desde aquí armas o modificas los bloques de estudio de cada día de la semana."
  },
  {
    selector: "button[title='Editar perfil']",
    titulo: "Perfil",
    texto: "Aquí puedes cambiar tu nombre o tu foto cuando quieras."
  },
  {
    selector: ".welcome-section__continuar-btn",
    titulo: "Continuar",
    texto: "Aquí retomas el último tema que dejaste a medias, justo donde te quedaste."
  },
  {
    selector: ".welcome-section__curso-top",
    titulo: "Un curso",
    texto:
      "Cada tarjeta es un curso: muestra su nombre, cuántos temas tiene y tu progreso (el trofeo). Presiona \"Ver temas\" para desplegar la lista de temas de ese curso."
  },
  {
    selector: ".welcome-section__tema-btn",
    titulo: "Un tema",
    texto: "Toca cualquier tema para empezar a estudiarlo: teoría, ejercicios y preguntas. El ícono te dice si ya lo completaste."
  }
];

// Pasos extra que solo se muestran la primera vez que se abre el buscador
// (SearchModal), ya que sus resultados no existen en el DOM hasta entonces.
export const TUTORIAL_BUSCADOR = [
  {
    selector: ".search-result-item.is-curso",
    titulo: "Resultado de curso",
    texto: "Si el resultado es un curso, tócalo para ver todos sus temas."
  },
  {
    selector: ".search-result-item.is-tema",
    titulo: "Resultado de tema",
    texto: "Si el resultado es un tema puntual, tócalo para entrar directo a estudiarlo."
  }
];

// Los tutoriales de Pomodoro, Editar horario y Repaso NO vuelven a explicar
// estos botones del header (Inicio, Buscar, Repaso, Pomodoro, Editar) — eso
// ya quedó cubierto en el tutorial de Inicio. Cada uno de abajo solo explica
// lo que es propio de su página.

export const TUTORIAL_CONFIGURAR_DIAS = [
  {
    selector: ".setup-dias-grid",
    titulo: "Elige tus días",
    texto: "Marca los días de la semana en los que vas a estudiar. Puedes elegir varios a la vez."
  },
  {
    selector: ".setup-nav .setup-btn.is-primary",
    titulo: "Continuar",
    texto: "Cuando termines de elegir tus días, presiona aquí para seguir armando tu horario."
  }
];

export const TUTORIAL_CONFIGURAR_CURSO = [
  {
    selector: ".setup-input-wrap",
    titulo: "Elige el curso",
    texto: "Escribe el nombre de un curso tuyo. Te aparecerán sugerencias mientras escribes."
  },
  {
    selector: ".setup-pomo-grid",
    titulo: "Cantidad de pomodoros",
    texto: "Elige cuántos bloques de estudio (pomodoros) le vas a dedicar a este curso en este día."
  },
  {
    selector: ".setup-nav .setup-btn.is-primary",
    titulo: "Agregar curso",
    texto: "Presiona aquí para sumar este curso a tu horario. Puedes repetir esto para varios cursos por día."
  }
];

// Paso aparte: solo se muestra mientras está el gate de "Configurar Pomodoro"
// (o sea, cuando el usuario todavía no arma su horario). Una vez que sale de
// ese modal, recién sigue TUTORIAL_POMODORO con el resto de los pasos.
export const TUTORIAL_POMODORO_GATE = [
  {
    selector: ".gate-btn",
    titulo: "Configurar Pomodoro",
    texto: "Antes de empezar, arma tu horario semanal aquí: qué cursos estudias y cuándo."
  }
];

export const TUTORIAL_POMODORO = [
  {
    selector: ".horario__timer-clock",
    titulo: "El cronómetro",
    texto: "Este es tu tiempo de estudio. Se cuenta en bloques (pomodoros) con descansos entre medio."
  },
  {
    selector: ".horario__btn-reset",
    titulo: "Reiniciar",
    texto: "Vuelve a poner el cronómetro del bloque actual desde cero."
  },
  {
    selector: ".horario__rest-btn--corto",
    titulo: "Descansos",
    texto: "\"Desc. 10\" y \"Desc. 30\" son descansos manuales de 10 y 30 minutos."
  }
];

export const TUTORIAL_EDITAR_HORARIO = [
  {
    selector: "button[aria-label='Guardar Cambios']",
    titulo: "Guardar cambios",
    texto: "No olvides guardar todo antes de salir, o tus cambios en el horario se van a perder."
  }
];

export const TUTORIAL_REPASO = [
  {
    selector: ".repaso__check",
    titulo: "Marcar como hecho",
    texto: "Cuando termines de repasarlo en Mi Estudio, marca aquí para sacarlo de tu lista de pendientes."
  },
  {
    selector: ".repaso__trash",
    titulo: "Eliminar",
    texto: "Borra este repaso de tu lista de forma permanente."
  }
];

// Versión reducida: se usa cuando no hay repasos pendientes hoy, ya que
// los pasos de la tarjeta (.repaso__check, .repaso__trash) no existen
// todavía en el DOM.
export const TUTORIAL_REPASO_VACIO = [
  {
    selector: ".repaso__empty",
    titulo: "Sin pendientes por ahora",
    texto: "Cuando tengas un repaso pendiente, va a aparecer aquí como una tarjeta que puedes tocar y marcar como hecho."
  }
];