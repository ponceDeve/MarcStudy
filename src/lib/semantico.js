// Búsqueda semántica local con Transformers.js. Solo se usa para generar
// embeddings (vectores de significado) y compararlos por similitud —
// nunca genera texto, nunca manda nada a una API externa.
//
// El modelo pesado corre en un Web Worker (embeddingsWorker.js), un hilo
// aparte del que dibuja la pantalla, para que calcular embeddings no
// trabe la interfaz (esto se notaba, por ejemplo, como letras que no
// aparecían al escribir mientras el modelo trabajaba). Este archivo solo
// expone funciones normales (con Promise) y maneja la comunicación con
// el worker por debajo, así el resto del código no necesita saber que
// existe un worker.

let worker = null;
let siguienteId = 1;
const pendientes = new Map();

function obtenerWorker() {
  if (!worker) {
    worker = new Worker(
      new URL("./embeddingsWorker.js", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (evento) => {
      const { id, embeddings, error } = evento.data;
      const pendiente = pendientes.get(id);
      if (!pendiente) return;

      pendientes.delete(id);

      if (error) pendiente.reject(new Error(error));
      else pendiente.resolve(embeddings);
    };

    worker.onerror = (evento) => {
      // Error a nivel del propio worker (no de un mensaje puntual):
      // se rechazan todas las peticiones pendientes para no dejarlas
      // colgadas esperando una respuesta que nunca va a llegar.
      pendientes.forEach((p) => p.reject(new Error("Error en el worker de embeddings")));
      pendientes.clear();
      evento.preventDefault?.();
    };
  }

  return worker;
}

// Genera un embedding por cada texto de la lista, en un solo lote
// (más eficiente que llamar uno por uno). Devuelve un array de arrays
// de números, en el mismo orden que "textos".
export function embeberTextos(textos) {
  if (!textos || textos.length === 0) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    const id = siguienteId++;
    pendientes.set(id, { resolve, reject });
    obtenerWorker().postMessage({ id, textos });
  });
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