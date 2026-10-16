// Búsqueda de nombres (cursos o temas) para el buscador de la lupa.
// Primero devuelve coincidencias literales (sin tildes, sin distinguir
// mayúsculas) y después, si el modelo semántico está disponible, agrega
// las que tienen un significado parecido.
import { normalizarTexto, buscarTypo } from "./buscador";
import { embeberTextos, similitudCoseno } from "./semantico";

const UMBRAL_SEMANTICO = 0.48;
const UMBRAL_RELATIVO = 0.9;
const cacheVectores = new Map();

// Coincidencia de cursos y temas por palabras, para cualquier nombre:
// - Cada palabra de la búsqueda debe encontrar una palabra del nombre:
//   por inicio, dentro de la palabra, contenida o con errores de tipeo.
// - Coincidencia exacta del inicio del nombre vale más que una parcial.
// Sincrónica: se puede mostrar al instante.
export function filtrarLiteral(items, query, nombreDe) {
  const tokens = normalizarTexto(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const q = tokens.join(" ");
  const datos = items.map((item) => {
    const original = nombreDe(item);
    const n = normalizarTexto(original);
    return { item, original, n, palabras: n.split(/\s+/).filter(Boolean) };
  });
  // Estado por elemento y por palabra: "exacta", "typo" o null.
  const estado = datos.map((d) =>
    tokens.map((token) => {
      const exacta = d.palabras.some(
        (w) =>
          w.startsWith(token) ||
          w.includes(token) ||
          (w.length >= 4 && token.includes(w))
      );
      if (exacta) return "exacta";
      if (buscarTypo(d.original, token)) return "typo";
      return null;
    })
  );
  return datos
    .map((d, i) => {
      const e = estado[i];
      if (e.some((x) => x === null)) return { item: d.item, puntaje: 0 };
      let puntaje;
      if (d.n.startsWith(q)) puntaje = 3;
      else if (d.n.includes(q)) puntaje = 2;
      else if (e.every((x) => x === "exacta")) puntaje = 1;
      else puntaje = 0.5;
      return { item: d.item, puntaje };
    })
    .filter((x) => x.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .map((x) => x.item);
}

// Similitud por trigramas (Dice), solo para sugerencias.
function trigramasSugerencia(palabra) {
  const p = `  ${palabra} `;
  const set = new Set();
  for (let i = 0; i < p.length - 2; i++) set.add(p.slice(i, i + 3));
  return set;
}
function similitudSugerencia(a, b) {
  const A = trigramasSugerencia(a);
  const B = trigramasSugerencia(b);
  let comunes = 0;
  for (const t of A) if (B.has(t)) comunes++;
  return (2 * comunes) / (A.size + B.size);
}
// Cuando no hay coincidencias, devuelve el nombre más parecido a lo escrito,
// solo si se parece lo suficiente. No es un resultado: se muestra como
// "¿Quisiste decir…?" y el usuario decide si lo toca.
export function sugerirParecido(items, query, nombreDe) {
  const q = normalizarTexto(query).replace(/\s+/g, " ").trim();
  if (q.length < 4) return null;
  let mejor = null;
  let mejorPuntaje = 0.45;
  for (const item of items) {
    const palabras = normalizarTexto(nombreDe(item)).split(/\s+/).filter(Boolean);
    for (const w of palabras) {
      if (w.length < 5) continue;
      const puntaje = similitudSugerencia(q, w);
      if (puntaje >= mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejor = item;
      }
    }
  }
  return mejor;
}

// Asíncrona: agrega después de "yaIncluidos" los nombres parecidos por
// significado. Si el modelo falla, devuelve solo "yaIncluidos".
export async function agregarSemanticos(items, query, nombreDe, yaIncluidos) {
  const q = query.trim();
  if (!q) return yaIncluidos;
  // Si ya hay coincidencias literales (ej. "quimica" -> Química), no se
  // agregan nombres "parecidos": traían cursos que no tenían nada que ver.
  if (yaIncluidos.length > 0) return yaIncluidos;
  try {
    const nombres = items.map(nombreDe);
    const pendientes = [...new Set([q, ...nombres])].filter(
      (texto) => !cacheVectores.has(texto)
    );
    if (pendientes.length > 0) {
      const vectores = await embeberTextos(pendientes);
      pendientes.forEach((texto, i) => cacheVectores.set(texto, vectores[i]));
    }
    const vq = cacheVectores.get(q);
    const yaSet = new Set(yaIncluidos);
    const candidatos = items
      .filter((item) => !yaSet.has(item))
      .map((item) => ({
        item,
        similitud: similitudCoseno(vq, cacheVectores.get(nombreDe(item)))
      }))
      .filter((x) => x.similitud >= UMBRAL_SEMANTICO)
      .sort((a, b) => b.similitud - a.similitud);
    // Solo los que se acercan al mejor resultado, para no mezclar
    // coincidencias fuertes con otras apenas parecidas.
    const mejor = candidatos.length ? candidatos[0].similitud : 0;
    const extra = candidatos
      .filter((x) => x.similitud >= mejor * UMBRAL_RELATIVO)
      .map((x) => x.item);
    return [...yaIncluidos, ...extra];
  } catch {
    return yaIncluidos;
  }
}