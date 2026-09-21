// ─────────────────────────────────────────────────────────────────────────
// Prompts de ChatGPT de la pestaña Temario de Repaso.
// Salida esperada: APUNTES PARA COPIAR EN EL CUADERNO (Markdown, sin JSON).
//
// El temario completo sirve como LÍMITE DE CONTENIDO.
// El filtro de examen decide qué conocimientos del tema realmente deben entrar.
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
export const PROMPTS_REPASO = {
  "Habilidad Lógico Matemático": {
    practico: true,
    rol: "Razonamiento Lógico Matemático",
    ejemploSubtemas:
      "para «Sucesiones» → Tipos de sucesión, Término general, Suma de términos.",
    subtemas:
      "son los tipos de problema, métodos o estrategias que realmente pertenezcan al tema.",
    contenido: [
      "condiciones del problema y qué se pide",
      "método de resolución",
      "cuándo conviene usar cada método",
      "patrones o relaciones útiles para reconocer el problema",
      "casos particulares que cambian la resolución"
    ],
    especial: [
      "Enseña cómo pensar y resolver, no teoría innecesaria.",
      "Incluye ejemplos resueltos solo cuando enseñen un método o tipo de problema realmente importante.",
      "No incluyas métodos que no correspondan al tema solicitado."
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
      "son las propiedades, casos, operaciones o clases de números que realmente correspondan al tema.",
    contenido: [
      "definición mínima necesaria",
      "propiedades aplicables",
      "reglas y condiciones de aplicación",
      "procedimientos de resolución",
      "casos particulares que cambian el procedimiento"
    ],
    especial: [
      "Indica cuándo se aplica una propiedad o regla solo si esa condición puede ser evaluada.",
      "Incluye ejemplos únicamente cuando enseñen un procedimiento importante."
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
      "son los conceptos, propiedades, métodos o casos algebraicos propios del tema.",
    contenido: [
      "concepto fundamental",
      "propiedades e identidades aplicables",
      "fórmulas necesarias",
      "condiciones y restricciones",
      "métodos de resolución",
      "casos especiales examinables"
    ],
    especial: [
      "Explica cuándo y cómo aplicar cada propiedad, fórmula o método cuando sea necesario.",
      "Incluye un ejemplo solo si muestra una aplicación importante."
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
      "son las figuras, elementos, teoremas, propiedades o relaciones propios del tema.",
    contenido: [
      "elementos y notación necesarios",
      "clasificaciones relevantes",
      "propiedades aplicables",
      "teoremas necesarios",
      "fórmulas necesarias",
      "relación entre propiedad y tipo de problema"
    ],
    especial: [
      "Como no hay dibujos, describe las figuras mediante sus elementos y relaciones.",
      "No demuestres teoremas salvo que la demostración sea indispensable para resolver o comprender una pregunta.",
      "Incluye ejemplos solo para tipos de problema importantes."
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
      "son las razones, funciones, identidades o tipos de problema propios del tema.",
    contenido: [
      "definición necesaria",
      "valores importantes cuando correspondan",
      "signos o condiciones cuando sean necesarios",
      "identidades y fórmulas aplicables",
      "procedimientos de transformación o resolución",
      "cuándo usar cada relación"
    ],
    especial: [
      "No listes fórmulas solo porque sean trigonométricas.",
      "Incluye una fórmula únicamente si pertenece realmente al tema y tiene utilidad examinable.",
      "Incluye ejemplos solo para procedimientos importantes."
    ],
    evitar: "historia, etimología ni curiosidades",
    formulas: true
  },
  "Economía": {
    rol: "Economía",
    ejemploSubtemas:
      "para «Mercado» → Tipos de mercado, Demanda y oferta, Equilibrio.",
    subtemas:
      "son los conceptos, elementos, tipos, agentes o procesos económicos propios del tema.",
    contenido: [
      "concepto",
      "características distintivas",
      "elementos o agentes",
      "clasificación necesaria",
      "funcionamiento",
      "relaciones de causa y consecuencia",
      "términos indispensables"
    ],
    especial: [
      "Marca con «≠» los conceptos que puedan confundirse.",
      "Incluye fórmulas solo si pertenecen al tema.",
      "Usa ejemplos reales solo cuando aclaren una diferencia o relación examinable."
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
      "son las estructuras, procesos, niveles, grupos o mecanismos propios del tema.",
    contenido: [
      "concepto necesario",
      "características distintivas",
      "estructura y función",
      "clasificación necesaria",
      "procesos y etapas",
      "mecanismos y relaciones",
      "terminología científica indispensable",
      "ejemplos o casos que permitan identificar el concepto"
    ],
    especial: [
      "Marca con «≠» las estructuras o procesos que puedan confundirse.",
      "Incluye solo características que permitan identificar, diferenciar o comprender algo examinable.",
      "No enumeres características por completar una lista."
    ],
    evitar:
      "historia del descubrimiento, etimología ni curiosidades salvo que sean indispensables para el tema",
    formulas: false
  },
  "Física": {
    practico: true,
    rol: "Física",
    ejemploSubtemas:
      "para «MRU» → Concepto, Ecuación del MRU, Encuentro y alcance.",
    subtemas:
      "son los fenómenos, magnitudes, leyes, relaciones o tipos de problema propios del tema.",
    contenido: [
      "concepto físico",
      "magnitudes necesarias con símbolo y unidad",
      "leyes y principios aplicables",
      "fórmulas necesarias",
      "condiciones de aplicación",
      "casos particulares que cambien la resolución"
    ],
    especial: [
      "Explica qué representa físicamente una fórmula solo cuando ayude a aplicarla.",
      "Incluye ejemplos únicamente para tipos de problema importantes.",
      "Indica unidades del Sistema Internacional cuando sean necesarias para resolver."
    ],
    evitar: "historia, biografías, etimología ni curiosidades",
    formulas: true
  },
  "Química": {
    rol: "Química",
    ejemploSubtemas:
      "para «Enlace químico» → Concepto, Tipos de enlace, Propiedades de los compuestos.",
    subtemas:
      "son los conceptos, clases, estructuras, reacciones, leyes o cálculos que realmente pertenezcan al tema.",
    contenido: [
      "concepto",
      "propiedades relevantes",
      "clasificación necesaria",
      "estructura",
      "nomenclatura y reglas aplicables",
      "reacciones propias del tema",
      "condiciones necesarias",
      "cálculos y procedimientos cuando correspondan"
    ],
    especial: [
      "Ajusta la proporción entre teoría y cálculo a la naturaleza del tema.",
      "No agregues propiedades o reacciones solo porque pertenezcan a la Química.",
      "Escribe fórmulas químicas en texto plano con subíndices."
    ],
    evitar: "historia, biografías, etimología ni curiosidades",
    formulas: true
  },
  "Geografía": {
    rol: "Geografía",
    ejemploSubtemas:
      "para «Relieve peruano» → Regiones del relieve, Formas del relieve, Factores.",
    subtemas:
      "son los elementos, regiones, factores o procesos geográficos propios del tema.",
    contenido: [
      "concepto",
      "características distintivas",
      "ubicación y límites cuando sean examinables",
      "factores y elementos",
      "clasificación necesaria",
      "distribución",
      "procesos y relaciones causales",
      "ejemplos concretos cuando permitan identificar el concepto"
    ],
    especial: [
      "Da cifras, nombres y ubicaciones solo cuando tengan utilidad examinable y estés seguro.",
      "Resalta relaciones entre factores y fenómenos cuando puedan preguntarse."
    ],
    evitar: "historia, etimología ni curiosidades",
    formulas: false
  },
  "Educación Cívica": {
    rol: "Educación Cívica",
    ejemploSubtemas:
      "para «Estado» → Elementos del Estado, Poderes del Estado, Organismos autónomos.",
    subtemas:
      "son los conceptos, instituciones, derechos, deberes, normas o procesos propios del tema.",
    contenido: [
      "concepto",
      "características distintivas",
      "elementos",
      "instituciones y competencias necesarias",
      "derechos y deberes",
      "normas relevantes",
      "situaciones de aplicación cuando sean examinables"
    ],
    especial: [
      "Marca con «≠» las instituciones o conceptos parecidos que puedan confundirse.",
      "Usa la legislación peruana vigente cuando el tema la requiera.",
      "No agregues artículos legales solo para ampliar el contenido."
    ],
    evitar: "etimología, historia ni curiosidades",
    formulas: false
  },
  "Psicología": {
    rol: "Psicología",
    ejemploSubtemas:
      "para «Memoria» → Tipos de memoria, Procesos, Olvido.",
    subtemas:
      "son los procesos, tipos, teorías, enfoques o etapas propios del tema.",
    contenido: [
      "concepto",
      "características distintivas",
      "procesos",
      "tipos o clases necesarios",
      "teorías o enfoques propios del tema",
      "autores indispensables",
      "situaciones de aplicación cuando ayuden a identificar el concepto"
    ],
    especial: [
      "Marca con «≠» los conceptos similares que puedan confundirse.",
      "Incluye autores solo cuando sean relevantes para identificar una teoría, enfoque o concepto.",
      "No conviertas cada autor relacionado con el tema en un apartado."
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
      "son los tipos de ejercicio o estrategias propias del tema.",
    contenido: [
      "definición mínima",
      "criterio para identificarlo",
      "procedimiento",
      "criterios para descartar alternativas",
      "casos frecuentes realmente útiles"
    ],
    especial: [
      "Enseña cómo identificar y resolver el ejercicio.",
      "Incluye ejemplos solo cuando representen un tipo de pregunta importante."
    ],
    evitar: "teoría extensa que no mejore la capacidad de resolución",
    formulas: false
  },
  "Lenguaje": {
    rol: "Lenguaje",
    ejemploSubtemas:
      "para «Tildación» → Reglas generales, Tilde diacrítica, Casos especiales.",
    subtemas:
      "son los elementos, clases, reglas o procedimientos lingüísticos propios del tema.",
    contenido: [
      "concepto necesario",
      "características distintivas",
      "elementos",
      "clasificación necesaria",
      "reglas aplicables",
      "excepciones relevantes",
      "procedimiento de análisis"
    ],
    especial: [
      "Aplica la norma vigente de la Real Academia Española (RAE).",
      "Usa ejemplos solo cuando aclaren una regla o excepción importante.",
      "No conviertas cada excepción existente en contenido obligatorio."
    ],
    evitar: "etimología, historia de la lengua ni curiosidades",
    formulas: false
  },
  "Literatura": {
    rol: "Literatura",
    ejemploSubtemas:
      "para «Géneros literarios» → Género épico, Género lírico, Género dramático.",
    subtemas:
      "son las corrientes, géneros, épocas, autores u obras propios del tema.",
    contenido: [
      "concepto o ubicación necesaria",
      "características distintivas",
      "especies o subgéneros cuando correspondan",
      "recursos o rasgos identificadores",
      "representantes importantes",
      "obras importantes",
      "tema o argumento cuando permita identificar la obra"
    ],
    especial: [
      "Usa el formato autor → obra → rasgo cuando sea útil.",
      "Incluye contexto histórico o biográfico solo cuando permita identificar una corriente, autor u obra.",
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
      "son las etapas, procesos, civilizaciones, revoluciones o conflictos propios del tema.",
    contenido: [
      "ubicación temporal",
      "contexto necesario",
      "causas",
      "hechos principales",
      "consecuencias",
      "personajes indispensables",
      "conceptos necesarios"
    ],
    especial: [
      "Verifica las fechas antes de incluirlas.",
      "Usa cronología cuando ayude a diferenciar acontecimientos.",
      "No agregues hechos de otros temas del temario."
    ],
    evitar: "anécdotas, biografías extensas ni curiosidades",
    formulas: false
  },
  "Historia del Perú": {
    rol: "Historia del Perú",
    ejemploSubtemas:
      "para «Tahuantinsuyo» → Organización política, Organización económica, Expansión.",
    subtemas:
      "son los periodos, culturas, procesos o dimensiones históricas propias del tema.",
    contenido: [
      "ubicación temporal y espacial",
      "contexto necesario",
      "organización política cuando corresponda",
      "organización social cuando corresponda",
      "economía cuando corresponda",
      "cultura cuando corresponda",
      "causas, hechos y consecuencias cuando correspondan",
      "personajes indispensables"
    ],
    especial: [
      "Incluye solo las dimensiones que realmente formen parte del tema.",
      "No mezcles periodos, culturas o procesos de otros temas.",
      "Verifica las fechas antes de incluirlas."
    ],
    evitar: "anécdotas, biografías extensas ni curiosidades",
    formulas: false
  },
  "Filosofía": {
    rol: "Filosofía",
    ejemploSubtemas:
      "para «Teoría del conocimiento» → Racionalismo, Empirismo, Criticismo.",
    subtemas:
      "son los problemas, corrientes, autores o posturas propios del tema.",
    contenido: [
      "problema filosófico",
      "concepto",
      "postura o corriente",
      "autor y postura",
      "planteamientos principales",
      "contrastes entre posturas cuando sean necesarios",
      "aplicación cuando permita identificar una postura"
    ],
    especial: [
      "Escribe nombres completos cuando estés seguro.",
      "Menciona obras solo cuando sean parte del contenido examinable.",
      "No conviertas cada autor relacionado con el tema en contenido obligatorio."
    ],
    evitar: "etimología, biografías extensas ni historia innecesaria",
    formulas: false
  }
};
// ─────────────────────────────────────────────────────────────────────────
// Apuntes reales de pizarra como modelo de estilo y brevedad.
// ─────────────────────────────────────────────────────────────────────────
const EJEMPLOS_APUNTE = {
  "Literatura": `# Alejo Carpentier
## Etapa
- Nueva narrativa hispanoamericana
- Narrativa y ensayo
- Técnicas modernas
- Influencia del surrealismo
- Sincretismo: amerindia + africana + europea
- Tradición + hechos históricos
- Lo real maravilloso
## El reino de este mundo
- Género: narrativo
- Especie: novela
- Narrador: omnisciente
- Narración: lineal-cronológica + episódica
## Personajes
- Haitianos → tradición
  - Ti Noel → tradición colectiva
  - Mackandal → primera revolución
  - Boukman → revolución armada
- Franceses → colonización
  - Monsieur Lenormand de Mezy → cobardía
  - Paulina Bonaparte → decadencia francesa
## Tema
- Principal: búsqueda de libertad
- Secundarios: esclavitud, opresión, tiranía`,
  "Historia Universal": `# Imperio napoleónico
## III Coalición
- Trafalgar → derrota franco-española
- Austerlitz → gran victoria
- Confederación del Rin
## IV Coalición
- Decreto de Berlín → bloqueo continental
- Tilsit → acuerdo con Alejandro I
## Península ibérica
- 1807 → invade Portugal
- 1808 → invade España
## Campaña de Rusia
- 1812 → inicio del fin
- Tierra quemada
## VI Coalición
- Leipzig → derrota napoleónica
- Elba → exilio`,
  "Biología": `# Histología vegetal
## Concepto
- Rama de la Botánica
- Estudia tejidos vegetales
- Tejido → células similares + función específica
## Tejidos juveniles
- Células indiferenciadas
- Mitosis constante
- Meristemo apical → crecimiento longitudinal
- Meristemo lateral → crecimiento en grosor
## Tejidos adultos
- Protectores
  - Epidermis → revestimiento
  - Estomas → intercambio gaseoso + transpiración
- Conductores
  - Xilema → savia bruta
  - Floema → savia elaborada`,
  "Física": `# Ondas mecánicas
## Concepto
- Propagación de perturbaciones
- Transportan energía, no materia
- Requieren medio material
## Tipos
- Longitudinal → vibración paralela
- Transversal → vibración perpendicular
## Elementos
- Cresta → punto más alto
- Valle → punto más bajo
- λ → longitud de onda
- A → amplitud
- v = λ/T = λ·f`,
  "Química": `# Estequiometría
## Definición
- Relaciones cuantitativas de una reacción
- Moles, masa y volumen
## Conservación de masa
- Σ masa reactantes = Σ masa productos
- O₂ + 2 H₂ → 2 H₂O
## Reactivos
- Reactivo limitante → se consume primero
- Reactivo en exceso → queda sobrante`
};
// ─────────────────────────────────────────────────────────────────────────
// Respaldo para cursos sin configuración propia.
// ─────────────────────────────────────────────────────────────────────────
const PROMPT_GENERICO = {
  rol: "",
  ejemploSubtemas:
    "para «Géneros literarios» → Género épico, Género lírico, Género dramático.",
  subtemas:
    "son únicamente los subtemas que realmente pertenezcan al tema.",
  contenido: [
    "concepto necesario",
    "características distintivas",
    "clasificación necesaria",
    "procesos o procedimientos cuando correspondan",
    "ejemplos solo cuando sean examinables"
  ],
  especial: [
    "Adapta el contenido a la naturaleza del curso.",
    "Aplica siempre el filtro de relevancia para examen."
  ],
  evitar: "etimología, historia, curiosidades y teoría innecesaria",
  formulas: false
};
// ─────────────────────────────────────────────────────────────────────────
// Marca el tema actual dentro del temario.
// ─────────────────────────────────────────────────────────────────────────
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
        .map((t) =>
          t === tema
            ? `>>> TEMA ACTUAL: ${t} <<<`
            : t
        );
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
// ─────────────────────────────────────────────────────────────────────────
// PROMPT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
export function construirPromptRepaso({
  curso,
  tema,
  temarioCurso,
  paraJson = false
}) {
  const c = PROMPTS_REPASO[curso] || PROMPT_GENERICO;
  const rol = c.rol || curso;
  const notaFormulas = c.formulas
    ? `\n${NOTA_FORMULAS}`
    : "";
  const bloqueEnfoque = c.practico
    ? `En este curso los conocimientos se evalúan principalmente mediante aplicación.
Prioriza procedimientos, reglas, fórmulas, propiedades, condiciones y casos que permitan resolver.
Reduce la teoría a lo necesario para aplicar el conocimiento.`
    : `En este curso pueden evaluarse conocimientos conceptuales.
Prioriza definiciones exactas, características distintivas, clasificaciones, relaciones, diferencias y datos concretos realmente necesarios.`;
  const ejemplo = EJEMPLOS_APUNTE[curso];
  const bloqueEjemplo = ejemplo
    ? `EJEMPLO DE ESTILO
Solo muestra la densidad y brevedad esperadas.
NO copies su contenido ni su estructura si no corresponde al tema.
${ejemplo}`
    : "";
  const avisoJson = paraJson
    ? `
Este es el PASO 1 de 3.
Solo escribe los apuntes.
No conviertas todavía a JSON.`
    : "";
  return `Actúa como profesor experto de ${rol} a nivel preuniversitario.
Escribe APUNTES PARA COPIAR EN EL CUADERNO sobre el tema «${tema}» del curso «${curso}».
Usa información confiable, pero NO muestres el proceso de investigación ni fuentes:
nada de links, citas, notas ni marcadores como [1] o [cite].
No menciones la universidad, academias, profesores ni el examen.
${avisoJson}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILTRO DE CONTENIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tu trabajo es SELECCIONAR, no resumir toda la teoría existente.
Incluye un conocimiento solo si cumple al menos una función clara:
- puede convertirse razonablemente en una pregunta;
- es necesario para resolver una pregunta;
- permite identificar o diferenciar una respuesta;
- es una regla, propiedad, fórmula, condición o excepción aplicable;
- es indispensable para comprender otro conocimiento fundamental.
OMITE información que solo sea verdadera, relacionada, académicamente conocida, anecdótica, secundaria o incluida para hacer el apunte más completo.
«COMPLETO» significa cubrir los conocimientos FUNDAMENTALES Y EXAMINABLES del tema, no toda la teoría existente.
No existe una cantidad mínima de contenido:
tema pequeño → pocos apuntes;
tema amplio → más apuntes solo si realmente hay más contenido examinable.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NIVEL Y ENFOQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nivel preuniversitario.
${bloqueEnfoque}
Si dudas de la relevancia de un dato, omítelo.
No agregues contenido universitario, anecdótico o innecesario.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALCANCE DEL TEMARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Temario completo de ${curso.toUpperCase()}:
${marcarTemaActual(temarioCurso, tema)}
El temario funciona como LÍMITE DE CONTENIDO.
Desarrolla únicamente:
«${tema}»
Los demás temas sirven solo para conocer los límites y evitar mezclar contenidos.
Está prohibido desarrollar otros temas, aunque estén relacionados.
Si un concepto pertenece principalmente a otro tema → OMITIR.
Si pertenece realmente a «${tema}» y es fundamental/examinable → INCLUIR.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLASIFICACIONES, PROPIEDADES Y EJEMPLOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No incluyas automáticamente todas las clasificaciones existentes.
Una clasificación debe ser:
- propia del tema;
- fundamental;
- examinable.
No enumeres todas las propiedades conocidas.
Incluye una propiedad solo si sirve para identificar, diferenciar, resolver o comprender el tema.
Los ejemplos no son obligatorios.
Inclúyelos solo si:
- enseñan un procedimiento;
- permiten identificar un concepto;
- aclaran una diferencia;
- representan un tipo de pregunta importante.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FÓRMULAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No agregues fórmulas que no pertenezcan directamente a «${tema}».
Cada fórmula debe tener una función clara dentro del tema.
${notaFormulas}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUCTURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Empieza exactamente con:
# ${tema}
Después crea únicamente los subtemas que realmente necesite «${tema}».
Cada subtema puede llevar un título ##.
No existe número mínimo ni máximo de subtemas.
No crees secciones artificiales ni categorías solo para completar una lista.
No uses secciones genéricas como:
- Diferencias
- Claves para examen
- Ideas clave
- Fórmula para recordar
- Resumen
- Conclusión
- Recomendaciones
- Aplicaciones
- Limitaciones
salvo que realmente formen parte del contenido del tema.
No dividas artificialmente un tema pequeño.
«Concepto» solo aparece si realmente hace falta definir el tema.
${c.ejemploSubtemas}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENFOQUE DE ${curso.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Los posibles bloques de este curso son:
${c.subtemas}
Esto NO significa que debas usarlos todos.
Contenido prioritario:
${listaNumerada(c.contenido)}
Reglas específicas:
${lista(c.especial)}
No agregues ${c.evitar}.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDACCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Escribe como apuntes de pizarra.
- Una viñeta = una idea.
- Frases cortas.
- Palabras clave.
- Sin párrafos largos.
- Sin explicaciones innecesarias.
- Sin repetición.
- Sin relleno.
La mayoría de viñetas debe tener entre 3 y 8 palabras.
Máximo aproximado: 12 palabras.
Solo una definición inicial puede ser más larga si resulta necesaria.
Usa:
- etiqueta: dato
- concepto → rasgo
- causa → consecuencia
- fecha → hecho
- estructura → función
- A ≠ B
Resalta en **negrita** como máximo un término clave por viñeta.
No repitas información entre viñetas ni subtemas.
Los procedimientos van numerados.
Cada paso ocupa una línea.
La primera vez que aparezca una sigla, escribe su significado completo.
No inventes datos.
Si no estás seguro de un dato concreto, omítelo.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SÍMBOLOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usa únicamente estos símbolos:
= igual
→ produce
⊃ contiene
∈ pertenece
⇒ causa o implica
✓ requiere
✗ carece
+ más
↑ aumenta
↓ disminuye
≠ diferente
≈ similar
${notaFormulas}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EJEMPLO DE ESTILO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bloqueEjemplo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTROL FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Antes de responder comprueba:
1. ¿Todo pertenece realmente a «${tema}»?
2. ¿Hay contenido de otro tema?
3. ¿Cada viñeta tiene utilidad para responder o resolver?
4. ¿Hay información verdadera pero innecesaria?
5. ¿Hay clasificaciones o propiedades secundarias?
6. ¿Hay ejemplos que no enseñen algo importante?
7. ¿Hay fórmulas innecesarias?
8. ¿Hay repeticiones?
9. ¿Se cubrieron los conocimientos fundamentales y examinables?
10. ¿El tamaño corresponde a la cantidad real de contenido?
Si algo no supera el filtro → ELIMÍNALO.
No aumentes la extensión para parecer completo.
No reduzcas contenido fundamental para hacerlo corto.
El resultado debe ser:
COMPLETO EN LO EXAMINABLE + SIN TEORÍA EXTRA.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE SALIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Solo los apuntes.
Markdown.
Listos para copiar.
Sin introducción.
Sin conclusión.
Sin fuentes.
Sin citas.
Sin explicaciones fuera de los apuntes.`;
}
// ─────────────────────────────────────────────────────────────────────────
// PASO 2: convertir los apuntes del paso 1 a JSON.
// ─────────────────────────────────────────────────────────────────────────
const CURSOS_JSON_MATE = [
  "Habilidad Lógico Matemático",
  "Aritmética",
  "Álgebra",
  "Geometría",
  "Trigonometría"
];
const CURSOS_JSON_CIENCIA = [
  "Biología",
  "Física",
  "Química"
];
function promptJsonBase(curso) {
  if (CURSOS_JSON_MATE.includes(curso)) {
    return teoriaMate;
  }
  if (CURSOS_JSON_CIENCIA.includes(curso)) {
    return teoriaCiencia;
  }
  return teoriaLetras;
}
export function construirPromptJson({ curso, tema }) {
  return `CURSO: ${curso}
TEMA: ${tema}
PASO 2 de 3:
Convierte en el JSON indicado por este prompt los apuntes que escribiste en tu mensaje anterior.
Ese texto anterior es el material recibido y debe cubrirse completo.
NO agregues conocimientos nuevos.
NO completes los apuntes con teoría externa.
NO agregues información que no aparezca en los apuntes anteriores.
Devuelve únicamente el JSON.
Sigue todas las reglas de abajo.
Después te pediré el examen; no lo hagas todavía.
${promptJsonBase(curso)}`;
}
// ─────────────────────────────────────────────────────────────────────────
// PASO 3: examen + ejercicios a partir del JSON de teoría.
// ─────────────────────────────────────────────────────────────────────────
function promptExamenBase(curso) {
  if (CURSOS_JSON_MATE.includes(curso)) {
    return examenMate;
  }
  if (CURSOS_JSON_CIENCIA.includes(curso)) {
    return examenCiencia;
  }
  return examenLetras;
}
export function construirPromptExamen({ curso, tema }) {
  return `CURSO: ${curso}
TEMA: ${tema}
PASO 3 de 3:
Usa como entrada EXCLUSIVAMENTE el JSON de teoría que generaste en tu mensaje anterior.
Ese JSON es el material que recibes.
NO agregues teoría nueva que no esté representada en el JSON.
NO amplíes el tema con conocimientos externos.
Genera el examen y los ejercicios siguiendo todas las reglas de abajo, incluido el flujo de dos mensajes.
${promptExamenBase(curso)}`;
}
// ─────────────────────────────────────────────────────────────────────────
// Copiar al portapapeles.
// ─────────────────────────────────────────────────────────────────────────
export async function copiarTexto(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (e) {
    console.error(
      "Error copiando con la API del portapapeles:",
      e
    );
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
    console.error(
      "Error copiando con el respaldo:",
      e
    );
    return false;
  }
}