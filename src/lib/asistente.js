// ─────────────────────────────────────────────────────────────────────────
// Lógica del asistente de ayuda global de Mi Estudio.
//
// Reutiliza exactamente el mismo enfoque híbrido que ya usa
// TheorySearchBar.jsx: coincidencia de texto (buscador.js) + búsqueda por
// significado con embeddings locales (semantico.js), sin mandar nada a
// ningún servidor. No hay generación de texto: el asistente solo elige,
// de una base de conocimiento cerrada (asistenteConocimiento.json), la
// entrada que mejor responde lo que preguntó el usuario. Así nunca
// "inventa" funciones que la app no tiene.
//
// ── Cómo ampliar la base de conocimiento ───────────────────────────────
// Cada entrada de src/data/asistenteConocimiento.json tiene esta forma:
//   {
//     "id": "identificador-unico",
//     "categoria": "Texto agrupador (se usa como sugerencia de tema)",
//     "pregunta": "Pregunta principal, tal como la haría el usuario",
//     "variantes": ["otras formas de preguntar lo mismo", "..."],
//     "respuesta": "Texto de la respuesta, basado en la app real",
//     "icono": "fa-solid fa-xxx"   (opcional, ícono principal a mostrar)
//     "iconos": [{ "icon": "fa-solid fa-xxx", "label": "..." }, ...]
//                                  (opcional, fila de íconos relacionados)
//   }
// Para agregar una función nueva de la app, basta con agregar una entrada
// nueva a ese arreglo: no hace falta tocar este archivo.
// ─────────────────────────────────────────────────────────────────────────

import baseConocimiento from "../data/asistenteConocimiento.json";
import { puntajeDeTexto } from "./buscador";
import { embeberTextos, embeberTexto, similitudCoseno } from "./semantico";

// Por debajo de este puntaje final, se considera que no hubo una
// coincidencia confiable y se responde con el mensaje de "no encontrado".
const PUNTAJE_MINIMO = 150;

// Igual que en TheorySearchBar: la similitud semántica (0 a 1) se
// reescala a la misma magnitud que los puntajes de texto para poder
// compararlas directamente y quedarnos con la mejor de las dos.
const UMBRAL_SIMILITUD = 0.42;
const PESO_SEMANTICO = 700;

let cacheEmbeddings = null;

// Arma, para cada entrada de la base, el texto que se va a "embeber":
// la pregunta principal + sus variantes. Se ignora la respuesta a
// propósito, para que el match dependa de cómo se pregunta, no de
// palabras sueltas que aparezcan en la explicación.
function textoParaEmbeder(entrada) {
  return [entrada.pregunta, ...(entrada.variantes || [])].join(". ");
}

function obtenerEmbeddingsBase() {
  if (!cacheEmbeddings) {
    cacheEmbeddings = embeberTextos(
      baseConocimiento.map(textoParaEmbeder)
    );
  }
  return cacheEmbeddings;
}

// Empieza a cargar el modelo y a calcular los embeddings de la base en
// segundo plano, sin bloquear nada. Pensado para llamarse apenas el
// usuario abre el chat por primera vez, así el modelo ya está listo (o
// casi) cuando escribe su primera pregunta.
export function precargarConocimientoAsistente() {
  obtenerEmbeddingsBase().catch(() => {
    // Si falla (sin internet la primera vez, etc.), el asistente sigue
    // funcionando solo con coincidencia de texto.
  });
}

function mejorPuntajeDeTexto(entrada, query) {
  const candidatos = [entrada.pregunta, ...(entrada.variantes || [])];
  return candidatos.reduce(
    (mejor, candidato) => Math.max(mejor, puntajeDeTexto(candidato, query)),
    0
  );
}

// Busca, en la base de conocimiento, la entrada que mejor responde
// "pregunta". Devuelve la entrada completa (con su respuesta e íconos)
// o null si no hay ninguna coincidencia confiable.
export async function responderPreguntaAsistente(pregunta) {
  const query = String(pregunta || "").trim();
  if (!query) return null;

  const puntajesTexto = baseConocimiento.map((entrada) =>
    mejorPuntajeDeTexto(entrada, query)
  );

  let puntajesSemanticos = baseConocimiento.map(() => 0);

  try {
    const [vectoresBase, vectorQuery] = await Promise.all([
      obtenerEmbeddingsBase(),
      embeberTexto(query),
    ]);

    if (vectorQuery) {
      puntajesSemanticos = vectoresBase.map((vector) =>
        vector ? similitudCoseno(vectorQuery, vector) : 0
      );
    }
  } catch {
    // Sin modelo disponible: seguimos solo con el puntaje de texto.
  }

  let mejorIndice = -1;
  let mejorPuntaje = 0;

  baseConocimiento.forEach((_, i) => {
    const semantico =
      puntajesSemanticos[i] >= UMBRAL_SIMILITUD
        ? puntajesSemanticos[i] * PESO_SEMANTICO
        : 0;

    const final = Math.max(puntajesTexto[i], semantico);

    if (final > mejorPuntaje) {
      mejorPuntaje = final;
      mejorIndice = i;
    }
  });

  if (mejorIndice === -1 || mejorPuntaje < PUNTAJE_MINIMO) {
    return null;
  }

  return baseConocimiento[mejorIndice];
}

// Un puñado de preguntas de ejemplo (una por categoría, en orden de
// aparición en la base) para mostrar como sugerencias iniciales o
// cuando el asistente no encuentra una respuesta.
export function sugerenciasIniciales(cantidad = 4) {
  const vistas = new Set();
  const sugerencias = [];

  for (const entrada of baseConocimiento) {
    if (vistas.has(entrada.categoria)) continue;
    vistas.add(entrada.categoria);
    sugerencias.push(entrada.pregunta);
    if (sugerencias.length >= cantidad) break;
  }

  return sugerencias;
}

export function categoriasDisponibles() {
  return [...new Set(baseConocimiento.map((e) => e.categoria))];
}
