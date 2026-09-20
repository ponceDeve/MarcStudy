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
} from "./promptsJsonTeoria";

const NOTA_FORMULAS =
  "Las fórmulas y operaciones se escriben en texto plano (x², √, ×, ÷, π), sin LaTeX; dentro de ellas se usan los símbolos matemáticos normales.";

export const PROMPTS_REPASO = {
  "Habilidad Lógico Matemático": {
    practico: true,
    rol: "Razonamiento Lógico Matemático",
    ejemploSubtemas:
      "para «Sucesiones» → Tipos de sucesión, Término general, Suma de términos.",
    subtemas:
      "son los tipos de problema, métodos o estrategias del tema.",
    contenido: [
      "qué condiciones tiene el problema y qué se pide",
      "método de resolución, un paso por línea",
      "cuándo conviene usar ese método",
      "patrones o relaciones que ayudan a reconocerlo",
      "casos particulares",
    ],
    especial: [
      "Enseña cómo pensar y resolver, no solo definiciones.",
      "Incluye un ejemplo resuelto breve por método, con la forma de una pregunta real del examen: enunciado breve, alternativas A) a E) en una sola línea, pasos (una línea por paso) y respuesta. No uses ejercicios triviales que no ocurran en el examen."
    ],
    evitar:
      "etimología, historia, curiosidades ni teoría que no ayude a resolver problemas",
    formulas: true
  },
  "Aritmética": {
    practico: true,
    rol: "Aritmética",
    ejemploSubtemas:
      "para «Fracciones» → Clases de fracción, Operaciones, Fracción generatriz.",
    subtemas:
      "son las propiedades, casos, operaciones o clases de números del tema.",
    contenido: [
      "definición mínima necesaria",
      "propiedades, una por viñeta",
      "reglas y condiciones de aplicación",
      "procedimiento paso a paso",
      "casos particulares y excepciones",
    ],
    especial: [
      "Indica cuándo se aplica cada propiedad o regla.",
      "Incluye un ejemplo resuelto breve por procedimiento: enunciado, pasos y respuesta."
    ],
    evitar: "etimología, historia ni curiosidades numéricas",
    formulas: true
  },
  "Álgebra": {
    practico: true,
    rol: "Álgebra",
    ejemploSubtemas:
      "para «Ecuación cuadrática» → Forma general, Discriminante, Suma y producto de raíces.",
    subtemas:
      "son los conceptos, propiedades, métodos o casos algebraicos del tema.",
    contenido: [
      "concepto fundamental",
      "propiedades e identidades, una por viñeta",
      "fórmulas con el significado de cada variable",
      "condiciones y restricciones (dominio, valores excluidos)",
      "métodos de resolución paso a paso",
      "casos especiales",
    ],
    especial: [
      "Explica cuándo y cómo aplicar cada propiedad, fórmula o método.",
      "Incluye un ejemplo resuelto breve por método."
    ],
    evitar: "etimología, historia ni álgebra abstracta universitaria",
    formulas: true
  },
  "Geometría": {
    practico: true,
    rol: "Geometría",
    ejemploSubtemas:
      "para «Triángulos» → Clasificación, Puntos notables, Propiedades.",
    subtemas:
      "son las figuras, cuerpos, teoremas o relaciones del tema.",
    contenido: [
      "elementos y notación de la figura",
      "clasificación",
      "propiedades, una por viñeta",
      "teoremas: enunciado breve, sin demostración",
      "fórmulas (perímetro, área, volumen, según el tema) con el significado de cada variable",
      "qué propiedad permite resolver cada tipo de problema",
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
    practico: true,
    rol: "Trigonometría",
    ejemploSubtemas:
      "para «Razones trigonométricas» → Razones en el triángulo rectángulo, Ángulos notables, Ángulos complementarios.",
    subtemas:
      "son las razones, funciones, identidades o tipos de problema del tema.",
    contenido: [
      "definición de cada razón o función",
      "valores o ángulos notables, cuando el tema los use",
      "signos por cuadrante, cuando corresponda",
      "identidades y fórmulas, una por viñeta, con sus condiciones",
      "procedimiento de transformación o resolución paso a paso",
      "cuándo usar cada identidad o fórmula",
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
    ejemploSubtemas: "para «Mercado» → Tipos de mercado, Demanda y oferta, Equilibrio.",
    subtemas:
      "son los conceptos, elementos, tipos, agentes o procesos económicos del tema.",
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
      "para «Célula» → Concepto, Tipos de célula, Organelos.",
    subtemas:
      "son las estructuras, procesos, niveles, grupos o mecanismos del tema.",
    contenido: [
      "concepto",
      "características",
      "estructura: cada parte → su función, una por viñeta",
      "clasificación",
      "procesos: una etapa por línea, en orden",
      "mecanismos y relaciones entre estructuras",
      "términos científicos exactos",
      "ejemplos y casos concretos (organismos, enfermedades, transmisión), uno por viñeta y con su rasgo"
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
    practico: true,
    rol: "Física",
    ejemploSubtemas:
      "para «MRU» → Concepto, Ecuación del MRU, Encuentro y alcance.",
    subtemas:
      "son los fenómenos, leyes, magnitudes o tipos de problema del tema.",
    contenido: [
      "concepto físico",
      "magnitudes con su símbolo y su unidad",
      "leyes y principios con enunciado breve",
      "fórmulas con el significado de cada variable",
      "condiciones de aplicación",
      "casos particulares",
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
      "para «Enlace químico» → Concepto, Tipos de enlace, Propiedades de los compuestos.",
    subtemas:
      "son los conceptos, clases de compuestos, tipos de enlace o de reacción, leyes o tipos de cálculo del tema.",
    contenido: [
      "concepto",
      "propiedades",
      "clasificación",
      "estructura",
      "nomenclatura y reglas, con un ejemplo de cada una",
      "reacciones (ecuación en texto plano)",
      "condiciones",
      "cálculos: procedimiento paso a paso",
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
    ejemploSubtemas: "para «Relieve peruano» → Regiones del relieve, Formas del relieve, Factores.",
    subtemas:
      "son los elementos, regiones, factores o procesos geográficos del tema.",
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
      "son los conceptos, instituciones, derechos, deberes, normas o procesos del tema.",
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
      "para «Memoria» → Tipos de memoria, Procesos, Olvido.",
    subtemas:
      "son los procesos, tipos, teorías, enfoques o etapas del tema.",
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
    practico: true,
    rol: "Razonamiento Verbal",
    ejemploSubtemas:
      "para «Analogías» → Tipos de analogía, Procedimiento de resolución, Casos frecuentes.",
    subtemas:
      "son los tipos de ejercicio o las estrategias del tema.",
    contenido: [
      "qué es, en una línea",
      "criterio para identificarlo",
      "procedimiento paso a paso",
      "cómo analizar y descartar alternativas",
      "casos frecuentes",
    ],
    especial: [
      "Enseña cómo identificar y resolver el ejercicio.",
      "Incluye un ejemplo breve por tipo, con la forma de una pregunta real del examen: enunciado, alternativas A) a E) en una sola línea, alternativa correcta y la razón en una línea."
    ],
    evitar: "teoría extensa que no mejore la capacidad de resolución",
    formulas: false
  },
  "Lenguaje": {
    rol: "Lenguaje",
    ejemploSubtemas:
      "para «Tildación» → Reglas generales, Tilde diacrítica, Casos especiales.",
    subtemas:
      "son los elementos, clases, reglas o procedimientos lingüísticos del tema.",
    contenido: [
      "concepto",
      "características",
      "elementos",
      "clasificación",
      "reglas, una por viñeta, cada una con un ejemplo corto entre «»",
      "excepciones que importan",
      "procedimiento de análisis paso a paso",
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
      "son las corrientes, géneros, épocas, autores u obras del tema.",
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
      "son las etapas, procesos, civilizaciones, revoluciones o conflictos del tema.",
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
      "son los periodos, culturas, procesos o dimensiones (política, sociedad, economía, cultura) del tema.",
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
      "son los problemas, corrientes, autores o posturas del tema.",
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

// ─────────────────────────────────────────────────────────────────────────
// Apuntes reales de pizarra (transcritos) como modelo de estilo y brevedad.
// Solo se usan en los cursos que tienen ejemplo.
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
- Narración: lineal-cronológica + episódica
## Personajes
- Haitianos (tradición)
  - Ti Noel (la tradición colectiva)
  - Mackandal (primera revolución)
  - Boukman (la revolución armada)
  - Henri Christophe (primer rey negro) ⇒ traición a los ideales
  - Mamán Loi (la magia vudú)
- Franceses (colonización)
  - Monsieur Lenormand de Mezy (la cobardía)
  - Mademoiselle Floridor (frivolidad francesa)
  - Paulina Bonaparte (decadencia francesa)
## Tema
- Principal: búsqueda de la libertad (revolución haitiana)
- Secundarios
  - La esclavitud
  - La opresión
  - La tiranía`,
  "Historia Universal": `# Imperio napoleónico (1804-1815)
## III Coalición
- Trafalgar → derrota franco-española
- Austerlitz → gran victoria («los tres emperadores»)
- Crea la Confederación del Rin
## IV Coalición
- Decreto de Berlín → bloqueo continental contra Inglaterra
- Tilsit → acuerdo con el zar Alejandro I (Rusia)
## Península ibérica
- 1807 → invade Portugal
- 1808 → invade España
## Campaña de Rusia
- 1812 → inicio del fin
- Táctica rusa: tierra quemada
## VI Coalición
- Leipzig («de las naciones») → derrota napoleónica
- Es enviado a Elba`,
  "Física": `# Ondas mecánicas (O.M.)
## Concepto
- Propagación de perturbaciones
- Transportan energía y cantidad de movimiento, no materia
- Las partículas solo oscilan
- Necesitan un medio material
## Tipos
- O.M. longitudinal
  - Vibración de partículas: paralela a la propagación
  - Ejemplo: el sonido
- O.M. transversal
  - Vibración de partículas: perpendicular a la propagación
  - Ejemplo: superficie libre de un líquido
## Elementos de una O.M. transversal
- Crestas: puntos más altos
- Valles: puntos más bajos
- λ = longitud de onda (m)
- A = amplitud (m)
- V = d/t = λ/T = λ·f`,
  "Química": `# Estequiometría
## Definición
- Rama de la Química: aspecto cuantitativo de todo proceso químico
- Relación de moles, masa y volumen
- Incluye pureza y rendimiento
## Ley de conservación de la masa (Lavoisier)
- En toda reacción: Σ masa reactantes = Σ masa productos
- Ejemplo: O₂ + 2 H₂ → 2 H₂O
  - 1 mol + 2 mol → 2 mol
  - 32 g + 4 g → 36 g
## Ley de proporciones definidas (Proust)
- Sustancias se combinan siempre en masas proporcionales
- Ejemplo: CH₄ + 2 O₂ → CO₂ + 2 H₂O
  - 16 g + 64 g → 44 g + 36 g
## Reactivo limitante (R.L)
- Se consume totalmente (100%)
## Reactivo en exceso (R.E)
- Sobra en el proceso químico`
};

// Respaldo por si aparece un curso sin configuración propia.
const PROMPT_GENERICO = {
  rol: "",
  ejemploSubtemas: "para «Géneros literarios» → Género épico, Género lírico, Género dramático.",
  subtemas: "son los subtemas reales del tema.",
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

// Marca en el temario el tema actual, para que ChatGPT vea dónde termina.
function marcarTemaActual(temarioCurso, tema) {
  return String(temarioCurso || "")
    .split("\n")
    .map((linea) => {
      const i = linea.indexOf(": ");
      if (i === -1) return linea;
      const cabecera = linea.slice(0, i + 2);
      const temas = linea
        .slice(i + 2)
        .split(" | ")
        .map((t) => (t === tema ? `>>> TEMA ACTUAL: ${t} <<<` : t));
      return cabecera + temas.join(" | ");
    })
    .join("\n");
}

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
  const bloqueEnfoque = c.practico
    ? `En este curso el examen NO pregunta teoría pura: todo se evalúa aplicándola (resolver problemas). Por eso:
- Reduce la teoría a lo mínimo indispensable: definiciones de una sola línea.
- Prioriza lo que sirve para resolver: procedimientos, fórmulas, propiedades aplicables y reglas para decidir qué método usar.
- Omite explicaciones, causas y contexto que no ayuden a resolver.
- Si un elemento de la lista de «ENFOQUE» no ayuda a resolver problemas de este tema, omítelo.
`
    : `En este curso el examen sí evalúa el conocimiento del tema: hay que conocerlo para reconocerlo e identificarlo en las preguntas. Por eso:
- Incluye la teoría necesaria con la precisión con que se pregunta: definiciones exactas, clasificaciones completas, datos, fechas, autores y relaciones.
- Omite explicaciones, causas y contexto que no se evalúen.
`;
  const ejemplo = EJEMPLOS_APUNTE[curso];
  const bloqueEjemplo = ejemplo
    ? `EJEMPLO DE APUNTE REAL (de otro tema: solo ilustra el estilo y la brevedad; NO copies su contenido)
${ejemplo}

`
    : "";
  const avisoJson = paraJson
    ? "\nEste es el PASO 1 de 2: solo escribe los apuntes. En el siguiente mensaje te pediré convertirlos a JSON; no lo hagas todavía."
    : "";

  return `Actúa como profesor experto de ${rol} a nivel preuniversitario. Escribe APUNTES PARA COPIAR EN EL CUADERNO sobre el tema «${tema}» del curso «${curso}».
Usa información confiable, pero NO muestres el proceso de investigación ni fuentes: nada de links, citas, notas ni marcadores como [1] o [cite].
No menciones en los apuntes la universidad, academias, profesores ni el examen.${avisoJson}

NIVEL Y ENFOQUE
Los apuntes sirven para preparar el examen de admisión de la Universidad Nacional Mayor de San Marcos (Perú).
Incluye SOLO lo necesario para ese examen: los conceptos, propiedades, clasificaciones, fórmulas, datos, autores y procedimientos que suelen evaluarse en él, al nivel de sus preguntas de opción múltiple.
Omite todo lo que sea cierto pero no suela evaluarse: detalles de nivel universitario, contexto o historia sin uso en las preguntas, excepciones raras y curiosidades.
Si dudas de si un dato de ESTE tema entra al examen, inclúyelo; omite lo claramente universitario, anecdótico o de curiosidad, y todo lo que pertenezca a otro tema del temario.
${bloqueEnfoque}Si el tema es un método o una técnica, incluye una viñeta «Se usa en:» con el tipo de pregunta del examen donde aparece (por ejemplo: verdades y mentiras, orden de datos, cálculo de áreas).

ALCANCE
Temario completo de ${curso.toUpperCase()}:
${marcarTemaActual(temarioCurso, tema)}

Desarrolla ÚNICAMENTE «${tema}».
Cada tema del temario tiene sus propios apuntes. Todo tema distinto de «${tema}» (los de la misma semana y los demás) está PROHIBIDO: no escribas sus definiciones, tipos, fórmulas, ejemplos ni subtemas, aunque estén relacionados o parezcan encajar en este tema.
Ejemplo: si el temario tiene los temas «Mezclas y sustancias», «Estados de agregación» y «Propiedades físicas y químicas», nada de eso se desarrolla dentro de «Materia».
Antes de escribir cada viñeta pregúntate: ¿este dato es el contenido central de otro tema del temario? Si la respuesta es sí, no lo escribas.
Si un tema vecino es imprescindible para entender este, nómbralo en una viñeta de máximo tres palabras, sin desarrollarlo.

ESTRUCTURA
- Empieza con el título: # ${tema}
- Cada subtema propio del tema lleva su propio título (##), con máximo cuatro palabras de contenido y un solo subtema por título.
- No juntes subtemas distintos en un título ni uses títulos paraguas o con «y», «o», «/».
- Un subtema (##) es un BLOQUE del tema: definición, clasificación, estructura, proceso, ley, etc. Los tipos, clases, ramas o elementos de una clasificación NO llevan ## propio: van como viñetas madre dentro del subtema de su clasificación, con sus datos como hijas.
- Un elemento solo lleva ## propio si tiene contenido extenso (más de seis viñetas), como cada género o cada corriente en un tema grande.
- No uses la misma plantilla de viñetas para todos los elementos (por ejemplo «Estudia…», «Incluye…», «Relación…» repetido en cada uno): cada elemento lleva solo los datos que lo distinguen, aunque sea una sola línea.
- Los subtemas salen del contenido real del tema, no de una plantilla.
- Prohibidas las secciones genéricas: «Diferencias», «Claves para examen», «Ideas clave», «Fórmula para recordar», «Resumen», «Conclusión», «Recomendaciones» o similares.
- Si dos conceptos se confunden, marca la diferencia dentro de la viñeta de cada uno con «≠», no en una sección aparte.
- «Concepto» solo puede ser el primer subtema y solo si el tema necesita definirse.
- No hay mínimo ni máximo fijo de subtemas: los que el tema realmente tenga.
- Usa la forma que mejor represente cada contenido y NO repitas la misma en todos los subtemas: jerarquía con viñetas anidadas (criterio → tipos), secuencia numerada (procesos y pasos), cronología (fecha → hecho), contraste (A vs B) y etiqueta: dato.
- Las viñetas anidadas (hasta 2 niveles) agrupan: la viñeta madre es el criterio o el grupo y las hijas son sus tipos, partes o ejemplos. Nunca repitas el criterio en cada hija (mal: «Según genoma: ADN» y «Según genoma: ARN»; bien: «Según genoma» con hijas «ADN» y «ARN»).
- Contraste: una viñeta madre «A vs B» con una hija por cada lado, dentro del subtema al que pertenece.
- ORDEN DENTRO DE CADA SUBTEMA: las viñetas siguen la lista numerada de «ENFOQUE», de arriba hacia abajo.
- Agrupa las viñetas del mismo tipo: todas las características juntas, todas las especies juntas, todos los ejemplos juntos. No las mezcles.
- Deja una línea en blanco entre un grupo y el siguiente, sin poner títulos ni etiquetas a los grupos.
- La viñeta con «≠», si existe, va al final del primer grupo.
- Ejemplo de subtemas (solo ilustra el formato; no lo copies): ${c.ejemploSubtemas}

ENFOQUE DE ${curso.toUpperCase()}
Contenido típico de los bloques (##) de este curso: ${c.subtemas.replace(/^son /, "")}
Dentro de cada subtema incluye, cuando corresponda, en ESTE ORDEN:
${listaNumerada(c.contenido)}
Reglas propias del curso:
${lista(c.especial)}
No agregues ${c.evitar}.

REDACCIÓN (estilo de apunte de pizarra)
- Escribe como en una pizarra: palabras clave, no oraciones. Evita las frases completas.
- Una viñeta = una idea = un dato principal.
- La mayoría de viñetas tiene de 3 a 8 palabras. Máximo doce. Solo la definición inicial del tema puede llegar a quince.
- Cada viñeta trae información, no solo un nombre: cada tipo, parte, etapa o elemento lleva su rasgo, función o ejemplo. Prohibido listar categorías vacías («Tipo 1», «Tipo 2» sin decir qué los distingue).
- Usa estos formatos cuando correspondan (solo ilustran la forma, no el contenido):
  «Género: narrativo» → etiqueta: dato
  «Mackandal (primera revolución)» → nombre (rasgo)
  «1808 → invade España» → fecha → hecho
  «Sincretismo cultural: amerindia + africana + europea» → etiqueta: elementos unidos con símbolos
  «Haitianos (tradición) vs franceses (colonización)» → contraste
- Una lista de elementos cortos (principios, tipos, partes) va en viñetas separadas, cada una con solo su nombre y, si hace falta, un dato mínimo.
- No expliques ni justifiques: nada de «esto significa que», «se caracteriza por», «se refiere a».
- Resalta en **negrita** como máximo un término clave por viñeta.
- No repitas información entre viñetas ni entre subtemas.
- Los pasos de un procedimiento o de un ejemplo resuelto van numerados, un paso por línea.
- La primera vez que uses una sigla, escribe su significado completo: Organización de las Naciones Unidas (ONU).
- Escribe los nombres de personas completos, sin iniciales; si no estás seguro del nombre completo, usa solo el apellido.
- No inventes datos ni clasificaciones. Si no estás seguro de un dato, omítelo.
- No presentes como absoluto lo que solo ocurre en general.
- Brevedad = frases cortas, NO menos contenido: cubre todo lo que el examen puede pedir de este tema (todos los tipos, partes, etapas, casos, ejemplos y datos). Un tema grande da apuntes largos y uno pequeño, cortos. Acorta las viñetas, nunca los datos.

SÍMBOLOS PARA RELACIONAR IDEAS
Usa solo estos, con estos significados, y ningún otro para relacionar ideas:
= igual · → produce · ⊃ contiene · ∈ pertenece · ⇒ causa o implica · ✓ requiere · ✗ carece · + más · ↑ aumenta · ↓ disminuye · ≠ diferente · ≈ similar${notaFormulas}

${bloqueEjemplo}FORMATO DE SALIDA
- Solo los apuntes, en Markdown, listos para copiar.
- Sin introducción, sin conclusión, sin tablas y sin explicaciones fuera de los apuntes.

CONTROL FINAL
Antes de responder comprueba que: desarrollaste solo «${tema}»; cada título es corto y de un solo subtema; no hay secciones genéricas; cada viñeta tiene una sola idea, es breve y no es una oración completa; usaste solo los símbolos permitidos; no hay fuentes ni citas; no falta ningún tipo, parte, etapa, ejemplo ni dato de este tema que el examen suele evaluar; ninguna viñeta es solo un nombre sin información; y no incluiste contenido que sea de otro tema del temario.`;
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