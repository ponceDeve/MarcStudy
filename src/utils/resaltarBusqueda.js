import { regexInsensible } from "../lib/buscador";

// Resalta temporalmente el resultado de una búsqueda directamente sobre
// el contenido YA renderizado en la página (no es un componente React:
// se manipula el DOM real después del render, y se deshace solo). Dos
// casos:
//
// - Si se sabe exactamente qué palabra/frase coincidió (matchText), se
//   envuelve solo esa parte del texto en un <mark> temporal, fijo por
//   DURACION_PALABRA_MS.
// - Si no hay ninguna coincidencia literal (match puramente semántico,
//   la búsqueda encontró el punto por significado, no por palabras), no
//   hay nada puntual para subrayar: se pone una capa oscura semitransparente
//   sobre todo el campo (texto o explicación) donde se encontró, por
//   DURACION_FLASH_MS, para ubicar igual al usuario.

const DURACION_PALABRA_MS = 5000;
const DURACION_FLASH_MS = 2000;

export function resaltarPalabraTemporal(contenedor, matchText, duracionMs = DURACION_PALABRA_MS) {
  if (!contenedor || !matchText) return false;

  const regex = regexInsensible(matchText);
  if (!regex) return false;

  const walker = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT);
  let nodo;

  while ((nodo = walker.nextNode())) {
    const match = nodo.data.match(regex);
    if (!match) continue;

    const inicio = match.index;
    const fin = inicio + match[0].length;

    const rango = document.createRange();
    rango.setStart(nodo, inicio);
    rango.setEnd(nodo, fin);

    const marca = document.createElement("mark");
    marca.className = "teoria-busqueda-resaltado";

    try {
      rango.surroundContents(marca);
    } catch {
      // El rango cruza el borde de otro elemento (ej. un término del
      // glosario o una fórmula) y no se puede envolver así de simple.
      // Mejor no resaltar nada a romper el HTML.
      return false;
    }

    // Se queda fijo, a color completo, durante toda la duración; recién
    // al final se quita de una (sin fundido a medio camino).
    setTimeout(() => deshacerResaltado(marca), duracionMs);

    return true;
  }

  return false;
}

function deshacerResaltado(marca) {
  const padre = marca.parentNode;
  if (!padre) return;
  while (marca.firstChild) padre.insertBefore(marca.firstChild, marca);
  padre.removeChild(marca);
  padre.normalize();
}

// Pone una capa oscura semitransparente (rgba(0,0,0,0.1)) cubriendo todo
// el contenedor, vía un div absoluto (inset: 0) superpuesto — no anima
// el background del contenedor directo, para que cubra el campo entero
// sin importar su propio color de fondo. El contenedor necesita quedar
// con position relative mientras dura el flash, para que el overlay se
// ubique justo encima de él (se restaura como estaba después).
export function flashearFondoTemporal(contenedor, duracionMs = DURACION_FLASH_MS) {
  if (!contenedor) return;

  const posicionOriginal = contenedor.style.position;
  const necesitaRelative =
    getComputedStyle(contenedor).position === "static";

  if (necesitaRelative) {
    contenedor.style.position = "relative";
  }

  const overlay = document.createElement("div");
  overlay.className = "teoria-busqueda-overlay";
  contenedor.appendChilad(overlay);

  setTimeout(() => {
    overlay.remove();
    if (necesitaRelative) {
      contenedor.style.position = posicionOriginal;
    }
  }, duracionMs);
}