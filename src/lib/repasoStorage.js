// ─────────────────────────────────────────────────────────────────────────
// Lógica de repetición espaciada, compartida por TODAS las páginas.
// ─────────────────────────────────────────────────────────────────────────

export const REPASOS_STORAGE_KEY = "mi_estudio_repasos_log";

export const REPASO_INTERVALOS = [1, 3, 7, 21];

// ── Fechas ───────────────────────────────────────────────────────────────

export function fechaHoy() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fechaMasN(fechaStr, n) {
  const [y, m, d] = fechaStr.split("-").map(Number);

  const date = new Date(y, m - 1, d);

  date.setDate(date.getDate() + n);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function diffDias(fechaStr) {
  const hoy = new Date(fechaHoy());
  const fecha = new Date(fechaStr);

  return Math.round(
    (fecha - hoy) / (1000 * 60 * 60 * 24)
  );
}

export function formatearFecha(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);

  const date = new Date(y, m - 1, d);

  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

// ── Almacenamiento ──────────────────────────────────────────────────────

export function leerLog() {
  try {
    const raw = localStorage.getItem(
      REPASOS_STORAGE_KEY
    );

    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(
      "Error leyendo repasos guardados:",
      e
    );

    return [];
  }
}

function guardarLog(log) {
  try {
    localStorage.setItem(
      REPASOS_STORAGE_KEY,
      JSON.stringify(log)
    );
  } catch (e) {
    console.error(
      "Error guardando repasos:",
      e
    );
  }
}

// ── Registrar curso completado ──────────────────────────────────────────

export function registrarCursoCompletado({
  subject,
  day = "",
  level = "",
  tema = ""
}) {
  const log = leerLog();

  const nuevoId =
    log.length > 0
      ? Math.max(...log.map((e) => e.id)) + 1
      : 1;

  log.push({
    id: nuevoId,
    subject,
    day,
    level,
    tema,
    fechaCompletado: fechaHoy(),
    repasosDone: [],
    fechasRepasos: {}
  });

  guardarLog(log);

  return log;
}

// ── Marcar repaso hecho ─────────────────────────────────────────────────

export function marcarRepasoHecho(
  id,
  repasosDoneActual
) {
  const log = leerLog();

  const repasosDone = Array.isArray(repasosDoneActual)
    ? [...repasosDoneActual]
    : [];

  const entrada = log.find(
    (e) => e.id === id
  );

  if (!entrada) {
    return log;
  }

  const intervaloActual =
    repasosDone.length > 0
      ? Math.max(...repasosDone)
      : -1;

  if (
    !repasosDone.includes(intervaloActual + 1)
  ) {
    repasosDone.push(intervaloActual + 1);
  }

  if (!entrada.fechasRepasos) {
    entrada.fechasRepasos = {};
  }

  entrada.fechasRepasos[intervaloActual + 1] =
    fechaHoy();

  entrada.repasosDone = repasosDone;

  guardarLog(log);

  return log;
}

// ── Eliminar ────────────────────────────────────────────────────────────

export function eliminarRepaso(id) {
  const log = leerLog();

  const nuevoLog = log.filter(
    (e) => e.id !== id
  );

  guardarLog(nuevoLog);

  return nuevoLog;
}

// ── Próximo repaso ──────────────────────────────────────────────────────

export function proximoRepaso(entrada) {
  const done = Array.isArray(entrada.repasosDone)
    ? entrada.repasosDone
    : [];

  for (
    let i = 0;
    i < REPASO_INTERVALOS.length;
    i++
  ) {
    if (!done.includes(i)) {
      let fechaBase = entrada.fechaCompletado;

      if (
        i > 0 &&
        entrada.fechasRepasos &&
        entrada.fechasRepasos[i - 1]
      ) {
        fechaBase =
          entrada.fechasRepasos[i - 1];
      }

      const fecha = fechaMasN(
        fechaBase,
        REPASO_INTERVALOS[i]
      );

      return {
        intervaloIdx: i,
        fecha
      };
    }
  }

  return null;
}

// ── Colores ─────────────────────────────────────────────────────────────

export const INTERVALO_COLORES = [
  {
    badge: "interval-0",
    box: "interval-0"
  },
  {
    badge: "interval-1",
    box: "interval-1"
  },
  {
    badge: "interval-2",
    box: "interval-2"
  },
  {
    badge: "interval-3",
    box: "interval-3"
  }
];

export function intervaloClasses(
  intervaloIdx
) {
  return (
    INTERVALO_COLORES[intervaloIdx] ||
    INTERVALO_COLORES[
      INTERVALO_COLORES.length - 1
    ]
  );
}

// ── Clasificar ──────────────────────────────────────────────────────────

export function clasificarRepasos(log) {
  const repasosHoy = [];
  const proximos = [];

  log.forEach((entrada) => {
    const prox = proximoRepaso(entrada);

    if (!prox) {
      return;
    }

    const diff = diffDias(prox.fecha);

    if (diff <= 0) {
      repasosHoy.push({
        entrada,
        intervaloIdx: prox.intervaloIdx,
        vencido: diff < 0
      });

      return;
    }

    if (diff <= 14) {
      proximos.push({
        entrada,
        fecha: prox.fecha,
        diff,
        intervaloIdx: prox.intervaloIdx
      });
    }
  });

  return {
    repasosHoy,
    proximos
  };
}