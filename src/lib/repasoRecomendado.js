import temarioSesiones from "../data/temarioSesiones.json";
import { leerLog, leerHistorialRotacion } from "./repasoStorage";
import { leerHorario, DIAS_SEMANA } from "./scheduleStorage";

export const GRUPOS_ROTACION = [
  ["Habilidad Verbal", "Educación Cívica", "Economía"],
  ["Lenguaje", "Geografía", "Álgebra"],
  ["Literatura", "Física", "Trigonometría"],
  ["Historia Universal", "Química", "Habilidad Lógico Matemático"],
  ["Historia del Perú", "Psicología", "Geometría"],
  ["Filosofía", "Biología", "Aritmética"]
];

const NUM_GRUPOS = GRUPOS_ROTACION.length;
export const NUM_TURNOS_POR_CURSO = 30;
const TOPE_DIAS_BUSQUEDA = 20000;

function numeroDeSemana(semanaKey) {
  return parseInt(semanaKey.replace("semana_", ""), 10);
}

function listaTemasDelCurso(curso) {
  const semanas = temarioSesiones[curso] || {};

  return Object.keys(semanas)
    .sort((a, b) => numeroDeSemana(a) - numeroDeSemana(b))
    .flatMap((semanaKey) => {
      const semana = numeroDeSemana(semanaKey);

      return semanas[semanaKey].flatMap((temasDeLaSesion) =>
        temasDeLaSesion.map((tema) => ({
          tema,
          semana
        }))
      );
    });
}

function agruparEnTurnos(temasConSemana) {
  const total = temasConSemana.length;
  const base = Math.floor(total / NUM_TURNOS_POR_CURSO);
  const resto = total - base * NUM_TURNOS_POR_CURSO;
  const turnos = [];
  let cursor = 0;

  for (let i = 0; i < NUM_TURNOS_POR_CURSO; i++) {
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

export function grupoDelDia(dia) {
  const semanaCiclo = Math.floor((dia - 1) / NUM_GRUPOS);
  const posicion = (dia - 1) % NUM_GRUPOS;
  const indice = (semanaCiclo + posicion) % NUM_GRUPOS;

  return GRUPOS_ROTACION[indice];
}

function calcularEstadoRotacion() {
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
    turnosDados
  };
}

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

function cursoDelTemario(nombre) {
  const buscado = normalizarNombre(nombre);

  return (
    Object.keys(temarioSesiones).find(
      (curso) => normalizarNombre(curso) === buscado
    ) || null
  );
}

function turnoActualDeCurso(log, curso) {
  const turnos = agruparEnTurnos(
    listaTemasDelCurso(curso)
  );

  for (let i = 0; i < turnos.length; i++) {
    if (!turnoEstaCompleto(log, curso, turnos[i])) {
      return {
        indice: i,
        turno: turnos[i]
      };
    }
  }

  return null;
}

function obtenerRecomendacionesPorHorario(horario, fecha) {
  const log = [...leerLog(), ...leerHistorialRotacion()];
  const cursosDeHoy =
    horario[claveDiaDeHoy(fecha)] || [];

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
      temas: temasPendientesDeTurno(
        log,
        curso,
        actual.turno
      ),
      sesionesPendientesEnCurso:
        NUM_TURNOS_POR_CURSO - actual.indice
    });
  });

  return recomendaciones;
}

function obtenerRecomendacionesPorRotacion() {
  const {
    dia,
    log,
    turnosPorCurso,
    turnosDados
  } = calcularEstadoRotacion();

  return obtenerRecomendacionesParaDiaRotacion(
    dia,
    0,
    log,
    turnosPorCurso,
    turnosDados
  );
}

function obtenerRecomendacionesParaDiaRotacion(
  diaActual,
  desplazamiento,
  log,
  turnosPorCurso,
  turnosDadosActuales
) {
  const diaObjetivo = Math.max(
    1,
    diaActual + desplazamiento
  );

  const turnosDados = {
    ...turnosDadosActuales
  };

  if (desplazamiento > 0) {
    for (
      let dia = diaActual;
      dia < diaObjetivo;
      dia++
    ) {
      const grupo = grupoDelDia(dia);

      grupo.forEach((curso) => {
        if (
          turnosDados[curso] < NUM_TURNOS_POR_CURSO
        ) {
          turnosDados[curso] += 1;
        }
      });
    }
  } else if (desplazamiento < 0) {
    for (
      let dia = diaActual - 1;
      dia >= diaObjetivo;
      dia--
    ) {
      const grupo = grupoDelDia(dia);

      grupo.forEach((curso) => {
        if (turnosDados[curso] > 0) {
          turnosDados[curso] -= 1;
        }
      });
    }
  }

  const grupo = grupoDelDia(diaObjetivo);

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
          NUM_TURNOS_POR_CURSO - turnosDados[curso]
      };
    });
}

export function obtenerRecomendacionesDia(
  desplazamiento = 0,
  fecha = new Date()
) {
  const horario = leerHorario();

  if (horario && Object.keys(horario).length > 0) {
    const fechaObjetivo = new Date(fecha);
    fechaObjetivo.setDate(
      fechaObjetivo.getDate() + desplazamiento
    );

    return obtenerRecomendacionesPorHorario(
      horario,
      fechaObjetivo
    );
  }

  const estado = calcularEstadoRotacion();

  return obtenerRecomendacionesParaDiaRotacion(
    estado.dia,
    desplazamiento,
    estado.log,
    estado.turnosPorCurso,
    estado.turnosDados
  );
}

export function obtenerRecomendacionesHoy(
  fecha = new Date()
) {
  return obtenerRecomendacionesDia(0, fecha);
}

export function obtenerNombresTemasRecomendadosHoy() {
  return obtenerRecomendacionesHoy().flatMap(
    (r) => r.temas
  );
}