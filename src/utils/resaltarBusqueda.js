import { regexInsensible } from "../lib/buscador";

// Resalta temporalmente el resultado de una búsqueda directamente sobre
// el contenido YA renderizado en la página (no es un componente React:
// se manipula el DOM real después del render, y se deshace solo). Dos
// casos:
//
// - Si se sabe exactamente qué palabra/frase coincidió (matchText), se
//   envuelve solo esa parte del texto en un <mark> temporal.
// - Si no hay ninguna coincidencia literal (match puramente semántico,
//   la búsqueda encontró el punto por significado, no por palabras),
//   no hay nada puntual para subrayar: se destella el fondo de todo el
//   campo (texto o explicación) donde se encontró, para ubicar igual
//   al usuario.

const DURACION_MS = 2000;

export function resaltarPalabraTemporal(contenedor, matchText, duracionMs = DURACION_MS) {
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

    setTimeout(() => {
      marca.classList.add("is-fading");
      setTimeout(() => deshacerResaltado(marca), 400);
    }, duracionMs);

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

export function flashearFondoTemporal(contenedor, duracionMs = DURACION_MS) {
  if (!contenedor) return;
  contenedor.classList.add("teoria-busqueda-flash");
  setTimeout(() => contenedor.classList.remove("teoria-busqueda-flash"), duracionMs);
}