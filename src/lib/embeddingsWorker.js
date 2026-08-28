// Corre en un Web Worker aparte (hilo separado del que dibuja la
// pantalla), para que calcular los embeddings no trabe la interfaz ni
// coma las teclas mientras el usuario escribe. El modelo se carga
// perezosamente, recién con el primer mensaje que llega.

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

self.onmessage = async (evento) => {
  const { id, textos } = evento.data;

  try {
    if (!textos || textos.length === 0) {
      self.postMessage({ id, embeddings: [] });
      return;
    }

    const extractor = await obtenerExtractor();
    const salida = await extractor(textos, {
      pooling: "mean",
      normalize: true,
    });

    self.postMessage({ id, embeddings: salida.tolist() });
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) });
  }
};