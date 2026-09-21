import temarioSesiones from "../data/temarioSesiones.json";
import { leerLog, leerHistorialRotacion } from "./repasoStorage";
import { leerHorario, DIAS_SEMANA } from "./scheduleStorage";
// ─────────────────────────────────────────────────────────────────────────
// Recomendaciones de Temario: qué toca hoy en cada curso.
//
// SEGÚN EL HORARIO DE POMODORO: si hay un horario configurado, hoy se
// recomiendan solo los cursos que tienes en el horario de ESTE día de la
// semana (lunes, martes...). De cada curso sale su bloque (turno) actual:
// el primero que todavía no tiene todos sus temas guardados. Ese bloque se
// mantiene hasta completarlo y solo entonces sale el siguiente. Cada curso
// avanza por su cuenta y lo que no completes un día no se acumula ni se
// mueve al día siguiente. Si no hay horario configurado, se usa la rotación
// de abajo. Si hay horario pero hoy no tiene cursos, no se recomienda nada.
//
// Rotación fija de 6 grupos (1 curso de "letras", 1 de "ciencias" y 1 de
// "cálculo" por grupo, cada curso pertenece siempre al mismo grupo). Los
// grupos se van alternando por día, y cada 6 días la combinación rota un
// lugar (día 7 no repite el grupo del día 1, sigue con el que seguía).
//
// El "día" no depende de ninguna fecha: avanza solo cuando TODOS los
// cursos del día ya tienen guardados en el log los temas que les tocaban.
// Si no guardaste todavía, se sigue recomendando lo mismo.
//
// Cada curso reparte TODO su temario (sin importar cuántos temas tenga)
// en exactamente 30 turnos, lo más parejo posible: si no divide exacto,
// los turnos de "menos carga" van primero y los de "más carga" al final
// (ej. 37 temas -> 23 turnos de 1 tema + 7 turnos de 2 temas). No se toca
// el JSON del temario: el reparto en 30 turnos se calcula aquí, aparte de
// las semanas/sesiones que ya trae el JSON.
// ─────────────────────────────────────────────────────────────────────────
export const GRUPOS_ROTACION = [
  ["Habilidad Verbal", "Educación Cívica", "Economía"],
  ["Lenguaje", "Geografía", "Álgebra"],
  ["Literatura", "Física", "Trigonometría"],
  ["Historia Universal", "Química", "Habilidad Lógico Matemático"],
  ["Historia del Perú", "Psicología", "Geometría"],
  ["Filosofía", "Biología", "Aritmética"],
];
const NUM_GRUPOS = GRUPOS_ROTACION.length;
// Cantidad de turnos en los que se reparte TODO el temario de un curso.
export const NUM_TURNOS_POR_CURSO = 30;
// Tope de seguridad para el bucle que busca el día actual.
const TOPE_DIAS_BUSQUEDA = 20000;
function numeroDeSemana(semanaKey) {
  return parseInt(semanaKey.replace("semana_", ""), 10);
}
// Todos los temas del curso, en orden, cada uno con la semana real del
// temario a la que pertenece (para poder marcarlo como hecho igual que
// lo hace la pestaña "Temario", que usa esa misma semana real).
function listaTemasDelCurso(curso) {
  const semanas = temarioSesiones[curso] || {};
  return Object.keys(semanas)
    .sort((a, b) => numeroDeSemana(a) - numeroDeSemana(b))
    .flatMap((semanaKey) => {
      const semana = numeroDeSemana(semanaKey);
      return semanas[semanaKey].flatMap((temasDeLaSesion) =>
        temasDeLaSesion.map((tema) => ({ tema, semana }))
      );
    });
}
// Reparte una lista plana de temas en NUM_TURNOS_POR_CURSO turnos, lo más
// parejo posible: si sobran, los turnos de más carga van al final.
function agruparEnTurnos(temasConSemana) {
  const total = temasConSemana.length;
  const base = Math.floor(total / NUM_TURNOS_POR_CURSO);
  const resto = total - base * NUM_TURNOS_POR_CURSO;
  const turnos = [];
  let cursor = 0;
  for (let i = 0; i < NUM_TURNOS_POR_CURSO; i++) {
    // Los primeros turnos (menor carga) tienen "base" temas; los últimos
    // "resto" turnos (mayor carga) tienen "base + 1".
    const esDeMayorCarga =
      i >= NUM_TURNOS_POR_CURSO - resto;
    const cantidad = base + (esDeMayorCarga ? 1 : 0);
    turnos.push(
      temasConSemana.slice(cursor, cursor + cantidad)
    );
    cursor += cantidad;
  }
  return turnos;
}
function turnoEstaCompleto(log, curso, turno) {
  if (turno.length === 0) return true;
  return turno.every(({ tema, semana }) =>
    log.some(
      (entrada) =>
        entrada.subject === curso &&
        entrada.tema === tema &&
        entrada.day === `Semana ${semana}`
    )
  );
}
function temasPendientesDeTurno(log, curso, turno) {
  return turno
    .filter(
      ({ tema, semana }) =>
        !log.some(
          (entrada) =>
            entrada.subject === curso &&
            entrada.tema === tema &&
            entrada.day === `Semana ${semana}`
        )
    )
    .map(({ tema }) => tema);
}
// Grupo (array de 3 cursos) que le toca al día N de la rotación (N >= 1).
export function grupoDelDia(dia) {
  const semanaCiclo = Math.floor((dia - 1) / NUM_GRUPOS);
  const posicion = (dia - 1) % NUM_GRUPOS;
  const indice = (semanaCiclo + posicion) % NUM_GRUPOS;
  return GRUPOS_ROTACION[indice];
}
/**
 * Recorre la rotación día por día desde el día 1, contando cuántos de los
 * 30 turnos ya le tocaron a cada curso. Un día se considera completado solo
 * si TODOS los cursos de ese grupo ya tienen guardado en el log el turno
 * que les correspondía (o ya no les queda ningún turno pendiente).
 * Se detiene en el primer día que todavía no está completo: ese es "hoy".
 */
function calcularEstadoRotacion() {
  // Log actual + historial: borrar un repaso no debe reabrir un día ya hecho.
  const log = [...leerLog(), ...leerHistorialRotacion()];
  const turnosPorCurso = {};
  Object.keys(temarioSesiones).forEach((curso) => {
    turnosPorCurso[curso] = agruparEnTurnos(
      listaTemasDelCurso(curso)
    );
  });
  const turnosDados = {};
  Object.keys(temarioSesiones).forEach((curso) => {
    turnosDados[curso] = 0;
  });
  let dia = 1;
  for (
    let intento = 0;
    intento < TOPE_DIAS_BUSQUEDA;
    intento++
  ) {
    const grupo = grupoDelDia(dia);
    const diaCompleto = grupo.every((curso) => {
      if (turnosDados[curso] >= NUM_TURNOS_POR_CURSO) {
        return true;
      }
      return turnoEstaCompleto(
        log,
        curso,
        turnosPorCurso[curso][turnosDados[curso]]
      );
    });
    if (!diaCompleto) break;
    grupo.forEach((curso) => {
      if (turnosDados[curso] < NUM_TURNOS_POR_CURSO) {
        turnosDados[curso] += 1;
      }
    });
    dia += 1;
  }
  return {
    dia,
    log,
    turnosPorCurso,
    turnosDados,
  };
}
// Clave del día de la semana como la guarda el horario ("lunes"... "domingo").
function claveDiaDeHoy(fecha) {
  return DIAS_SEMANA[(fecha.getDay() + 6) % 7];
}
function normalizarNombre(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
// El horario guarda el nombre que escribió el usuario: se empareja con el
// curso del temario ignorando mayúsculas y tildes (igual que HorarioPage).
function cursoDelTemario(nombre) {
  const buscado = normalizarNombre(nombre);
  return (
    Object.keys(temarioSesiones).find(
      (curso) => normalizarNombre(curso) === buscado
    ) || null
  );
}
// Bloque (turno) actual de un curso: el primero que todavía no está
// completo. Devuelve null si ya completó los 30.
function turnoActualDeCurso(log, curso) {
  const turnos = agruparEnTurnos(listaTemasDelCurso(curso));
  for (let i = 0; i < turnos.length; i++) {
    if (!turnoEstaCompleto(log, curso, turnos[i])) {
      return { indice: i, turno: turnos[i] };
    }
  }
  return null;
}
// Recomendaciones de hoy según el horario de Pomodoro.
function obtenerRecomendacionesPorHorario(horario, fecha) {
  const log = [...leerLog(), ...leerHistorialRotacion()];
  const cursosDeHoy = horario[claveDiaDeHoy(fecha)] || [];
  const yaAgregados = new Set();
  const recomendaciones = [];
  cursosDeHoy.forEach(({ subject }) => {
    const curso = cursoDelTemario(subject);
    if (!curso || yaAgregados.has(curso)) return;
    yaAgregados.add(curso);
    const actual = turnoActualDeCurso(log, curso);
    if (!actual) return;
    recomendaciones.push({
      curso,
      turno: actual.indice + 1,
      temas: temasPendientesDeTurno(log, curso, actual.turno),
      sesionesPendientesEnCurso:
        NUM_TURNOS_POR_CURSO - actual.indice,
    });
  });
  return recomendaciones;
}
/**
 * Devuelve, para el día actual de la rotación, los temas pendientes del
 * turno que le toca hoy a cada uno de los 3 cursos del grupo (los cursos
 * que ya terminaron sus 30 turnos simplemente no aparecen).
 */
export function obtenerRecomendacionesHoy(fecha = new Date()) {
  const horario = leerHorario();
  if (horario && Object.keys(horario).length > 0) {
    return obtenerRecomendacionesPorHorario(horario, fecha);
  }
  return obtenerRecomendacionesPorRotacion();
}
function obtenerRecomendacionesPorRotacion() {
  const {
    dia,
    log,
    turnosPorCurso,
    turnosDados,
  } = calcularEstadoRotacion();
  const grupo = grupoDelDia(dia);
  return grupo
    .filter(
      (curso) =>
        turnosDados[curso] < NUM_TURNOS_POR_CURSO
    )
    .map((curso) => {
      const numeroTurno = turnosDados[curso] + 1;
      const turno =
        turnosPorCurso[curso][turnosDados[curso]];
      return {
        curso,
        turno: numeroTurno,
        temas: temasPendientesDeTurno(
          log,
          curso,
          turno
        ),
        sesionesPendientesEnCurso:
          NUM_TURNOS_POR_CURSO - turnosDados[curso],
      };
    });
}
/**
 * Lista plana de nombres de tema recomendados hoy (para Inicio y para
 * resaltar en Temario).
 */
export function obtenerNombresTemasRecomendadosHoy() {
  return obtenerRecomendacionesHoy().flatMap(
    (r) => r.temas
  );
}