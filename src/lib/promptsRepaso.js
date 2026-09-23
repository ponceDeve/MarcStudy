// ─────────────────────────────────────────────────────────────────────────
// Prompts de ChatGPT de la pestaña Temario de Repaso.
// Salida esperada: APUNTES PARA COPIAR EN EL CUADERNO (Markdown, sin JSON).
//
// Plantilla: rol → temario del curso (marca el tema actual) → investigación
// obligatoria con búsqueda web → límite con los demás temas del temario →
// autorrevisión antes de entregar → qué incluir / qué no incluir → brevedad
// → formato. Cada curso solo cambia su "arquetipo" (cómo se investiga y qué
// se incluye) y su "rasgo" (qué atributo distingue un tipo de otro en ese
// curso en particular).
// ─────────────────────────────────────────────────────────────────────────

import {
  teoriaLetras,
  teoriaMate,
  teoriaCiencia
} from "./promptsJsonTeoria";
import {
  examenLetras,
  examenMate,
  examenCiencia
} from "./promptsExamenTeoria";

const NOTA_FORMULAS =
  "Las fórmulas y operaciones se escriben en texto plano (x², √, ×, ÷, π), sin LaTeX; dentro de ellas se usan los símbolos matemáticos normales.";

// arquetipo: "practico" (tipos de problema/pregunta, sin procedimientos de
// resolución) | "historico" (hechos, causas, consecuencias) | "conceptual"
// (definición, tipos, atributos — el resto de los cursos).
export const PROMPTS_REPASO = {
  "Habilidad Lógico Matemático": {
    arquetipo: "practico",
    unidadSing: "tipo de problema",
    unidadPlur: "tipos de problema",
    rasgo: "atajos, propiedades o casos límite de ese tipo de problema",
    formulas: true
  },
  "Aritmética": {
    arquetipo: "practico",
    unidadSing: "tipo de problema",
    unidadPlur: "tipos de problema",
    rasgo:
      "las condiciones de validez de la propiedad (conjunto numérico, valores excluidos) y sus casos especiales",
    formulas: true
  },
  "Álgebra": {
    arquetipo: "practico",
    unidadSing: "tipo de problema",
    unidadPlur: "tipos de problema",
    rasgo: "las condiciones de existencia, restricciones y teoremas asociados",
    formulas: true
  },
  "Geometría": {
    arquetipo: "practico",
    unidadSing: "tipo de problema",
    unidadPlur: "tipos de problema",
    rasgo: "las condiciones del teorema y a qué tipo de figura se aplica",
    formulas: true
  },
  "Trigonometría": {
    arquetipo: "practico",
    unidadSing: "tipo de problema",
    unidadPlur: "tipos de problema",
    rasgo:
      "la condición de validez de la identidad y el cuadrante o rango donde aplica",
    formulas: true
  },
  "Habilidad Verbal": {
    arquetipo: "practico",
    unidadSing: "tipo de pregunta",
    unidadPlur: "tipos de pregunta",
    rasgo:
      "las palabras clave del enunciado y los tipos de alternativa incorrecta de esa habilidad",
    formulas: false
  },
  "Historia Universal": {
    arquetipo: "historico"
  },
  "Historia del Perú": {
    arquetipo: "historico"
  },
  "Biología": {
    arquetipo: "conceptual",
    rasgo:
      "qué molécula interviene y en qué dirección cambia, tipo de reacción, energía, enzimas, u otro rasgo que los exámenes usen para diferenciarlos",
    formulas: false,
    notaExtra:
      "Un subtema que NO tenga su propio número en el temario (por ejemplo taxia, tropismo, nastia o movimiento dentro de Irritabilidad) va DENTRO del subtema al que pertenece, nunca como un subtítulo aparte."
  },
  "Física": {
    arquetipo: "conceptual",
    rasgo:
      "si es escalar o vectorial, su fórmula con las unidades del Sistema Internacional, y sus condiciones de validez",
    formulas: true
  },
  "Química": {
    arquetipo: "conceptual",
    rasgo: "su fórmula, su nomenclatura, sus propiedades y el tipo de reacción en que participa",
    formulas: true
  },
  "Economía": {
    arquetipo: "conceptual",
    rasgo:
      "los agentes o variables que intervienen y, si tiene fórmula, sus unidades y cómo se interpreta",
    formulas: true
  },
  "Lenguaje": {
    arquetipo: "conceptual",
    rasgo: "su criterio de identificación, sus excepciones y un ejemplo propio de una línea",
    formulas: false
  },
  "Literatura": {
    arquetipo: "conceptual",
    rasgo: "autor u obra representativa, época y rasgo de estilo que lo distingue",
    formulas: false,
    notaExtra: "No copies fragmentos de obras ni versos: parafrasea siempre."
  },
  "Filosofía": {
    arquetipo: "conceptual",
    rasgo: "representante, época y la tesis central que lo distingue de corrientes vecinas",
    formulas: false
  },
  "Geografía": {
    arquetipo: "conceptual",
    rasgo: "su ubicación, su causa y, si es un dato numérico, su unidad",
    formulas: false
  },
  "Educación Cívica": {
    arquetipo: "conceptual",
    rasgo: "su función o atribución concreta y la norma que lo respalda",
    formulas: false
  },
  "Psicología": {
    arquetipo: "conceptual",
    rasgo: "el autor y su aporte, o los componentes y fases del proceso",
    formulas: false
  }
};

// Respaldo por si aparece un curso sin configuración propia.
const CONFIG_GENERICA = {
  arquetipo: "conceptual",
  rasgo: "los rasgos que distinguen un tipo de otro dentro de este curso",
  formulas: false
};

// ─────────────────────────────────────────────────────────────────────────
// Apuntes reales de pizarra (transcritos), solo como modelo de estilo y
// brevedad. Se citan aparte y se aclara que no hay que copiar su contenido.
// ─────────────────────────────────────────────────────────────────────────
const EJEMPLOS_APUNTE = {
  "Literatura": `# Alejo Carpentier
## Etapa
- Nueva narrativa hispanoamericana (consolidación)
## Características de su obra
- Preferencia por narrativa y ensayo
- Técnicas modernas
- Influencia del surrealismo (mundo onírico)
- Sincretismo cultural: amerindia + africana + europea
- Fusión: tradición + hechos históricos
- Teoriza lo real maravilloso
## El reino de este mundo
- Género: narrativo
- Especie: novela
- Narrador: omnisciente
- Narración: lineal-cronológica + episódica`,
  "Historia Universal": `# Imperio napoleónico (1804-1815)
## III Coalición
- Trafalgar → derrota franco-española
- Austerlitz → gran victoria («los tres emperadores»)
- Crea la Confederación del Rin
## IV Coalición
- Decreto de Berlín → bloqueo continental contra Inglaterra
- Tilsit → acuerdo con el zar Alejandro I (Rusia)`,
  "Biología": `# Histología vegetal
## Concepto
- Rama de la Botánica: estudia los tejidos de la planta
- Tejido: conjunto de células similares que cumplen funciones específicas
## Clases de tejidos
- Juveniles (embrionarios): células indiferenciadas, crecimiento constante
- Adultos: células diferenciadas`,
  "Física": `# Ondas mecánicas (O.M.)
## Concepto
- Propagación de perturbaciones
- Transportan energía y cantidad de movimiento, no materia
- Las partículas solo oscilan
- Necesitan un medio material
## Tipos
- O.M. longitudinal: vibración de partículas paralela a la propagación (el sonido)
- O.M. transversal: vibración de partículas perpendicular a la propagación (superficie libre de un líquido)`,
  "Química": `# Estequiometría
## Definición
- Rama de la Química: aspecto cuantitativo de todo proceso químico
- Relación de moles, masa y volumen
## Ley de conservación de la masa (Lavoisier)
- En toda reacción: Σ masa reactantes = Σ masa productos
- Ejemplo: O₂ + 2 H₂ → 2 H₂O (32 g + 4 g → 36 g)`
};

// ─────────────────────────────────────────────────────────────────────────
// Temario numerado, marcando el tema actual.
// temarioCurso viene como "Semana N: tema1 | tema2 | ...", una línea por
// semana, en el orden real del curso.
// ─────────────────────────────────────────────────────────────────────────
function temarioNumerado(temarioCurso, tema) {
  const temas = String(temarioCurso || "")
    .split("\n")
    .filter(Boolean)
    .flatMap((linea) => {
      const i = linea.indexOf(": ");
      const cuerpo = i === -1 ? linea : linea.slice(i + 2);
      return cuerpo.split(" | ").map((t) => t.trim()).filter(Boolean);
    });
  const total = temas.length;
  const lista = temas
    .map((t, n) => `${n + 1}. ${t}${t === tema ? "  ← TEMA A DESARROLLAR" : ""}`)
    .join("\n");
  return { total, lista };
}

function bloqueInvestigacion(c, u, up) {
  if (c.arquetipo === "practico") {
    return `INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${up}).
2. Para CADA ${u}, busca su regla o forma básica.
3. Para CADA ${u}, busca ${c.rasgo}, pero solo los que de verdad distinguen un ${u} de otro.
4. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué reglas usan realmente: si preguntan solo la forma básica, no agregues condiciones que nadie pregunta.
5. Busca los ${up} con los que este tema suele confundirse.
Contrasta cada dato importante en al menos dos fuentes. Si no puedes confirmarlo, no lo escribas.`;
  }
  if (c.arquetipo === "historico") {
    return `INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${up}: causas, etapas, consecuencias).
2. Para CADA ${u}, busca su dato básico: qué ocurrió, cuándo y dónde.
3. Para CADA ${u}, busca personajes con nombre completo, causas y consecuencias, pero solo los datos que de verdad distinguen ese hecho de otros.
4. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué fechas o nombres preguntan realmente: si preguntan solo el hecho básico, no agregues detalles que nadie pregunta.
5. Busca los hechos o procesos con los que este tema suele confundirse.
Contrasta cada fecha, nombre o cifra en al menos dos fuentes. Si los historiadores discrepan o no puedes confirmar el dato, indícalo como aproximado o no lo escribas.`;
  }
  return `INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${up} o características principales).
2. Para CADA ${u}, busca su definición básica y sus tipos o clasificaciones completas.
3. Para CADA tipo que encuentres, busca ${c.rasgo}, pero solo los que de verdad distinguen un tipo de otro.
4. Busca los casos, agentes, enfermedades, fenómenos o ejemplos concretos y aplicados de este tema con los que un examen suele evaluarlo. No te quedes solo en el esquema de clasificación abstracto: un tema con aplicaciones reales conocidas (una enfermedad representativa, un mecanismo con nombre propio, una vía o proceso concreto) debe cubrir esas aplicaciones, no solo la teoría general.
5. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué preguntan realmente: si preguntan solo la definición básica, no agregues atributos que nadie pregunta; si preguntan sobre un caso o agente concreto del paso 4, ese caso debe quedar cubierto en el apunte.
6. Busca los conceptos que suelen confundirse con este tema.
Contrasta cada dato importante en al menos dos fuentes. Si no puedes confirmarlo, no lo escribas.`;
}

function bloqueLimite(c, total) {
  const extra = c.notaExtra ? ` ${c.notaExtra}` : "";
  return `LÍMITE CON OTROS TEMAS DEL TEMARIO
El temario de abajo tiene un tema propio para cada cosa que ves numerada (${total} en total). Desarrolla ÚNICAMENTE el tema marcado con «← TEMA A DESARROLLAR». Si al investigarlo encuentras algo que en el temario tiene su propio número, nómbralo como máximo en una viñeta de conexión, sin desarrollarlo.${extra}`;
}

function bloqueAutorrevision(c, u, up) {
  let l1, l2, l3, l4;
  if (c.arquetipo === "historico") {
    l1 = `Verifica que CADA ${u} tenga primero su hecho básico en una viñeta simple, antes de causas, consecuencias o personajes.`;
    l2 = `Verifica que no haya más de dos niveles de viñeta en total (${u} → causa/consecuencia/personaje). Si un ${u} tiene varios datos, únelos en una sola viñeta, nunca en viñetas propias por dato.`;
    l3 = "Verifica que cada dato que incluiste de verdad distingue este hecho de otro.";
    l4 = `Verifica que no haya ${up} que en realidad sean parte de un proceso ya desarrollado.`;
  } else if (c.arquetipo === "practico") {
    l1 = `Verifica que CADA ${u} tenga primero su regla o forma básica en una viñeta simple, antes de cualquier condición o atajo.`;
    l2 = `Verifica que no haya más de dos niveles de viñeta en total (${u} → condición/atajo). Si un ${u} tiene varios rasgos, únelos en una sola viñeta, nunca en viñetas propias por rasgo.`;
    l3 = "Verifica que cada condición o atajo que incluiste de verdad distingue un tipo de otro.";
    l4 = `Verifica que no haya ${up} que en realidad sean variantes de otro ya desarrollado.`;
  } else {
    l1 = `Verifica que CADA ${u} tenga primero su definición básica en una viñeta simple, antes de cualquier tipo o atributo.`;
    l2 = `Verifica que no haya más de dos niveles de viñeta en total (${u} → tipo). Si un tipo tiene varios atributos, únelos en una sola viñeta de ese tipo, nunca en viñetas propias por atributo.`;
    l3 = "Verifica que cada atributo que incluiste de verdad distingue un tipo de otro.";
    l4 = `Verifica que no haya ${up} que en realidad sean formas de otro ${u} ya desarrollado.`;
  }
  return `ANTES DE ENTREGAR (autorrevisión obligatoria)
- ${l1}
- ${l2}
- ${l3}
- ${l4}
- Verifica que no hayas desarrollado a fondo ningún tema que en el temario tenga su propio número.
- Quita cualquier número de referencia, nota al pie o lista de fuentes que tu búsqueda haya generado. El apunte no lleva ninguna marca de dónde salió la información.`;
}

function bloqueIncluir(c, u, up) {
  let inc, exc;
  if (c.arquetipo === "historico") {
    inc = `El hecho básico de cada ${u} siempre (qué, cuándo, dónde). Causas, consecuencias y personajes con nombre completo solo cuando el ${u} los tenga y un examen pueda preguntarlos. Procesos vecinos que aparecen como distractores.`;
    exc = `Relatos narrativos extensos, curiosidades sin valor de examen, opiniones sobre los hechos, fechas que no puedas confirmar. No dupliques un ${u} como si fuera otro. No inventes un dato si no distingue nada. Ningún número de referencia ni lista de fuentes. Nada de otro tema del temario que tenga su propio número.`;
  } else if (c.arquetipo === "practico") {
    const upCap = up.charAt(0).toUpperCase() + up.slice(1);
    inc = `La regla o forma básica de cada ${u} siempre. Las condiciones de uso y atajos distintivos solo cuando el ${u} los tenga y un examen pueda preguntarlos. Casos límite y excepciones. ${upCap} vecinos que aparecen como distractores.`;
    exc = `Procedimientos de resolución paso a paso, ejemplos resueltos con alternativas, enunciados de problemas completos, etimología, historia o curiosidades. No dupliques un ${u} como si fuera otro. No inventes una condición si no distingue nada. Ningún número de referencia ni lista de fuentes. Nada de otro tema del temario que tenga su propio número.`;
  } else {
    inc = `La definición básica de cada ${u} siempre. Los tipos y sus atributos distintivos solo cuando el ${u} los tenga y un examen pueda preguntarlos. Estructura y función, etapas, excepciones. Casos, agentes o ejemplos concretos y aplicados cuando el tema tenga uno representativo conocido (una enfermedad, un mecanismo con nombre propio, un proceso real), no solo el esquema abstracto. Conceptos vecinos que aparecen como distractores.`;
    if (c.formulas) {
      inc += " Cuando el tema tenga fórmulas de cálculo, inclúyelas con sus variables y unidades.";
    }
    exc = `Etimología, historia, curiosidades, detalles universitarios que esas preguntas no piden, cómo resolver problemas ni ejemplos resueltos. No dupliques un ${u} como si fuera un tema aparte. No inventes un atributo si no distingue nada. Ningún número de referencia ni lista de fuentes. Nada de otro tema del temario que tenga su propio número.`;
  }
  return `QUÉ INCLUIR\n${inc}\n\nQUÉ NO INCLUIR\n${exc}`;
}

export function construirPromptRepaso({
  curso,
  tema,
  temarioCurso,
  paraJson = false
}) {
  const c = PROMPTS_REPASO[curso] || CONFIG_GENERICA;
  const u = c.unidadSing || (c.arquetipo === "historico" ? "aspecto" : "subtema");
  const up =
    c.unidadPlur ||
    (c.arquetipo === "historico" ? "aspectos" : `${u}s`);
  const { total, lista } = temarioNumerado(temarioCurso, tema);
  const notaFormulas = c.formulas ? `\n${NOTA_FORMULAS}` : "";
  const ejemplo = EJEMPLOS_APUNTE[curso];
  const bloqueEjemplo = ejemplo
    ? `EJEMPLO DE APUNTE REAL (de otro tema: solo ilustra el estilo y la brevedad; NO copies su contenido)\n${ejemplo}\n\n`
    : "";
  const avisoJson = paraJson
    ? "\nEste es el PASO 1 de 3: solo escribe los apuntes. En el siguiente mensaje te pediré convertirlos a JSON; no lo hagas todavía."
    : "";

  return `Actúa como profesor de ${curso} preuniversitario e investigador. Prepara apuntes para copiar a mi cuaderno sobre el tema marcado en el temario de abajo, para el examen de admisión de la UNMSM (Área C).
No te doy apuntes: investiga tú solo. No muestres el proceso de investigación ni fuentes: nada de links, citas, notas ni marcadores como [1] o [cite]. No menciones la universidad, academias, profesores ni el examen dentro de los apuntes.${avisoJson}

TEMARIO DE ${curso.toUpperCase()} (referencia, no lo desarrolles completo — ${total} temas)
${lista}

${bloqueInvestigacion(c, u, up)}

${bloqueLimite(c, total)}

${bloqueAutorrevision(c, u, up)}

${bloqueIncluir(c, u, up)}

BREVEDAD (regla principal)
- Una idea por viñeta, en fragmentos cortos: máximo 12 palabras. Sin oraciones largas ni explicaciones.
- Máximo dos niveles de viñeta por ${u}.
- Cada dato aparece una sola vez en todo el apunte.
- Negrita solo en el término clave.
- Si hay duda entre incluir o quitar algo, quítalo.
${notaFormulas}

${bloqueEjemplo}FORMATO
- Un solo título, con el nombre del tema. No lo repitas.
- Subtítulos cortos, uno por ${u}. Primero su dato o definición básica en una viñeta, luego lo demás si corresponde.
- Tabla solo si comparas 3 o más cosas, y esa comparación no se repite en viñetas.
- Ordena de lo más importante a lo menos importante.
- Termina con el último dato del tema: sin tabla resumen, sin fuentes, sin notas, sin conclusión y sin preguntas finales.
- Sin introducción ni conclusión: solo los apuntes, en Markdown, listos para copiar.`;
}


// ─────────────────────────────────────────────────────────────────────────
// PASO 2: convertir en JSON los apuntes del paso 1 (mensaje aparte).
// Usa los mismos prompts de tarjetas de la carpeta promt/ (copiados en promptsJsonTeoria.js),
// elegidos según el curso.
// ─────────────────────────────────────────────────────────────────────────
const CURSOS_JSON_MATE = [
  "Habilidad Lógico Matemático",
  "Aritmética",
  "Álgebra",
  "Geometría",
  "Trigonometría"
];
const CURSOS_JSON_CIENCIA = ["Biología", "Física", "Química"];

function promptJsonBase(curso) {
  if (CURSOS_JSON_MATE.includes(curso)) return teoriaMate;
  if (CURSOS_JSON_CIENCIA.includes(curso)) return teoriaCiencia;
  return teoriaLetras;
}

export function construirPromptJson({ curso, tema }) {
  return `CURSO: ${curso}
TEMA: ${tema}

PASO 2 de 3: convierte en el JSON de este prompt los apuntes que escribiste en tu mensaje anterior. Ese texto es el material recibido que debes cubrir completo.
Devuelve únicamente el JSON, siguiendo todas las reglas de abajo. Después te pediré el examen; no lo hagas todavía.

${promptJsonBase(curso)}`;
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 3: examen + ejercicios a partir del JSON de teoría del paso 2.
// Usa los prompts examen_*.txt de la carpeta promt/, elegidos según el curso.
// ─────────────────────────────────────────────────────────────────────────
function promptExamenBase(curso) {
  if (CURSOS_JSON_MATE.includes(curso)) return examenMate;
  if (CURSOS_JSON_CIENCIA.includes(curso)) return examenCiencia;
  return examenLetras;
}

export function construirPromptExamen({ curso, tema }) {
  return `CURSO: ${curso}
TEMA: ${tema}

PASO 3 de 3: usa como entrada el JSON de teoría que generaste en tu mensaje anterior. Ese JSON es el que «recibes» en el prompt de abajo. Sigue todas las reglas de abajo, incluido el flujo de dos mensajes.

${promptExamenBase(curso)}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Copiar al portapapeles (con respaldo si el navegador no permite la API).
// Devuelve true si se copió.
// ─────────────────────────────────────────────────────────────────────────
export async function copiarTexto(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (e) {
    console.error("Error copiando con la API del portapapeles:", e);
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch (e) {
    console.error("Error copiando con el respaldo:", e);
    return false;
  }
}