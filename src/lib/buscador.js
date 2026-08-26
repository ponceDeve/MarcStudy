// Búsqueda compartida por SearchModal.jsx, TopicsModal.jsx, LevelsModal.jsx
// y el buscador inicial de MiEstudioPage.jsx. Antes cada uno hacía su
// propio `.toLowerCase().includes(q)`, lo que exigía escribir tildes
// exactas y coincidencia exacta y seguida. Esto centraliza:
//   1) normalizar (sin tildes, minúsculas).
//   2) un puntaje de qué tan bueno es cada match, para ordenar de
//      mejor a peor en vez de solo filtrar sí/no — incluye
//      coincidencia por subsecuencia (ej. "flo" encuentra "Filosofía":
//      la f, la l y la o aparecen en ese orden, aunque no sea un
//      pedazo seguido de texto) y tolerancia a errores de tipeo.

export function normalizarTexto(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes/diéresis
    .toLowerCase()
    .trim();
}

// Busca "query" como subsecuencia de "texto": cada letra de query debe
// aparecer en texto en ese mismo orden, pero no necesita ser seguida
// (ej. "flo" -> "filosofia": f(0) l(2) o(3), no contiguo, igual matchea).
// Da más puntaje mientras más letras seguidas encuentra de corrido.
function puntajeSubsecuencia(texto, query) {
  let posTexto = 0;
  let score = 0;
  let seguidas = 0;

  for (let i = 0; i < query.length; i++) {
    const idx = texto.indexOf(query[i], posTexto);
    if (idx === -1) return 0; // falta una letra: no es subsecuencia válida

    if (idx === posTexto) {
      seguidas++;
      score += 2 + seguidas; // bonus creciente por letras seguidas
    } else {
      seguidas = 0;
      score += 1;
    }
    posTexto = idx + 1;
  }

  // Bonus si empieza justo al inicio del texto (más relevante).
  if (texto.indexOf(query[0]) === 0) score += 3;

  return score;
}

// Puntaje de qué tan bien "texto" coincide con "query" ya normalizados.
// 0 = no coincide. Mientras más alto, mejor el match.
function puntajeMatch(textoNorm, queryNorm) {
  if (!queryNorm) return 0;
  if (textoNorm === queryNorm) return 1000;
  if (textoNorm.startsWith(queryNorm)) return 900;

  if (textoNorm.includes(queryNorm)) {
    const idx = textoNorm.indexOf(queryNorm);
    // Si la coincidencia empieza justo al inicio de una palabra
    // (después de un espacio, o al inicio del texto) vale más que si
    // aparece enterrada a mitad de otra palabra/frase — y mientras
    // antes aparezca en el texto, mejor.
    const inicioDePalabra = idx === 0 || /\s/.test(textoNorm[idx - 1]);
    const base = inicioDePalabra ? 750 : 550;
    const penalizacion = Math.min(idx, 300) * 0.5;
    return base - penalizacion;
  }

  // Varias palabras: basta con que todas aparezcan (en cualquier
  // orden) — ej. "civica organizaciones" encuentra
  // "Organizaciones Políticas y Práctica de la Democracia" si el
  // texto completo incluye ambas palabras.
  const palabras = queryNorm.split(/\s+/).filter(Boolean);
  if (palabras.length > 1 && palabras.every((p) => textoNorm.includes(p))) {
    return 400;
  }

  // Typos cortos: 1-2 letras de diferencia contra el propio texto.
  if (queryNorm.length >= 4) {
    const distancia = distanciaEdicionAcotada(textoNorm, queryNorm, 2);
    if (distancia !== null) return 300 - distancia * 10;
  }

  // Última red: coincidencia por subsecuencia, para búsquedas cortas
  // o incompletas como "flo" -> "Filosofía".
  return puntajeSubsecuencia(textoNorm, queryNorm);
}

// Levenshtein acotado: no calcula la distancia exacta si ya se pasó
// del máximo permitido, para no gastar tiempo de más.
function distanciaEdicionAcotada(texto, query, maximo) {
  let mejor = Infinity;
  const largoQ = query.length;
  for (let inicio = 0; inicio <= Math.max(0, texto.length - largoQ); inicio++) {
    const trozo = texto.slice(inicio, inicio + largoQ + maximo);
    const d = levenshtein(trozo.slice(0, largoQ + maximo), query, maximo);
    if (d < mejor) mejor = d;
    if (mejor === 0) break;
  }
  return mejor <= maximo ? mejor : null;
}

function levenshtein(a, b, maximo) {
  const filaAnterior = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) filaAnterior[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let anteriorDiag = filaAnterior[0];
    filaAnterior[0] = i;
    let filaMin = filaAnterior[0];
    for (let j = 1; j <= b.length; j++) {
      const temp = filaAnterior[j];
      filaAnterior[j] =
        a[i - 1] === b[j - 1]
          ? anteriorDiag
          : 1 + Math.min(anteriorDiag, filaAnterior[j], filaAnterior[j - 1]);
      anteriorDiag = temp;
      filaMin = Math.min(filaMin, filaAnterior[j]);
    }
    if (filaMin > maximo) return maximo + 1; // corta temprano, ya no sirve
  }
  return filaAnterior[b.length];
}

// Busca "query" contra una lista de items, usando getTexto(item) para
// saber qué texto de cada item comparar. Devuelve solo los que tienen
// algún puntaje > 0, ordenados de mejor a peor match.
//
// minScore (opcional): sube el piso de puntaje aceptado. Los buscadores
// globales (inicio y lupa) lo usan en 400 para descartar los matches
// "débiles" (typos y letras sueltas fuera de orden/seguidas) — esos
// solo tienen sentido cuando el universo de búsqueda es chico (un
// tema ya abierto); contra los ~300 cursos+temas juntos, generan
// ruido (ej. "incas" encontrando temas que ni empiezan así).
export function buscarConPuntaje(items, query, getTexto, { minScore = 0 } = {}) {
  const queryNorm = normalizarTexto(query);
  if (!queryNorm) return [];

  return items
    .map((item) => ({ item, score: puntajeMatch(normalizarTexto(getTexto(item)), queryNorm) }))
    .filter((r) => r.score > 0 && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

// Igual que buscarConPuntaje pero devuelve también el puntaje, para
// combinarlo con otros puntajes (ej. similitud semántica) antes de
// ordenar. No reemplaza a buscarConPuntaje, se usa donde hace falta
// el número además del item.
export function puntajeDeTexto(texto, query) {
  return puntajeMatch(normalizarTexto(texto), normalizarTexto(query));
}

/* ============================================================
   FRAGMENTOS (SNIPPETS)
   ============================================================
   Para textos largos (ej. una explicación de varias líneas), en vez
   de mostrarla completa en un resultado de búsqueda, se recorta un
   pedazo corto alrededor de dónde está la coincidencia — igual que
   hacen los buscadores comunes. */

// Escapa caracteres especiales de regex.
function escaparRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Variantes de vocales/ñ con o sin tilde, para poder buscar directo
// sobre el texto ORIGINAL (con tildes) sin desalinear posiciones como
// pasaría si buscáramos sobre una versión normalizada y aplicáramos
// el índice al texto con tildes.
const VARIANTES_ACENTO = {
  a: "[aàáâãä]",
  e: "[eèéêë]",
  i: "[iìíîï]",
  o: "[oòóôõö]",
  u: "[uùúûü]",
  n: "[nñ]",
};

function regexInsensible(fragmento) {
  const escapado = escaparRegex(fragmento);
  const patron = escapado.replace(/[aeioun]/gi, (c) => {
    const base = c.toLowerCase();
    return VARIANTES_ACENTO[base] || c;
  });
  try {
    return new RegExp(patron, "i");
  } catch {
    return null;
  }
}

// Busca dónde empieza la mejor coincidencia visual de "query" dentro de
// "texto" (texto SIN normalizar, tal cual se va a mostrar). Devuelve el
// índice de caracter, o null si no hay ninguna coincidencia literal
// (esto pasa seguido con resultados puramente semánticos, donde el
// texto no comparte palabras con la búsqueda).
export function buscarPosicion(texto, query) {
  const queryLimpia = String(query || "").trim();
  if (!queryLimpia || !texto) return null;

  const regexCompleta = regexInsensible(queryLimpia);
  if (regexCompleta) {
    const idx = texto.search(regexCompleta);
    if (idx !== -1) return idx;
  }

  // No apareció la frase completa: probar palabra por palabra (evita
  // recortes desde el inicio cuando en realidad sí hay una palabra
  // clave presente en otro lugar del texto).
  const palabras = queryLimpia.split(/\s+/).filter((p) => p.length >= 3);
  for (const palabra of palabras) {
    const regexPalabra = regexInsensible(palabra);
    if (!regexPalabra) continue;
    const idx = texto.search(regexPalabra);
    if (idx !== -1) return idx;
  }

  return null;
}

// Recorta "texto" a un fragmento corto centrado en "indiceCaracter".
// Si indiceCaracter es null (no hubo coincidencia literal, típico en
// matches semánticos), recorta desde el inicio. Pone "..." solo del
// lado donde de verdad se cortó texto.
export function extraerFragmento(texto, indiceCaracter, { palabrasAntes = 4, palabrasDespues = 6 } = {}) {
  const textoLimpio = String(texto || "").trim();
  if (!textoLimpio) return "";

  if (indiceCaracter == null || indiceCaracter < 0) {
    const palabras = textoLimpio.split(/\s+/);
    const tomadas = palabras.slice(0, palabrasAntes + palabrasDespues);
    const huboCorte = tomadas.length < palabras.length;
    return huboCorte ? `${tomadas.join(" ")}...` : tomadas.join(" ");
  }

  const antes = textoLimpio.slice(0, indiceCaracter);
  const despues = textoLimpio.slice(indiceCaracter);

  const palabrasAntesArr = antes.trim().split(/\s+/).filter(Boolean);
  const palabrasDespuesArr = despues.trim().split(/\s+/).filter(Boolean);

  const tomarAntes = palabrasAntesArr.slice(-palabrasAntes);
  const tomarDespues = palabrasDespuesArr.slice(0, palabrasDespues);

  const huboCorteAntes = palabrasAntesArr.length > tomarAntes.length;
  const huboCorteDespues = palabrasDespuesArr.length > tomarDespues.length;

  const fragmento = [...tomarAntes, ...tomarDespues].join(" ");

  return `${huboCorteAntes ? "..." : ""}${fragmento}${huboCorteDespues ? "..." : ""}`;
}