// ─────────────────────────────────────────────────────────────────────────
// Prompts de ChatGPT de la pestaña Temario de Repaso.
// Salida esperada: APUNTES PARA COPIAR EN EL CUADERNO (Markdown, sin JSON).
//
// Cada curso tiene su propia configuración (rol, cómo dividir en subtemas,
// qué incluir en cada subtema, reglas y prohibiciones propias). Las reglas de
// redacción y formato son las mismas para todos y viven en construirPromptRepaso.
// ─────────────────────────────────────────────────────────────────────────
import {
  teoriaLetras,
  teoriaMate,
  teoriaCiencia
} from "./Promptsjsonteoria";
const NOTA_FORMULAS =
  "Las fórmulas y operaciones se escriben en texto plano (x², √, ×, ÷, π), sin LaTeX; dentro de ellas se usan los símbolos matemáticos normales.";
export const PROMPTS_REPASO = {
  "Habilidad Lógico Matemático": {
    rol: "Razonamiento Lógico Matemático",
    ejemploSubtemas:
      "para «Sucesiones» → Sucesión aritmética, Sucesión geométrica, Sucesión alternada.",
    subtemas:
      "son los tipos de problema, métodos o estrategias del tema; un subtema por cada método, caso o tipo.",
    contenido: [
      "qué condiciones tiene el problema y qué se pide",
      "método de resolución, un paso por línea",
      "cuándo conviene usar ese método",
      "patrones o relaciones que ayudan a reconocerlo",
      "casos particulares",
      "un error frecuente al resolverlo"
    ],
    especial: [
      "Enseña cómo pensar y resolver, no solo definiciones.",
      "Incluye un ejemplo resuelto breve por método: enunciado en una línea, pasos (una línea por paso) y respuesta."
    ],
    evitar:
      "etimología, historia, curiosidades ni teoría que no ayude a resolver problemas",
    formulas: true
  },
  "Aritmética": {
    rol: "Aritmética",
    ejemploSubtemas:
      "para «Fracciones» → Fracción propia, Fracción impropia, Operaciones con fracciones.",
    subtemas:
      "son las propiedades, casos, operaciones o clases de números del tema; un subtema por cada uno.",
    contenido: [
      "definición mínima necesaria",
      "propiedades, una por viñeta",
      "reglas y condiciones de aplicación",
      "procedimiento paso a paso",
      "casos particulares y excepciones",
      "un error frecuente"
    ],
    especial: [
      "Indica cuándo se aplica cada propiedad o regla.",
      "Incluye un ejemplo resuelto breve por procedimiento: enunciado, pasos y respuesta."
    ],
    evitar: "etimología, historia ni curiosidades numéricas",
    formulas: true
  },
  "Álgebra": {
    rol: "Álgebra",
    ejemploSubtemas:
      "para «Ecuación cuadrática» → Forma general, Discriminante, Suma y producto de raíces.",
    subtemas:
      "son los conceptos, propiedades, métodos o casos algebraicos del tema; un subtema por cada uno.",
    contenido: [
      "concepto fundamental",
      "propiedades e identidades, una por viñeta",
      "fórmulas con el significado de cada variable",
      "condiciones y restricciones (dominio, valores excluidos)",
      "métodos de resolución paso a paso",
      "casos especiales",
      "un error frecuente"
    ],
    especial: [
      "Explica cuándo y cómo aplicar cada propiedad, fórmula o método.",
      "Incluye un ejemplo resuelto breve por método."
    ],
    evitar: "etimología, historia ni álgebra abstracta universitaria",
    formulas: true
  },
  "Geometría": {
    rol: "Geometría",
    ejemploSubtemas:
      "para «Triángulos» → Clasificación por lados, Clasificación por ángulos, Puntos notables.",
    subtemas:
      "son las figuras, cuerpos, teoremas o relaciones del tema; un subtema por cada uno.",
    contenido: [
      "elementos y notación de la figura",
      "clasificación",
      "propiedades, una por viñeta",
      "teoremas: enunciado breve, sin demostración",
      "fórmulas (perímetro, área, volumen, según el tema) con el significado de cada variable",
      "qué propiedad permite resolver cada tipo de problema",
      "un error frecuente"
    ],
    especial: [
      "Como no hay dibujos, describe cada figura con palabras: sus elementos y cómo se relacionan.",
      "Demuestra un teorema solo si es indispensable para entenderlo.",
      "Incluye un ejemplo resuelto breve por tipo de problema."
    ],
    evitar: "historia, etimología ni curiosidades geométricas",
    formulas: true
  },
  "Trigonometría": {
    rol: "Trigonometría",
    ejemploSubtemas:
      "para «Razones trigonométricas» → Razones en el triángulo rectángulo, Ángulos notables, Ángulos complementarios.",
    subtemas:
      "son las razones, funciones, identidades o tipos de problema del tema; un subtema por cada uno.",
    contenido: [
      "definición de cada razón o función",
      "valores o ángulos notables, cuando el tema los use",
      "signos por cuadrante, cuando corresponda",
      "identidades y fórmulas, una por viñeta, con sus condiciones",
      "procedimiento de transformación o resolución paso a paso",
      "cuándo usar cada identidad o fórmula",
      "un error frecuente"
    ],
    especial: [
      "No te limites a listar fórmulas: indica en qué tipo de problema se usa cada una.",
      "Incluye un ejemplo resuelto breve por tipo de problema."
    ],
    evitar: "historia, etimología ni curiosidades",
    formulas: true
  },
  "Economía": {
    rol: "Economía",
    ejemploSubtemas: "para «Mercado» → Demanda, Oferta, Equilibrio.",
    subtemas:
      "son los conceptos, elementos, tipos, agentes o procesos económicos del tema; un subtema por cada uno.",
    contenido: [
      "concepto",
      "características",
      "elementos o agentes",
      "clasificación",
      "funcionamiento",
      "causas y consecuencias, con ↑ ↓ ⇒ cuando expresen una relación",
      "términos indispensables"
    ],
    especial: [
      "Marca con «≠» los conceptos que suelen confundirse.",
      "Si el tema tiene fórmulas (PBI, elasticidad, inflación, etc.), inclúyelas con el significado de cada variable.",
      "Usa un ejemplo de la economía real, en una línea, solo si aclara un concepto."
    ],
    evitar:
      "modelos universitarios avanzados, historia del pensamiento económico ni curiosidades",
    formulas: true
  },
  "Biología": {
    rol: "Biología",
    ejemploSubtemas:
      "para «Célula» → Célula procariota, Célula eucariota, Organelos.",
    subtemas:
      "son las estructuras, procesos, niveles, grupos o mecanismos del tema; un subtema por cada uno.",
    contenido: [
      "concepto",
      "características",
      "estructura: cada parte → su función, una por viñeta",
      "clasificación",
      "procesos: una etapa por línea, en orden",
      "mecanismos y relaciones entre estructuras",
      "términos científicos exactos",
      "ejemplos de organismos o casos, en una línea"
    ],
    especial: [
      "Marca con «≠» las estructuras o procesos parecidos que suelen confundirse.",
      "Usa la terminología científica precisa del nivel preuniversitario."
    ],
    evitar:
      "historia del descubrimiento, etimología ni curiosidades, salvo que sean necesarias para entender el tema",
    formulas: false
  },
  "Física": {
    rol: "Física",
    ejemploSubtemas:
      "para «MRU» → Velocidad y rapidez, Ecuación del MRU, Encuentro y alcance.",
    subtemas:
      "son los fenómenos, leyes, magnitudes o tipos de problema del tema; un subtema por cada uno.",
    contenido: [
      "concepto físico",
      "magnitudes con su símbolo y su unidad",
      "leyes y principios con enunciado breve",
      "fórmulas con el significado de cada variable",
      "condiciones de aplicación",
      "casos particulares",
      "un error frecuente"
    ],
    especial: [
      "Explica en pocas palabras qué representa físicamente cada fórmula y cuándo se aplica.",
      "Incluye un ejemplo resuelto breve por tipo de problema: datos → fórmula → sustitución con unidades → resultado.",
      "Indica siempre las unidades del Sistema Internacional (SI)."
    ],
    evitar: "historia, biografías, etimología ni curiosidades",
    formulas: true
  },
  "Química": {
    rol: "Química",
    ejemploSubtemas:
      "para «Enlace químico» → Enlace iónico, Enlace covalente, Enlace metálico.",
    subtemas:
      "son los conceptos, clases de compuestos, tipos de enlace o de reacción, leyes o tipos de cálculo del tema; un subtema por cada uno.",
    contenido: [
      "concepto",
      "propiedades",
      "clasificación",
      "estructura",
      "nomenclatura y reglas, con un ejemplo de cada una",
      "reacciones (ecuación en texto plano)",
      "condiciones",
      "cálculos: procedimiento paso a paso",
      "un error frecuente"
    ],
    especial: [
      "Ajusta la proporción entre teoría y cálculo a la naturaleza del tema: si es conceptual, prioriza comprender; si tiene cálculos, incluye un ejemplo resuelto breve por tipo.",
      "Escribe las fórmulas químicas en texto plano con subíndices (H₂O, CO₂)."
    ],
    evitar: "historia, biografías, etimología ni curiosidades",
    formulas: true
  },
  "Geografía": {
    rol: "Geografía",
    ejemploSubtemas: "para «Relieve peruano» → Costa, Sierra, Selva.",
    subtemas:
      "son los elementos, regiones, factores o procesos geográficos del tema; un subtema por cada uno.",
    contenido: [
      "concepto",
      "características",
      "ubicación y límites",
      "factores y elementos",
      "clasificación",
      "distribución",
      "procesos, con causa ⇒ consecuencia",
      "ejemplos concretos del Perú o del mundo, según el tema"
    ],
    especial: [
      "Da cifras, nombres y ubicaciones solo si estás seguro de ellos.",
      "Resalta las relaciones entre factores y fenómenos."
    ],
    evitar: "historia, etimología ni curiosidades",
    formulas: false
  },
  "Educación Cívica": {
    rol: "Educación Cívica",
    ejemploSubtemas:
      "para «Estado» → Elementos del Estado, Poderes del Estado, Organismos autónomos.",
    subtemas:
      "son los conceptos, instituciones, derechos, deberes, normas o procesos del tema; un subtema por cada uno.",
    contenido: [
      "concepto",
      "características",
      "elementos",
      "instituciones: nombre completo, función y competencias",
      "derechos y deberes, uno por viñeta",
      "normas con su nombre; cita artículos solo si estás seguro",
      "situaciones de aplicación, en una línea"
    ],
    especial: [
      "Marca con «≠» las instituciones o conceptos parecidos que suelen confundirse.",
      "Usa la legislación peruana vigente."
    ],
    evitar: "etimología, historia ni curiosidades",
    formulas: false
  },
  "Psicología": {
    rol: "Psicología",
    ejemploSubtemas:
      "para «Memoria» → Memoria sensorial, Memoria de corto plazo, Memoria de largo plazo.",
    subtemas:
      "son los procesos, tipos, teorías, enfoques o etapas del tema; un subtema por cada uno.",
    contenido: [
      "concepto y objeto de estudio",
      "características",
      "procesos, uno por viñeta",
      "tipos o clases",
      "teorías y enfoques con el formato autor → postura → idea central",
      "autores indispensables, con nombre completo",
      "situación de aplicación, en una línea"
    ],
    especial: [
      "Marca con «≠» los conceptos similares que suelen confundirse.",
      "Si el tema es una teoría, crea un subtema por cada etapa, concepto o autor."
    ],
    evitar: "biografías, etimología ni historia innecesaria",
    formulas: false
  },
  "Habilidad Verbal": {
    rol: "Razonamiento Verbal",
    ejemploSubtemas:
      "para «Analogías» → Analogía sinonímica, Analogía antonímica, Analogía de causa-efecto.",
    subtemas:
      "son los tipos de ejercicio o las estrategias del tema; un subtema por cada tipo.",
    contenido: [
      "qué es, en una línea",
      "criterio para identificarlo",
      "procedimiento paso a paso",
      "cómo analizar y descartar alternativas",
      "casos frecuentes",
      "un error frecuente"
    ],
    especial: [
      "Enseña cómo identificar y resolver el ejercicio.",
      "Incluye un ejemplo breve por tipo: enunciado, alternativa correcta y la razón en una línea."
    ],
    evitar: "teoría extensa que no mejore la capacidad de resolución",
    formulas: false
  },
  "Lenguaje": {
    rol: "Lenguaje",
    ejemploSubtemas:
      "para «Tildación» → Tilde en agudas, Tilde en graves, Tilde diacrítica.",
    subtemas:
      "son los elementos, clases, reglas o procedimientos lingüísticos del tema; un subtema por cada uno.",
    contenido: [
      "concepto",
      "características",
      "elementos",
      "clasificación",
      "reglas, una por viñeta, cada una con un ejemplo corto entre «»",
      "excepciones que importan",
      "procedimiento de análisis paso a paso",
      "un error frecuente"
    ],
    especial: [
      "Aplica la norma vigente de la Real Academia Española (RAE).",
      "Los ejemplos van entre «» y son de una línea."
    ],
    evitar: "etimología, historia de la lengua ni curiosidades",
    formulas: false
  },
  "Literatura": {
    rol: "Literatura",
    ejemploSubtemas:
      "para «Géneros literarios» → Género épico, Género lírico, Género dramático.",
    subtemas:
      "son las corrientes, géneros, épocas, autores u obras del tema; un subtema por cada uno.",
    contenido: [
      "concepto o ubicación en el tiempo",
      "características, una por viñeta",
      "especies, formas o subgéneros, una por viñeta, con definición breve",
      "recursos o rasgos que la identifican",
      "representantes, con nombre completo",
      "obras, con su título entre «»",
      "tema o argumento de cada obra, en una línea"
    ],
    especial: [
      "Usa el formato autor → obra → rasgo.",
      "Incluye el contexto histórico o biográfico solo si ayuda a identificar el tema o la obra.",
      "No copies fragmentos de obras ni poemas."
    ],
    evitar: "biografías extensas, etimología ni contexto innecesario",
    formulas: false
  },
  "Historia Universal": {
    rol: "Historia Universal",
    ejemploSubtemas:
      "para «Revolución Francesa» → Causas, Etapas, Consecuencias.",
    subtemas:
      "son las etapas, procesos, civilizaciones, revoluciones o conflictos del tema; un subtema por cada uno.",
    contenido: [
      "ubicación temporal (fechas)",
      "contexto y antecedentes",
      "causas, una por viñeta",
      "hechos principales en orden cronológico: fecha → hecho",
      "consecuencias, una por viñeta",
      "personajes: nombre completo → papel",
      "conceptos indispensables"
    ],
    especial: [
      "Verifica las fechas; si no estás seguro de una, omítela.",
      "No incluyas hechos que correspondan a otros temas del temario."
    ],
    evitar: "anécdotas, biografías extensas ni curiosidades",
    formulas: false
  },
  "Historia del Perú": {
    rol: "Historia del Perú",
    ejemploSubtemas:
      "para «Tahuantinsuyo» → Organización política, Organización económica, Expansión.",
    subtemas:
      "son los periodos, culturas, procesos o dimensiones (política, sociedad, economía, cultura) del tema; un subtema por cada uno.",
    contenido: [
      "ubicación temporal y espacial",
      "contexto y antecedentes",
      "organización política",
      "organización social",
      "economía",
      "cultura",
      "causas, hechos en orden cronológico (fecha → hecho) y consecuencias",
      "personajes: nombre completo → papel"
    ],
    especial: [
      "Incluye solo las dimensiones que correspondan al tema.",
      "No mezcles periodos, culturas o procesos de otros temas.",
      "Verifica las fechas; si no estás seguro de una, omítela."
    ],
    evitar: "anécdotas, biografías extensas ni curiosidades",
    formulas: false
  },
  "Filosofía": {
    rol: "Filosofía",
    ejemploSubtemas:
      "para «Teoría del conocimiento» → Racionalismo, Empirismo, Criticismo.",
    subtemas:
      "son los problemas, corrientes, autores o posturas del tema; un subtema por cada uno.",
    contenido: [
      "problema filosófico que plantea",
      "concepto",
      "postura o corriente",
      "autor → corriente → idea central",
      "planteamientos principales, uno por viñeta",
      "con qué otra postura se contrapone («≠»)",
      "ejemplo de aplicación, en una línea"
    ],
    especial: [
      "Escribe los nombres de los autores completos y ubícalos en su corriente.",
      "Menciona obras solo si son parte del tema."
    ],
    evitar: "etimología, biografías extensas ni historia innecesaria",
    formulas: false
  }
};
// Respaldo por si aparece un curso sin configuración propia.
const PROMPT_GENERICO = {
  rol: "",
  ejemploSubtemas: "para «Géneros literarios» → Género épico, Género lírico, Género dramático.",
  subtemas: "son los subtemas reales del tema; un subtema por cada uno.",
  contenido: [
    "concepto",
    "características",
    "clasificación",
    "procesos o procedimientos, si el tema los tiene",
    "ejemplos, en una línea"
  ],
  especial: ["Adapta el contenido a la naturaleza del curso."],
  evitar: "etimología, historia ni curiosidades",
  formulas: false
};
function lista(items) {
  return items.map((i) => `- ${i}`).join("\n");
}
function listaNumerada(items) {
  return items.map((i, n) => `${n + 1}. ${i}`).join("\n");
}
export function construirPromptRepaso({
  curso,
  tema,
  temarioCurso,
  paraJson = false
}) {
  const c = PROMPTS_REPASO[curso] || PROMPT_GENERICO;
  const rol = c.rol || curso;
  const notaFormulas = c.formulas ? `\n${NOTA_FORMULAS}` : "";
  const avisoJson = paraJson
    ? "\nEste es el PASO 1 de 2: solo escribe los apuntes. En el siguiente mensaje te pediré convertirlos a JSON; no lo hagas todavía."
    : "";
  return `Actúa como profesor experto de ${rol} a nivel preuniversitario. Escribe APUNTES PARA COPIAR EN EL CUADERNO sobre el tema «${tema}» del curso «${curso}».
Usa información confiable, pero NO muestres el proceso de investigación ni fuentes: nada de links, citas, notas ni marcadores como [1] o [cite].
No menciones universidades, academias, profesores ni exámenes de admisión.${avisoJson}
ALCANCE
Temario completo de ${curso.toUpperCase()} (solo para delimitar el tema):
${temarioCurso}
Desarrolla ÚNICAMENTE «${tema}».
Los demás temas del temario son unidades independientes: no los desarrolles aunque estén relacionados, sean anteriores o posteriores, o se estudien juntos.
Si otro concepto es indispensable, menciónalo en pocas palabras sin desarrollarlo.
ESTRUCTURA
- Empieza con el título: # ${tema}
- Cada subtema propio del tema lleva su propio título (##), con máximo cuatro palabras de contenido y un solo subtema por título.
- No juntes subtemas distintos en un título ni uses títulos paraguas o con «y», «o», «/».
- Los subtemas salen del contenido real del tema, no de una plantilla.
- Prohibidas las secciones genéricas: «Diferencias», «Claves para examen», «Ideas clave», «Fórmula para recordar», «Resumen», «Conclusión», «Recomendaciones» o similares.
- Si dos conceptos se confunden, marca la diferencia dentro de la viñeta de cada uno con «≠», no en una sección aparte.
- «Concepto» solo puede ser el primer subtema y solo si el tema necesita definirse.
- No hay mínimo ni máximo fijo de subtemas: los que el tema realmente tenga.
- ORDEN DENTRO DE CADA SUBTEMA: las viñetas siguen la lista numerada de «ENFOQUE», de arriba hacia abajo.
- Agrupa las viñetas del mismo tipo: todas las características juntas, todas las especies juntas, todos los ejemplos juntos. No las mezcles.
- Deja una línea en blanco entre un grupo y el siguiente, sin poner títulos ni etiquetas a los grupos.
- La viñeta con «≠», si existe, va al final del primer grupo.
- Ejemplo de subtemas (solo ilustra el formato; no lo copies): ${c.ejemploSubtemas}
ENFOQUE DE ${curso.toUpperCase()}
Los subtemas ${c.subtemas}
Dentro de cada subtema incluye, cuando corresponda, en ESTE ORDEN:
${listaNumerada(c.contenido)}
Reglas propias del curso:
${lista(c.especial)}
No agregues ${c.evitar}.
REDACCIÓN
- Una viñeta = una idea = un dato principal.
- Máximo doce palabras por viñeta, sin contar símbolos.
- Frases cortas con palabras clave; sin párrafos ni relleno.
- Resalta en **negrita** como máximo un término clave por viñeta.
- Cada viñeta se entiende por sí sola; no repitas información entre viñetas ni entre subtemas.
- Los pasos de un procedimiento o de un ejemplo resuelto van numerados, un paso por línea.
- La primera vez que uses una sigla, escribe su significado completo: Organización de las Naciones Unidas (ONU).
- Escribe los nombres de personas completos, sin iniciales; si no estás seguro del nombre completo, usa solo el apellido.
- No inventes datos ni clasificaciones. Si no estás seguro de un dato, omítelo.
- No presentes como absoluto lo que solo ocurre en general.
- COMPLETO ≠ LARGO: cubre todo lo fundamental del tema con la menor cantidad de palabras. Un tema pequeño da apuntes pequeños; no rellenes.
SÍMBOLOS PARA RELACIONAR IDEAS
Usa solo estos, con estos significados, y ningún otro para relacionar ideas:
= igual · → produce · ⊃ contiene · ∈ pertenece · ⇒ causa o implica · ✓ requiere · ✗ carece · + más · ↑ aumenta · ↓ disminuye · ≠ diferente · ≈ similar${notaFormulas}
FORMATO DE SALIDA
- Solo los apuntes, en Markdown, listos para copiar.
- Sin introducción, sin conclusión, sin tablas y sin explicaciones fuera de los apuntes.
CONTROL FINAL
Antes de responder comprueba que: desarrollaste solo «${tema}»; cada título es corto y de un solo subtema; no hay secciones genéricas; cada viñeta tiene una sola idea y no pasa de doce palabras; usaste solo los símbolos permitidos; no hay fuentes ni citas; no falta ningún contenido fundamental del tema.`;
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
PASO 2 de 2: convierte en el JSON de este prompt los apuntes que escribiste en tu mensaje anterior. Ese texto es el material recibido que debes cubrir completo.
Devuelve únicamente el JSON, siguiendo todas las reglas de abajo.
${promptJsonBase(curso)}`;
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