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
} from "./Promptsjsonteoria";
import {
  examenLetras,
  examenMate,
  examenCiencia
} from "./Promptsexamenteoria";
import temarioSesiones from "../data/coursesSemanas.json";
import manifest from "../data/manifest.json";
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
    rasgo: "su criterio de identificación, sus excepciones y, solo si aclara, un ejemplo propio de una línea",
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
// Qué información necesita cada curso conceptual (se suma a la lista general
// de QUÉ INCLUIR). Cada curso pide cosas distintas.
const INCLUIR_CURSO = {
  "Literatura":
    "En cada autor u obra: autor, época y movimiento; obras principales con su argumento resumido; personajes principales; género, narrador y rasgos de estilo; temas.",
  "Geografía":
    "Ubicación y límites; relieve, clima o hidrografía según el tema; causas del fenómeno; datos numéricos con su unidad; casos del Perú y del mundo.",
  "Lenguaje":
    "Criterio para identificarlo, tipos o clases, excepciones y, solo si aclara, un ejemplo propio de una línea.",
  "Filosofía":
    "Representante y época, tesis central, conceptos clave y obra principal.",
  "Psicología":
    "Autor y aporte, componentes y fases del proceso, y un ejemplo cotidiano solo si aclara.",
  "Educación Cívica":
    "Función o atribución, norma que la respalda (Constitución o ley), órgano responsable y composición.",
  "Economía":
    "Agentes y variables que intervienen, cómo se interpreta, fórmula con unidades cuando exista y un caso o institución del Perú.",
  "Biología":
    "Estructura, función, pasos del proceso, y organismos o enfermedades representativas.",
  "Física":
    "Magnitud (escalar o vectorial), leyes y principios, fórmula con unidades del SI y sus condiciones de validez.",
  "Química":
    "Definición y clasificación; propiedades y estructura o enlace; ejemplos de sustancias o procesos y sus usos cuando aporten; y, solo cuando el tema los tenga, fórmulas, nomenclatura y ecuaciones."
};
Object.entries(INCLUIR_CURSO).forEach(([k, v]) => {
  if (PROMPTS_REPASO[k]) PROMPTS_REPASO[k].incluirExtra = v;
});
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
- Sincretismo cultural: mezcla amerindia, africana y europea
- Fusión de tradición y hechos históricos
- Teoriza lo real maravilloso
## El reino de este mundo
- Género: narrativo
- Especie: novela
- Narrador: omnisciente
- Narración lineal-cronológica y episódica`,
  "Historia Universal": `# Imperio napoleónico (1804-1815)
## III Coalición
- Trafalgar: derrota franco-española
- Austerlitz: gran victoria (los tres emperadores)
- Crea la Confederación del Rin
## IV Coalición
- Decreto de Berlín: bloqueo continental contra Inglaterra
- Tilsit: acuerdo con el zar Alejandro I (Rusia)`,
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
- En toda reacción, la masa de los reactantes es igual a la de los productos
- Ejemplo: O₂ y 2 H₂ forman 2 H₂O (32 g y 4 g dan 36 g)`
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
5. Busca con qué otras ideas del temario se relaciona este tema de forma natural, solo para mencionarlas de pasada si ayudan a entenderlo.
Contrasta cada dato importante en al menos dos fuentes. Si no puedes confirmarlo, no lo escribas.`;
  }
  if (c.arquetipo === "historico") {
    return `INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${up}: causas, etapas, consecuencias).
2. Para CADA ${u}, busca su dato básico: qué ocurrió, cuándo y dónde.
3. Para CADA ${u}, busca personajes con nombre completo, causas y consecuencias, pero solo los datos que de verdad distinguen ese hecho de otros.
4. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué fechas o nombres preguntan realmente: si preguntan solo el hecho básico, no agregues detalles que nadie pregunta.
5. Busca con qué otros hechos o procesos del temario se relaciona este tema de forma natural, solo para mencionarlos de pasada si ayudan a entenderlo.
Contrasta cada fecha, nombre o cifra en al menos dos fuentes. Si los historiadores discrepan o no puedes confirmar el dato, indícalo como aproximado o no lo escribas.`;
  }
  return `INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${up} o características principales).
2. Para CADA ${u}, busca su definición básica y sus tipos o clasificaciones completas.
3. Para CADA tipo que encuentres, busca ${c.rasgo}, pero solo los que de verdad distinguen un tipo de otro.
4. Busca los casos, agentes, enfermedades, fenómenos o ejemplos concretos y aplicados de este tema con los que un examen suele evaluarlo. No te quedes solo en el esquema de clasificación abstracto: un tema con aplicaciones reales conocidas (una enfermedad representativa, un mecanismo con nombre propio, una vía o proceso concreto) debe cubrir esas aplicaciones, no solo la teoría general.
5. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué preguntan realmente: si preguntan solo la definición básica, no agregues atributos que nadie pregunta; si preguntan sobre un caso o agente concreto del paso 4, ese caso debe quedar cubierto en el apunte.
6. Busca con qué otros conceptos del temario se relaciona este tema de forma natural, solo para mencionarlos de pasada si ayudan a entenderlo.
Contrasta cada dato importante en al menos dos fuentes. Si no puedes confirmarlo, no lo escribas.`;
}
function bloqueLimite(c, total) {
  const extra = c.notaExtra ? ` ${c.notaExtra}` : "";
  return `LÍMITE CON OTROS TEMAS DEL TEMARIO
El temario de abajo tiene un tema propio para cada cosa que ves numerada (${total} en total). Desarrolla ÚNICAMENTE el tema marcado con ← TEMA A DESARROLLAR. Si al investigarlo encuentras algo que en el temario tiene su propio número, puedes mencionarlo de pasada cuando ayude a entender este tema, de forma natural y sin desarrollarlo.${extra}`;
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
    exc = `Relatos narrativos extensos, curiosidades sin valor de examen, opiniones sobre los hechos, fechas que no puedas confirmar. No dupliques un ${u} como si fuera otro. No inventes un dato si no distingue nada. Ningún número de referencia ni lista de fuentes. No desarrolles otro tema del temario que tenga su propio número (mencionarlo de pasada sí, si ayuda a entender este).`;
  } else if (c.arquetipo === "practico") {
    const upCap = up.charAt(0).toUpperCase() + up.slice(1);
    inc = `La regla o forma básica de cada ${u} siempre. Las condiciones de uso y atajos distintivos solo cuando el ${u} los tenga y un examen pueda preguntarlos. Casos límite y excepciones. ${upCap} vecinos que aparecen como distractores.`;
    exc = `Procedimientos de resolución paso a paso, ejemplos resueltos con alternativas, enunciados de problemas completos, etimología, historia o curiosidades. No dupliques un ${u} como si fuera otro. No inventes una condición si no distingue nada. Ningún número de referencia ni lista de fuentes. No desarrolles otro tema del temario que tenga su propio número (mencionarlo de pasada sí, si ayuda a entender este).`;
  } else {
    inc = `La definición básica de cada ${u} siempre. Los tipos y sus atributos distintivos solo cuando el ${u} los tenga y un examen pueda preguntarlos. Estructura y función, etapas, excepciones. Casos, agentes o ejemplos concretos y aplicados cuando el tema tenga uno representativo conocido (una enfermedad, un mecanismo con nombre propio, un proceso real), no solo el esquema abstracto. Conceptos vecinos que aparecen como distractores.`;
    if (c.formulas) {
      inc += " Cuando el tema tenga fórmulas de cálculo, inclúyelas con sus variables y unidades.";
    }
    if (c.incluirExtra) {
      inc += ` Específico de este curso: ${c.incluirExtra}`;
    }
    exc = `Etimología, historia, curiosidades, detalles universitarios que esas preguntas no piden, cómo resolver problemas ni ejemplos resueltos. No dupliques un ${u} como si fuera un tema aparte. No inventes un atributo si no distingue nada. Ningún número de referencia ni lista de fuentes. No desarrolles otro tema del temario que tenga su propio número (mencionarlo de pasada sí, si ayuda a entender este).`;
  }
  return `QUÉ INCLUIR\n${inc}\n\nQUÉ NO INCLUIR\n${exc}`;
}
// Cómo redactar los apuntes para que se aprendan mejor (pedagogía basada en
// evidencia: coherencia y señalización, conceptos previos antes del detalle,
// ejemplos concretos, el porqué, contraste entre conceptos vecinos).
function bloquePedagogia(c, u, up) {
  const ejemplo =
    c.arquetipo === "practico"
      ? `- No uses ejemplos resueltos (ya están excluidos). Si ayuda a entender el ${u}, menciona de pasada otro concepto de forma natural; no armes comparaciones ni secciones de errores frecuentes.`
      : `- Si un concepto es abstracto, puedes acompañarlo con un ejemplo concreto de una línea, solo si sin él no se entiende; si ya se entiende, no pongas ejemplo. Si ayuda a entender el ${u}, menciona de pasada otro concepto de forma natural; no armes comparaciones ni secciones de errores frecuentes.`;
  const porque =
    c.arquetipo === "historico"
      ? `- En cada hecho clave, agrega una viñeta breve con su causa o su consecuencia principal.`
      : c.arquetipo === "practico"
        ? `- En cada regla clave, agrega una viñeta breve de cuándo se aplica y por qué funciona.`
        : `- En los datos clave, agrega una viñeta breve con el porqué (causa, mecanismo o razón) cuando exista.`;
  const frase =
    c.arquetipo === "historico"
      ? "Después de la derrota, el ejército se retiró hacia el sur."
      : c.arquetipo === "practico"
        ? "Primero se identifica la idea central y luego se descartan las opciones que no la resumen."
        : "Después de la fecundación, el óvulo se convierte en semilla.";
  const redaccion = c.formulas
    ? `- Las fórmulas, ecuaciones y operaciones sí llevan sus símbolos matemáticos normales; la explicación alrededor se escribe en frases naturales y claras, con sus verbos. No uses flechas ni símbolos para reemplazar palabras (→, ⇒, ≠). Los procesos se cuentan en orden con palabras (primero, luego, después).`
    : `- Cada viñeta debe leerse como una frase natural y clara, con sus verbos (por ejemplo ${frase}: corta, natural y que dé ganas de leer). No uses flechas ni símbolos (→, =, ⇒, ≠) para reemplazar palabras. Los procesos se cuentan en orden con palabras (primero, luego, después).`;
  return `CÓMO REDACTAR PARA QUE SE APRENDA (aplícalo sin romper la brevedad)
- De lo general a lo particular: primero los nombres y la definición base de cada ${u}; solo después los detalles que se apoyan en ellos.
- Una idea por viñeta, y nada decorativo: lo que no ayuda a entender o a recordar sobra.
${ejemplo}
${porque}
${redaccion}
- Los títulos y subtítulos deben bastar para ver la estructura del tema de un vistazo.
- No uses comillas angulares ni comillas en lo que escribas; los términos van sin comillas.`;
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
    ? `\nEste es el PASO 1 de 3: solo escribe los apuntes. En el siguiente mensaje te pediré convertirlos a JSON; no lo hagas todavía.\n${CICLO_SIGUIENTE}`
    : "";
  return `Actúa como profesor de ${curso} preuniversitario e investigador. Prepara apuntes para copiar a mi cuaderno sobre el tema marcado en el temario de abajo, para el examen de admisión de la UNMSM (Área C).
No te doy apuntes: investiga tú solo. No muestres el proceso de investigación ni fuentes: nada de links, citas, notas ni marcadores como [1] o [cite]. No menciones la universidad, academias, profesores ni el examen dentro de los apuntes.${avisoJson}
TEMARIO DE ${curso.toUpperCase()} (referencia, no lo desarrolles completo — ${total} temas)
${lista}
${bloqueInvestigacion(c, u, up)}
${bloqueLimite(c, total)}
${bloqueAutorrevision(c, u, up)}
${bloqueIncluir(c, u, up)}
${bloquePedagogia(c, u, up)}
BREVEDAD (regla principal)
- Cada viñeta es breve: una idea, máximo 12 palabras. Sin oraciones largas.
- Un mismo concepto puede tener varias viñetas si cada una aporta algo distinto: definición, ejemplo, diferencia o consecuencia. No repitas la misma frase.
- Máximo dos niveles de viñeta por ${u}.
- Negrita solo en el término clave.
- No omitas lo que el examen pueda pedir sobre el subtema, aunque sea otra viñeta.
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
// Usa los mismos prompts de tarjetas de la carpeta promt/ (copiados en Promptsjsonteoria.js),
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
// Ciclo por temas: con siguiente el chat alterna apuntes (paso 1) y JSON (paso 2)
// sin que haya que pegar el prompt otra vez. El paso 3 (examen) no cambia.
const CICLO_SIGUIENTE = `MODO SIGUIENTE (un tema tras otro, en este mismo chat)
- Si te escribo siguiente después de un JSON (paso 2): toma el tema que sigue en el temario numerado y haz solo el PASO 1 de ese tema, con todas las reglas del prompt del paso 1 de este chat (investigación, límite con otros temas, autorrevisión, qué incluir, cómo redactar, brevedad y formato). No hagas el JSON todavía.
- Si te escribo siguiente después de unos apuntes (paso 1): conviértelos en el JSON (paso 2), con todas las reglas del prompt del paso 2 de este chat. El archivo se llama el código del curso, un guion y el número del tema en el temario con dos dígitos (ejemplo: len-01.json).
- Así se alterna: apuntes → JSON → apuntes → JSON, un tema por mensaje, sin que yo repita el prompt.
- Si te pido el examen (paso 3), úsalo sobre el JSON del último tema entregado.
- Si ya no quedan temas después del último, dilo y no inventes otro.`;
function numeroSemana(clave) {
  return parseInt(String(clave).replace("semana_", ""), 10);
}

// Nombre del archivo JSON del tema: prefijo de los archivos del curso en el
// manifest + posición del tema en el curso, por ejemplo "len-01.json".
export function prefijoDeCurso(curso) {
  const cursoManifest = manifest.cursos.find((c) => c.nombre === curso);
  const archivo = cursoManifest?.temas?.[0]?.archivo || "";
  return archivo.split("/").pop().replace(/-\d+\.json$/, "") || "tema";
}

export function nombreArchivoJson(curso, tema) {
  const prefijo = prefijoDeCurso(curso);
  const semanas = temarioSesiones[curso] || {};
  const temas = Object.keys(semanas)
    .sort((a, b) => numeroSemana(a) - numeroSemana(b))
    .flatMap((k) => semanas[k].flat())
    .filter(Boolean);
  const posicion = temas.indexOf(tema) + 1;
  if (posicion === 0) return `${prefijo}.json`;
  return `${prefijo}-${String(posicion).padStart(2, "0")}.json`;
}

export function construirPromptJson({ curso, tema, temarioCurso }) {
  const archivoJson = nombreArchivoJson(curso, tema);
  const listaCodigos = Object.keys(temarioSesiones)
    .map((c) => `- ${c}: ${prefijoDeCurso(c)}`)
    .join("\n");
  const conCalculo =
    CURSOS_JSON_MATE.includes(curso) || CURSOS_JSON_CIENCIA.includes(curso);
  const { total, lista } = temarioNumerado(temarioCurso, tema);
  const bloqueTemario = temarioCurso
    ? `\n- No desarrolles ningún tema que en este temario tenga su propio número (${total} en total); solo el marcado con ← TEMA A DESARROLLAR.\nTEMARIO (referencia)\n${lista}`
    : "\n- No desarrolles temas distintos al indicado en TEMA.";
  const bloqueEjemplos = conCalculo
    ? "\n- Todo ejemplo numérico que escribas se recalcula paso a paso y se verifica antes de entregar; usa los datos del apunte cuando existan."
    : "";
  const cfg = PROMPTS_REPASO[curso] || CONFIG_GENERICA;
  const cierre =
    "Quédate dentro de esa idea: si para explicarla aparece otro concepto que podría tener su propia card, solo nómbralo y no lo desarrolles. Si la idea se entiende bien con una o dos oraciones, basta; sin repetir y sin enumerar todos los casos especiales. Esto prevalece sobre punto medio y no agotar el tema de las reglas de abajo solo cuando la explicación quedaría vaga.";
  const reglaExplicacion =
    cfg.arquetipo === "historico"
      ? `- explicacion desarrolla con detalle la única idea de su texto, con la extensión justa y sin relleno, y aporta lo que texto no dice (el contexto, la causa y la consecuencia del hecho, y cómo encaja de forma natural en su periodo). ${cierre}`
      : cfg.arquetipo === "practico"
        ? `- explicacion desarrolla con detalle la única idea de su texto, con la extensión justa y sin relleno, y aporta lo que texto no dice (cuándo se aplica la regla o el tipo de problema, por qué funciona y el dato o caso límite que importa). Sin procedimientos de resolución paso a paso. ${cierre}`
        : `- explicacion desarrolla con detalle la única idea de su texto, con la extensión justa y sin relleno, y aporta lo que texto no dice (el porqué o el mecanismo, el contexto, la relación con otras ideas y, cuando ayude, un ejemplo concreto). ${cierre}`;
  const reglaTexto = cfg.formulas
    ? "- texto es una frase corta y natural, con su verbo, que se entienda de un vistazo (máximo 12 palabras). Las fórmulas, ecuaciones y operaciones sí llevan sus símbolos matemáticos normales; fuera de ellas no uses flechas ni símbolos para reemplazar palabras. Esto prevalece sobre cualquier otra regla de símbolos de abajo.\r\n- Ejemplo correcto de texto: El área de un círculo es A = π × r². Ejemplo incorrecto: círculo → área = π r² (usa flechas en lugar de una frase)."
    : "- texto es una frase corta y natural, con su verbo, que se entienda de un vistazo (máximo 12 palabras). No uses flechas ni símbolos (→, =, ⇒, ≠, +, ↑, ↓) para reemplazar palabras; esto prevalece sobre cualquier regla de símbolos de abajo.\r\n- Ejemplo correcto de texto: La comunicación es la transmisión de mensajes. Ejemplo incorrecto: Comunicación = transmisión de mensajes.";
  return `CURSO: ${curso}
TEMA: ${tema}
PASO 2 de 3: convierte en el JSON de este prompt los apuntes que escribiste en tu mensaje anterior. Ese texto es el material recibido que debes cubrir completo.
Entrega el JSON como archivo adjunto descargable llamado ${archivoJson}. No lo pegues en el chat ni en bloque de código: el archivo es la única salida. Sigue todas las reglas de abajo. Después te pediré el examen; no lo hagas todavía.
${CICLO_SIGUIENTE}
CÓDIGOS DE CURSO (el archivo empieza con el código de su curso):
${listaCodigos}
Si en este mensaje no aparecen los apuntes del paso 1, pídelos antes de escribir el JSON; no inventes el material.
PRIORIDAD EN ESTE FLUJO (prevalece sobre las reglas de abajo)
- Los apuntes ya fueron investigados y verificados: son la base de cada explicacion, no su límite. Explica con tu conocimiento académico el porqué, el mecanismo, el contexto y, cuando ayude a entender, cómo se conecta de forma natural con otras ideas del temario. No agregues apartados de errores frecuentes ni comparaciones forzadas: solo lo que salga natural de la idea. Lo único que no puedes agregar son subtemas nuevos ni fechas, nombres o cifras que no estén en los apuntes y no puedas confirmar con certeza.
- La entrega es el archivo .json adjunto: la regla 7.1 se cumple así, sin texto ni bloque de código en el chat.
- El límite de 12 palabras es solo para texto, que tiene una sola idea. Si un concepto tiene partes (qué es, elementos, funciones, ejemplo), cada parte es una card separada.
${reglaExplicacion}
- Antes de entregar, revisa cada explicacion: si se puede resumir con las mismas palabras de texto, es vaga o repite; reescríbela con el porqué, el mecanismo, la consecuencia o un ejemplo. Si ya aporta algo nuevo, no la alargues.
${reglaTexto}
- El material es texto: ignora lo que dicen las reglas sobre imágenes y sobre JSON antiguo.${bloqueEjemplos}${bloqueTemario}
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
PASO 3 de 3: usa como entrada el JSON de teoría que generaste en tu mensaje anterior. Ese JSON es el que recibes en el prompt de abajo. Sigue todas las reglas de abajo, incluido el flujo de dos mensajes.
Si el JSON se corta por el límite de longitud, cuando te diga continúa sigue exactamente desde donde quedó, dentro del mismo bloque de código y sin repetir nada.
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