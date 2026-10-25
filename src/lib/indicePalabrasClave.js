/*
 * Índice de palabras clave por tema.
 *
 * Lee src/data/palabrasClave.json, que tiene solo dos niveles:
 *   { "Curso": { "Tema": ["palabra clave", ...] } }
 * (sin semanas) y devuelve un Map: archivo del tema -> palabras clave.
 *
 * Se asocia por archivo (temas/fil/fil-01.json) y no por nombre exacto,
 * porque el manifest y el JSON de palabras clave suelen escribir el
 * mismo tema de forma distinta. Ejemplo:
 *   manifest: "Definición de filosofía, Origen de la filosofía y Actitud filosófica"
 *   claves:   "Definición de filosofía (Origen de la filosofía, Actitud filosófica)"
 */
const PALABRAS_VACIAS = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una",
  "y", "e", "o", "en", "al", "por", "para", "con", "que", "a"
]);

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(texto) {
  const palabras = normalizar(texto).match(/[a-z0-9]+/g) || [];
  return new Set(palabras.filter(p => !PALABRAS_VACIAS.has(p)));
}

function mismosTokens(a, b) {
  if (!a.size || a.size !== b.size) return false;
  for (const p of a) if (!b.has(p)) return false;
  return true;
}

function esSubconjunto(chico, grande) {
  for (const p of chico) if (!grande.has(p)) return false;
  return true;
}

function jaccard(a, b) {
  let comunes = 0;
  for (const p of a) if (b.has(p)) comunes++;
  const union = a.size + b.size - comunes;
  return union ? comunes / union : 0;
}

// "Comte y Marx" -> [{comte}, {marx}]
function partesDelTema(nombre) {
  return normalizar(nombre)
    .split(/\s*[,;]\s*|\s+y\s+/)
    .map(tokens)
    .filter(t => t.size > 0);
}

// "Kant (Fenómeno, Noúmeno)" -> título completo, título principal y subtemas
function analizarGrupo(titulo) {
  const m = String(titulo).match(/^(.*?)\s*\((.*)\)\s*$/);
  const principal = m ? m[1] : titulo;
  const subtemas = m
    ? m[2].split(/[,;]/).map(tokens).filter(t => t.size > 0)
    : [];
  return {
    completo: tokens(titulo),
    principal: tokens(principal),
    subtemas
  };
}

function coincide(tema, partes, grupo) {
  if (!tema.size) return false;
  if (mismosTokens(tema, grupo.completo)) return true;
  if (mismosTokens(tema, grupo.principal)) return true;
  const [chico, grande] = tema.size <= grupo.completo.size
    ? [tema, grupo.completo]
    : [grupo.completo, tema];
  if (chico.size >= 2 && esSubconjunto(chico, grande)) return true;
  if (jaccard(tema, grupo.completo) >= 0.6) return true;
  for (const parte of partes) {
    if (mismosTokens(parte, grupo.principal)) return true;
    if (grupo.subtemas.some(s => mismosTokens(parte, s))) return true;
  }
  return false;
}

export function construirIndicePalabrasClave(palabrasClave, cursos) {
  const indice = new Map();
  const cursosClave = new Map(
    Object.entries(palabrasClave).map(([nombre, temas]) => [
      normalizar(nombre),
      Object.entries(temas).map(([titulo, claves]) => ({
        claves: Array.isArray(claves) ? claves : [],
        grupo: analizarGrupo(titulo)
      }))
    ])
  );
  for (const curso of cursos) {
    const grupos = cursosClave.get(normalizar(curso.nombre));
    if (!grupos) continue;
    for (const tema of curso.temas) {
      const nombre = tema.tema;
      const objetivo = tokens(nombre);
      const partes = partesDelTema(nombre);
      const claves = new Set();
      for (const { claves: lista, grupo } of grupos) {
        if (coincide(objetivo, partes, grupo)) {
          for (const clave of lista) claves.add(clave);
        }
      }
      if (claves.size) indice.set(tema.archivo, [...claves]);
    }
  }
  return indice;
}
