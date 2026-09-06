import manifest from "../data/manifest.json";

// Respuestas "en vivo" sobre cursos y temas: cuántos hay, si existe tal
// curso/tema, en qué curso está tal tema. A propósito es simple y
// liviano (nada de embeddings ni Levenshtein): recorre una sola vez
// manifest.json, que ya está en memoria igual que en WelcomeSection.

function sinTildes(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escaparRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Coincidencia por PALABRA/FRASE completa (con límites de palabra), no
// por substring suelto. Necesario porque "tema" es substring literal
// de "sistema", "temperatura", etc. — un includes() normal confundía
// la palabra genérica "tema" con temas reales que la contienen.
function contieneComoPalabra(texto, buscado) {
  if (!buscado) return false;
  const patron = new RegExp(`\\b${escaparRegex(buscado)}\\b`);
  return patron.test(texto);
}

const CURSOS_CON_TEMAS = manifest.cursos.filter((c) => c.temas.length > 0);

function totalCursos() {
  return CURSOS_CON_TEMAS.length;
}

function totalTemas() {
  return CURSOS_CON_TEMAS.reduce((total, curso) => total + curso.temas.length, 0);
}

function buscarCursoMencionado(queryNorm) {
  return (
    CURSOS_CON_TEMAS.find((curso) => {
      const nombreNorm = sinTildes(curso.nombre);
      const codigoNorm = sinTildes(curso.codigo);
      return (
        contieneComoPalabra(queryNorm, nombreNorm) ||
        (codigoNorm.length >= 3 && queryNorm === codigoNorm)
      );
    }) || null
  );
}

function buscarTemaMencionado(queryNorm) {
  if (queryNorm.length < 3) return null;

  for (const curso of CURSOS_CON_TEMAS) {
    for (const tema of curso.temas) {
      const temaNorm = sinTildes(tema.tema);
      if (temaNorm.length < 3) continue;

      if (
        contieneComoPalabra(queryNorm, temaNorm) ||
        contieneComoPalabra(temaNorm, queryNorm)
      ) {
        return { tema, curso };
      }
    }
  }
  return null;
}

const PALABRAS_CANTIDAD = [
  "cuanto",
  "cuantos",
  "cuantas",
  "cantidad",
  "total",
  "numero de",
];

function pareceCantidad(queryNorm) {
  return PALABRAS_CANTIDAD.some((p) => queryNorm.includes(p));
}

// Devuelve un string con la respuesta ya armada, o null si la consulta
// no corresponde a nada de esto (y entonces se sigue con las preguntas
// frecuentes normales).
export function resolverPreguntaDinamica(queryNorm) {
  if (!queryNorm) return null;

  // 0) Escribió "curso(s)" o "tema(s)" a secas -> cantidad total
  // directa, sin necesidad de escribir "cuántos".
  if (queryNorm === "curso" || queryNorm === "cursos") {
    return `Mi Estudio tiene ${totalCursos()} cursos disponibles.`;
  }
  if (queryNorm === "tema" || queryNorm === "temas") {
    return `Mi Estudio tiene ${totalTemas()} temas en total.`;
  }

  // 1) Mencionó un tema puntual -> dónde está.
  const temaEncontrado = buscarTemaMencionado(queryNorm);
  if (temaEncontrado) {
    return `Sí, Mi Estudio tiene el tema "${temaEncontrado.tema.tema}" en el curso de ${temaEncontrado.curso.nombre}.`;
  }

  // 2) Mencionó un curso puntual -> si existe y cuántos temas tiene.
  const cursoEncontrado = buscarCursoMencionado(queryNorm);
  if (cursoEncontrado) {
    const cantidad = cursoEncontrado.temas.length;
    return `Sí, Mi Estudio tiene el curso de ${cursoEncontrado.nombre}, con ${cantidad} tema${cantidad !== 1 ? "s" : ""}.`;
  }

  // 3) Cantidad general (sin mencionar un curso/tema puntual).
  if (queryNorm.includes("curso") && pareceCantidad(queryNorm)) {
    return `Mi Estudio tiene ${totalCursos()} cursos disponibles.`;
  }

  if (queryNorm.includes("tema") && pareceCantidad(queryNorm)) {
    return `Mi Estudio tiene ${totalTemas()} temas en total.`;
  }

  return null;
}
