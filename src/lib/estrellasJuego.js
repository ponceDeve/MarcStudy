// Estrellas del videojuego (botón gamepad).
// Van APARTE de "estrellasTemas" (panel de niveles): si el juego se
// reinicia por game over, el panel de niveles no se entera.
//
// Estructura guardada en localStorage, una clave por tema:
//   estrellasJuego_<curso>_<tema> = {
//     "<titulo>": { ids: ["id1", "id2"], total: 6 }
//   }
// "ids" son las preguntas que ya acertó (sin importar cuántos intentos
// le tomó). Rendirse NO cuenta: solo cuenta cuando la acierta.

const PREFIJO = "estrellasJuego_";

function clave(curso, tema) {
  return `${PREFIJO}${curso}_${tema}`;
}

// floor(3 * aciertos / total):
//   total 1  -> 0 o 3 estrellas
//   total 2  -> 0, 1 o 3 estrellas
//   total 6  -> 0, 0, 1, 1, 2, 2, 3 estrellas según los aciertos
export function calcularEstrellas(aciertos, total) {
  if (!total || total <= 0) return 0;
  const a = Math.min(Math.max(aciertos, 0), total);
  return Math.floor((3 * a) / total);
}

export function leerRegistroJuego(curso, tema) {
  try {
    const obj = JSON.parse(localStorage.getItem(clave(curso, tema)) || "{}");
    return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

function escribirRegistro(curso, tema, registro) {
  try {
    localStorage.setItem(clave(curso, tema), JSON.stringify(registro));
  } catch {
    // Si el almacenamiento falla, la barra sigue funcionando en memoria.
  }
}

// Ids acertados de un título (array vacío si no hay nada guardado).
export function idsAcertadosDeTitulo(registro, titulo) {
  const entrada = registro?.[titulo];
  return Array.isArray(entrada?.ids) ? entrada.ids : [];
}

// Estrellas actuales de un título según lo guardado.
export function estrellasDeTitulo(registro, titulo) {
  const entrada = registro?.[titulo];
  if (!entrada) return 0;
  const ids = Array.isArray(entrada.ids) ? entrada.ids : [];
  return calcularEstrellas(ids.length, entrada.total);
}

// Marca una pregunta como acertada. Devuelve el registro actualizado
// del título: { ids, total, estrellas }.
export function registrarAciertoJuego(curso, tema, titulo, idPregunta, total) {
  const registro = leerRegistroJuego(curso, tema);
  const ids = idsAcertadosDeTitulo(registro, titulo);
  const nuevosIds = ids.includes(idPregunta) ? ids : [...ids, idPregunta];
  registro[titulo] = { ids: nuevosIds, total };
  escribirRegistro(curso, tema, registro);
  return {
    ids: nuevosIds,
    total,
    estrellas: calcularEstrellas(nuevosIds.length, total)
  };
}

// Game over: se pierde TODO el juego del tema, incluso si ya tenía 2
// estrellas. No toca "estrellasTemas".
export function borrarEstrellasJuego(curso, tema) {
  try {
    localStorage.removeItem(clave(curso, tema));
  } catch {
    // nada que hacer
  }
}

// ---------------------------------------------------------------------------
// Estrellas del EXAMEN del tema ("Omitir" / "Ir al examen").
// Clave aparte de la del videojuego: el game over NO las borra (el examen
// no tiene vidas). Se guarda la mejor marca y el último intento:
//   estrellasExamen_<curso>_<tema> = {
//     mejor:  { estrellas, correctas, total },
//     ultimo: { estrellas, correctas, total }
//   }
// ---------------------------------------------------------------------------

const PREFIJO_EXAMEN = "estrellasExamen_";

function claveExamen(curso, tema) {
  return `${PREFIJO_EXAMEN}${curso}_${tema}`;
}

export function leerEstrellasExamen(curso, tema) {
  try {
    const obj = JSON.parse(localStorage.getItem(claveExamen(curso, tema)) || "null");
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

// Guarda el resultado de un examen recién entregado y devuelve
// { mejor, ultimo }. La "mejor" se reemplaza solo si el nuevo intento
// tiene más estrellas, o las mismas pero mayor porcentaje de aciertos.
export function guardarEstrellasExamen(curso, tema, correctas, total) {
  const ultimo = {
    estrellas: calcularEstrellas(correctas, total),
    correctas,
    total
  };
  const previo = leerEstrellasExamen(curso, tema);
  const mejorPrevio = previo?.mejor;
  const porcentaje = (r) => (r && r.total > 0 ? r.correctas / r.total : 0);
  const nuevoEsMejor =
    !mejorPrevio ||
    ultimo.estrellas > mejorPrevio.estrellas ||
    (ultimo.estrellas === mejorPrevio.estrellas &&
      porcentaje(ultimo) > porcentaje(mejorPrevio));
  const registro = { mejor: nuevoEsMejor ? ultimo : mejorPrevio, ultimo };
  try {
    localStorage.setItem(claveExamen(curso, tema), JSON.stringify(registro));
  } catch {
    // Si el almacenamiento falla, el examen sigue funcionando.
  }
  return registro;
}