import { shuffle } from "./shuffle";
// Misma lógica que usan QuestionCard.jsx y TemaExamenView.jsx.
export function generarCombinacionesVF(cantidad) {
  const total = 2 ** cantidad;
  const combinaciones = [];
  for (let numero = 0; numero < total; numero++) {
    const combinacion = [];
    for (let i = cantidad - 1; i >= 0; i--) {
      combinacion.push(Boolean((numero >> i) & 1));
    }
    combinaciones.push(combinacion);
  }
  return combinaciones;
}
function distanciaHamming(a, b) {
  let distancia = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distancia++;
  }
  return distancia;
}
export function claveCombinacion(combinacion) {
  return (combinacion || []).map((v) => (v ? "V" : "F")).join("");
}
export function formatearCombinacionVF(combinacion) {
  return combinacion.map((v) => (v ? "V" : "F")).join("  ");
}
export function combinacionCorrectaVF(proposiciones) {
  return (proposiciones || []).map((prop) => prop.correct === true);
}
export function generarAlternativasVF(proposiciones) {
  const cantidad = (proposiciones || []).length;
  if (cantidad === 0) return [];
  const correcta = combinacionCorrectaVF(proposiciones);
  const otras = generarCombinacionesVF(cantidad).filter(
    (c) => claveCombinacion(c) !== claveCombinacion(correcta)
  );
  const porDistancia = new Map();
  otras.forEach((c) => {
    const d = distanciaHamming(correcta, c);
    if (!porDistancia.has(d)) porDistancia.set(d, []);
    porDistancia.get(d).push(c);
  });
  const alternativas = [correcta];
  const distancias = [...porDistancia.keys()].sort((a, b) => a - b);
  for (const d of distancias) {
    if (alternativas.length >= 5) break;
    for (const c of shuffle(porDistancia.get(d))) {
      if (alternativas.length >= 5) break;
      alternativas.push(c);
    }
  }
  return shuffle(alternativas);
}
// Respuesta completa = todas las proposiciones marcadas (V o F).
export function respuestaVFCompleta(proposiciones, marcas) {
  return (
    (proposiciones || []).length > 0 &&
    Array.isArray(marcas) &&
    proposiciones.every((_, i) => marcas[i] === true || marcas[i] === false)
  );
}