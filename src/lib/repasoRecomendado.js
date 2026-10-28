import temarioSesiones from "../data/coursesSemanas.json";
import { leerLog, leerHistorialRotacion } from "./repasoStorage";
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
      const contenido = semanas[semanaKey];
      const bloques = contenido.every(Array.isArray)
        ? contenido
        : [contenido];
      return bloques.flatMap((temasDeLaSesion) =>
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
        (!entrada.day || entrada.day === `Semana ${semana}`)
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
            (!entrada.day || entrada.day === `Semana ${semana}`)
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
    })
    .filter((r) => r.temas.length > 0);
}
/* ============================================================
   RECOMENDADOS BALANCEADOS (reemplaza a la rotación fija en "hoy")
   Cada plan trae 3 cursos, uno de cada categoría (letras,
   matemática y ciencias). Dentro de cada categoría se elige el curso
   con más temas pendientes (los más cargados primero) y se evita
   repetir el curso del plan anterior. Si una categoría ya terminó,
   su lugar lo ocupa el curso con más pendientes que quede.
   ============================================================ */
export const CATEGORIAS_ROTACION = {
  letras: [
    "Habilidad Verbal",
    "Lenguaje",
    "Literatura",
    "Historia Universal",
    "Historia del Perú",
    "Filosofía"
  ],
  ciencias: [
    "Biología",
    "Física",
    "Química",
    "Geografía",
    "Educación Cívica",
    "Psicología"
  ],
  matematica: [
    "Habilidad Lógico Matemático",
    "Aritmética",
    "Álgebra",
    "Geometría",
    "Trigonometría",
    "Economía"
  ]
};
// Temas que se recomiendan por curso en cada plan.
export const TEMAS_POR_CURSO_PLAN = 3;
const CLAVE_PLAN_RECOMENDADO = "mi_estudio_plan_recomendado";
function temaYaVisto(log, curso, { tema, semana }) {
  return log.some(
    (entrada) =>
      entrada.subject === curso &&
      entrada.tema === tema &&
      (!entrada.day || entrada.day === `Semana ${semana}`)
  );
}
function leerPlanGuardado() {
  try {
    const raw = localStorage.getItem(CLAVE_PLAN_RECOMENDADO);
    const plan = raw ? JSON.parse(raw) : null;
    if (!plan || !Array.isArray(plan.items)) return null;
    const valido = plan.items.every(
      (item) =>
        temarioSesiones[item.curso] && Array.isArray(item.temas)
    );
    return valido ? plan : null;
  } catch (e) {
    console.error("Error leyendo plan recomendado:", e);
    return null;
  }
}
function guardarPlan(plan) {
  try {
    localStorage.setItem(
      CLAVE_PLAN_RECOMENDADO,
      JSON.stringify(plan)
    );
  } catch (e) {
    console.error("Error guardando plan recomendado:", e);
  }
}
function generarPlanBalanceado(log, cursosPlanAnterior) {
  const cursos = Object.keys(temarioSesiones);
  const pendientes = {};
  cursos.forEach((curso) => {
    pendientes[curso] = listaTemasDelCurso(curso).filter(
      (t) => !temaYaVisto(log, curso, t)
    );
  });
  const elegidos = [];
  // El de más pendientes primero; los del plan anterior van al final.
  const mejorDe = (candidatos) =>
    candidatos
      .filter(
        (c) =>
          pendientes[c] &&
          pendientes[c].length > 0 &&
          !elegidos.includes(c)
      )
      .sort((a, b) => {
        const prevA = cursosPlanAnterior.includes(a) ? 1 : 0;
        const prevB = cursosPlanAnterior.includes(b) ? 1 : 0;
        if (prevA !== prevB) return prevA - prevB;
        return pendientes[b].length - pendientes[a].length;
      })[0];
  Object.values(CATEGORIAS_ROTACION).forEach((cursosCategoria) => {
    const curso = mejorDe(cursosCategoria);
    if (curso) elegidos.push(curso);
  });
  // Categoría terminada: su lugar lo toma el curso con más pendientes.
  while (elegidos.length < Object.keys(CATEGORIAS_ROTACION).length) {
    const curso = mejorDe(cursos);
    if (!curso) break;
    elegidos.push(curso);
  }
  return {
    items: elegidos.map((curso) => {
      const total = listaTemasDelCurso(curso).length;
      return {
        curso,
        turno:
          Math.floor(
            (total - pendientes[curso].length) /
              TEMAS_POR_CURSO_PLAN
          ) + 1,
        temas: pendientes[curso].slice(0, TEMAS_POR_CURSO_PLAN)
      };
    })
  };
}
function planAResultado(plan, log) {
  return plan.items
    .map((item) => ({
      curso: item.curso,
      turno: item.turno,
      temas: item.temas
        .filter((t) => !temaYaVisto(log, item.curso, t))
        .map((t) => t.tema),
      sesionesPendientesEnCurso: Math.ceil(
        listaTemasDelCurso(item.curso).filter(
          (t) => !temaYaVisto(log, item.curso, t)
        ).length / TEMAS_POR_CURSO_PLAN
      )
    }))
    .filter((r) => r.temas.length > 0);
}
// El plan se mantiene hasta completar todos sus temas; entonces se
// genera el siguiente con lo que falte.
function obtenerRecomendacionesBalanceadas() {
  const log = [...leerLog(), ...leerHistorialRotacion()];
  const guardado = leerPlanGuardado();
  let resultado = guardado ? planAResultado(guardado, log) : [];
  if (resultado.length === 0) {
    const plan = generarPlanBalanceado(
      log,
      guardado ? guardado.items.map((i) => i.curso) : []
    );
    guardarPlan(plan);
    resultado = planAResultado(plan, log);
  }
  return resultado;
}
export function obtenerRecomendacionesDia(
  desplazamiento = 0,
  fecha = new Date()
) {
  // Hoy usa el plan balanceado; otros días siguen con la rotación fija.
  if (desplazamiento === 0) {
    return obtenerRecomendacionesBalanceadas();
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