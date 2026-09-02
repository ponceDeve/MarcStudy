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
    selector: ".btn__inicio",
    titulo: "Inicio",
    texto: "Este logo siempre te trae de vuelta a esta pantalla principal, desde cualquier sección."
  },
  {
    selector: ".topbar__search-bar",
    titulo: "Buscar",
    texto: "Si ya sabes qué tema buscas, usa esta barra para encontrarlo al instante."
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
    selector: ".welcome-section__title",
    titulo: "Tus cursos",
    texto:
      "Acá ves todos los cursos disponibles. Cada uno tiene sus propios temas listos para estudiar."
  },
  {
    selector: ".welcome-section__logros",
    titulo: "Tus logros",
    texto: "Este contador sube cada vez que completas un tema. Es tu progreso general."
  },
  {
    selector: ".welcome-section__curso-top",
    titulo: "Un curso",
    texto:
      "Cada tarjeta es un curso. Muestra cuántos temas tiene y cuántos ya conquistaste."
  },
  {
    selector: ".welcome-section__tema-btn",
    titulo: "Un tema",
    texto: "Toca cualquier tema para empezar a estudiarlo: teoría, ejercicios y preguntas."
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

export const TUTORIAL_POMODORO = [
  {
    selector: ".gate-btn",
    titulo: "Configurar Pomodoro",
    texto: "Antes de empezar, arma tu horario semanal aquí: qué cursos estudias y cuándo."
  },
  {
    selector: ".horario__timer-clock",
    titulo: "El cronómetro",
    texto: "Este es tu tiempo de estudio. Se cuenta en bloques (pomodoros) con descansos entre medio."
  },
  {
    selector: ".horario__btn.is-start",
    titulo: "Iniciar",
    texto: "Presiona aquí para arrancar el bloque de estudio o descanso seleccionado."
  },
  {
    selector: ".horario__btn.is-pause",
    titulo: "Pausar",
    texto: "¿Necesitas parar un momento? Aquí pausas sin perder el progreso del bloque."
  },
  {
    selector: ".horario__btn-reset",
    titulo: "Reiniciar",
    texto: "Vuelve a poner el cronómetro del bloque actual desde cero."
  },
  {
    selector: ".horario__day-tabs",
    titulo: "Días de la semana",
    texto: "Cambia de día para ver o planear el horario de estudio de cada uno."
  },
  {
    selector: ".horario__courses-card",
    titulo: "Tus cursos del día",
    texto: "Acá aparecen los bloques de estudio que armaste para este día. Tócalos para activarlos."
  },
  {
    selector: ".horario__rest-btn--corto",
    titulo: "Descanso corto",
    texto: "Desc. 10 es para un respiro corto entre un curso y otro."
  },
  {
    selector: ".horario__rest-btn--largo",
    titulo: "Descanso largo",
    texto: "Desc. 30 es para un descanso más largo, como cuando vas a comer."
  },
  {
    selector: ".horario__quick-course",
    titulo: "Escoge un curso o tema",
    texto: "Si no tienes un bloque armado para ahora, elige aquí directamente el curso o tema que vas a estudiar."
  }
];

export const TUTORIAL_EDITAR_HORARIO = [
  {
    selector: ".editor-tabs",
    titulo: "Días",
    texto: "Elige a qué día de la semana le vas a armar o editar el horario."
  },
  {
    selector: ".editor-lista",
    titulo: "Bloques del día",
    texto: "Esta es la lista de cursos y descansos que ya tienes programados para ese día."
  },
  {
    selector: ".editor-add-box",
    titulo: "Agregar bloque",
    texto: "Escribe el curso o descanso que quieres sumar al horario de este día."
  },
  {
    selector: ".editor-pomo-grid",
    titulo: "Cantidad de pomodoros",
    texto: "Define cuántos bloques de estudio (pomodoros) le vas a dedicar a este curso."
  },
  {
    selector: ".editor-btn-add",
    titulo: "Guardar bloque",
    texto: "Cuando esté listo, presiona aquí para agregarlo a tu horario."
  },
  {
    selector: "button[aria-label='Agregar curso']",
    titulo: "Agregar curso",
    texto: "Abre el formulario para sumar un nuevo curso o descanso a este día."
  },
  {
    selector: ".editor-footer button[title='Cancelar']",
    titulo: "Cancelar",
    texto: "Cierra el editor sin guardar los cambios que hiciste."
  },
  {
    selector: "button[aria-label='Guardar Cambios']",
    titulo: "Guardar cambios",
    texto: "No olvides guardar todo antes de salir, o tus cambios en el horario se van a perder."
  }
];

export const TUTORIAL_REPASO = [
  {
    selector: ".repaso__instruction",
    titulo: "¿Qué es un repaso?",
    texto: "Acá vuelven los temas que ya estudiaste, para que no se te olviden con el tiempo."
  },
  {
    selector: ".repaso__item-subject",
    titulo: "Un repaso pendiente",
    texto: "Cada tarjeta es un tema que te toca reforzar. Toca sobre él para repasarlo."
  },
  {
    selector: ".repaso__check",
    titulo: "Marcar como hecho",
    texto: "Cuando termines de repasarlo, marca aquí para sacarlo de tu lista de pendientes."
  },
  {
    selector: ".repaso__item-day",
    titulo: "Cuándo repasarlo",
    texto: "Esta etiqueta te dice si el repaso es para hoy, si ya se pasó, o cuándo toca."
  },
  {
    selector: ".repaso__proximos-title",
    titulo: "Próximos repasos",
    texto: "Acá puedes ver los repasos que vienen más adelante, para planear tu semana."
  }
];

// Versión reducida: se usa cuando no hay repasos pendientes hoy, ya que
// los pasos de la tarjeta (.repaso__item-subject, .repaso__check,
// .repaso__item-day) no existen todavía en el DOM y el tutorial
// saltaría del paso 1 directo al 5.
export const TUTORIAL_REPASO_VACIO = [
  {
    selector: ".repaso__instruction",
    titulo: "¿Qué es un repaso?",
    texto: "Acá vuelven los temas que ya estudiaste, para que no se te olviden con el tiempo."
  },
  {
    selector: ".repaso__empty",
    titulo: "Sin pendientes por ahora",
    texto: "Cuando tengas un repaso pendiente, va a aparecer aquí como una tarjeta que puedes tocar y marcar como hecho."
  },
  {
    selector: ".repaso__proximos-title",
    titulo: "Próximos repasos",
    texto: "Acá puedes ver los repasos que vienen más adelante, para planear tu semana."
  }
];