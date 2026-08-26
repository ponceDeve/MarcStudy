// Búsqueda semántica local con Transformers.js. Solo se usa para generar
// embeddings (vectores de significado) y compararlos por similitud —
// nunca genera texto, nunca manda nada a una API externa.
//
// El modelo se carga perezosamente (recién cuando se usa por primera vez,
// no al abrir la app) y se comparte entre todos los temas: una vez cargado
// no se vuelve a descargar mientras la pestaña siga abierta.

const MODELO = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

let extractorPromise = null;

function obtenerExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers").then(
      ({ pipeline }) => pipeline("feature-extraction", MODELO)
    );
  }
  return extractorPromise;
}

// Genera un embedding por cada texto de la lista, en un solo lote
// (más eficiente que llamar uno por uno). Devuelve un array de arrays
// de números, en el mismo orden que "textos".
export async function embeberTextos(textos) {
  if (!textos || textos.length === 0) return [];

  const extractor = await obtenerExtractor();
  const salida = await extractor(textos, {
    pooling: "mean",
    normalize: true,
  });

  return salida.tolist();
}

export async function embeberTexto(texto) {
  const [embedding] = await embeberTextos([texto]);
  return embedding || null;
}

// Como los embeddings ya vienen normalizados (normalize: true), el
// producto punto entre dos de ellos ES la similitud coseno (rango -1 a 1,
// en la práctica casi siempre entre 0 y 1 para textos relacionados).
export function similitudCoseno(a, b) {
  let suma = 0;
  for (let i = 0; i < a.length; i++) suma += a[i] * b[i];
  return suma;
}