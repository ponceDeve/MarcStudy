// Símbolos de notación fijos que el prompt de teoría usa siempre con
// el mismo significado (ver "Símbolos permitidos y su significado" en
// los promt_teoria_*.txt). Antes se le pedía a la IA que los agregara
// al "glosario" del JSON para que salieran resaltados; ahora el
// glosario es solo para vocabulario real y estos símbolos se detectan
// y colorean acá, en el código, sin depender de lo que devuelva la IA.
//
// "significado" se usa para el tooltip (igual que antes) y para que
// el lector de voz diga la palabra en vez de intentar leer el símbolo.
export const SIMBOLOS_NOTACION = {
  "=": "igual",
  "→": "produce",
  "⊃": "contiene",
  "∈": "pertenece",
  "⇒": "causa",
  "✓": "requiere",
  "✗": "carece",
  "+": "más",
  "↑": "aumenta",
  "↓": "disminuye",
  "≠": "diferente",
  "≈": "similar",

  "⇔": "equivale",
  "↔": "se relaciona con",
  "∴": "por tanto",
  "∵": "porque",
  "⊂": "forma parte de",
  "∉": "no pertenece",
  "≤": "menor o igual",
  "≥": "mayor o igual",
  "−": "menos",
  "±": "más o menos",
  "×": "multiplica",
  "÷": "divide",
  "→": "produce",
  "⇒": "implica",
  "∣": "tal que",
  "∧": "y",
  "∨": "o"
};

// Ordenados de más largo a más corto (por si en el futuro se agrega
// algún símbolo de más de un carácter) para que el regex no corte mal.
const CLAVES_ORDENADAS = Object.keys(SIMBOLOS_NOTACION).sort(
  (a, b) => b.length - a.length
);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const SIMBOLOS_NOTACION_REGEX = new RegExp(
  `(${CLAVES_ORDENADAS.map(escapeRegExp).join("|")})`,
  "g"
);

export function esSimboloDeNotacion(caracter) {
  return Object.prototype.hasOwnProperty.call(
    SIMBOLOS_NOTACION,
    caracter
  );
}

// Reemplaza cada símbolo por su palabra, para que el lector de voz
// diga "define" en vez de leer "=" (o quedarse callado/raro en ese
// punto). Se usa antes de mandarle el texto a SpeechSynthesisUtterance.
export function reemplazarSimbolosParaVoz(texto) {
  if (!texto) return texto;

  return texto.replace(
    SIMBOLOS_NOTACION_REGEX,
    (match) => ` ${SIMBOLOS_NOTACION[match]} `
  );
}
