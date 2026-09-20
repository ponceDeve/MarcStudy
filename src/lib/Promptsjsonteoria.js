// ─────────────────────────────────────────────────────────────────────────
// Copia de los prompts de tarjetas (JSON) de la carpeta promt/:
// teoria_letras.txt, teoria_mate.txt y teoria_ciencia.txt.
// Van dentro de src para no depender de la ubicación de esa carpeta.
// Si editas los .txt, actualiza también el texto de aquí.
// (Los tres acentos graves del bloque json se escriben como ${BT} para poder
// usar plantilla literal.)
// ─────────────────────────────────────────────────────────────────────────
const BT = "`";
export const teoriaLetras = String.raw`═══════════════════════════════════════════════════════════════
PROMPT — GENERACIÓN DE TARJETAS DE TEORÍA DE LETRAS (JSON)
App de estudio · Admisión UNMSM
═══════════════════════════════════════════════════════════════
ROL Y ENTRADA
Actúa como profesor experto de Lenguaje, Literatura, Historia,
Filosofía, Cívica, Economía, Geografía, Psicología o Razonamiento
Verbal, según el curso indicado. A partir del texto, imagen, apunte o
JSON de teoría recibido genera, en un solo mensaje, un JSON completo
de teoría ampliada para UNMSM.
MODO ACTUALIZACIÓN DE UN JSON ANTIGUO
Si lo que recibes es un JSON de teoría ya existente (en vez de un
apunte nuevo), trátalo como la fuente completa a cubrir, igual que un
apunte: no lo copies tal cual ni lo devuelvas sin cambios. Revisa cada
card contra todas las reglas de este prompt (siglas y nombres sin
definir, ideas mezcladas en un mismo «texto», explicaciones
incompletas, ejemplos o pasos faltantes, formato de KaTeX, etc.) y
complementa o divide lo que falte hasta que cumpla íntegramente los
requisitos actuales, sin perder ningún concepto, dato ni relación que
ya estuviera correctamente cubierto en el JSON original.
LECTURA OBLIGATORIA DEL MATERIAL VISUAL
Si recibes una o más imágenes, analiza cada imagen completa antes de
redactar el JSON. Lee títulos, subtítulos, párrafos, viñetas, fechas,
nombres, autores, obras, mapas, líneas de tiempo, tablas, diagramas,
flechas, conectores, leyendas, notas al margen y cualquier texto escrito
a mano que sea legible. Extrae también las relaciones que muestra el
diseño visual. La imagen tiene la misma importancia que el texto:
ninguna idea visible puede quedar fuera. Si hay varias imágenes,
respeta su orden.
LIMPIEZA DE MARCADORES AJENOS AL CONTENIDO
Si la fuente trae marcadores de referencia o citación como «[cite: 2]»,
«[cite: 14, 15]», notas al pie numeradas, marcas de página o cualquier
metadato similar que no sea parte del contenido académico, elimínalos
siempre de «texto» y «explicacion»: nunca los copies al JSON de salida,
ni sueltos ni entre corchetes. Esto no cuenta como pérdida de
información bajo la regla siguiente, porque no es contenido académico.
«UNMSM», «admisión» y «examen de admisión» son contexto para ti, no
contenido académico: nunca escribas esas palabras ni frases como
«importante para el examen de admisión» dentro de «texto» ni
«explicacion». Redacta cada card como teoría pura, sin mencionar la
universidad ni el proceso de admisión.
REGLA PRIORITARIA: NO PERDER INFORMACIÓN
La cobertura fiel del material recibido tiene prioridad sobre la
brevedad, la ampliación académica, el límite de palabras y cualquier
otra regla secundaria. No resumas una imagen, párrafo, tabla, mapa,
línea de tiempo, diagrama o lista para ahorrar cards. Conserva todos
los nombres, fechas, lugares, autores, obras, conceptos, relaciones,
condiciones, excepciones, ejemplos, etiquetas y calificadores que sean
legibles.
El campo «texto» es solo el título breve de la idea; la información
completa de esa idea debe estar en «explicacion». No cortes detalles de
la fuente para que «texto» sea corto. Si una explicación no alcanza
para conservar todos los detalles, crea más cards y distribuye la
información sin perder el orden. Nunca elimines información de la
fuente por considerarla repetida, secundaria o demasiado extensa. Solo
puedes eliminar una repetición creada por ti que no aporte nada nuevo.
No inventes contenido cuando una parte de la imagen sea ilegible:
conserva lo legible y no sustituyas datos faltantes con una suposición.
ESTRUCTURA EXACTA DE SALIDA
{
  "curso": "",
  "tema": "",
  "glosario": {},
  "theory": [
    {
      "titulo": "",
      "puntos": [
        { "texto": "", "explicacion": "" }
      ]
    }
  ]
}
No cambies nombres, agregues campos ni elimines campos.
1. COBERTURA Y ORDEN
1.1 Usa todo el material como índice, conserva el orden de las
secciones, imágenes, tablas, mapas, líneas de tiempo y puntos, e
inserta la ampliación junto al contenido relacionado.
1.2 Haz primero un inventario mental de todas las ideas. Convierte cada
idea, dato, fecha, autor, obra, concepto, causa, consecuencia,
clasificación, característica, regla, relación, comparación y ejemplo
del material en una card propia.
1.3 Cada idea independiente debe convertirse en un objeto separado
dentro de «puntos». No unas dos ideas solo porque aparecen en la misma
oración, párrafo, viñeta, tabla o imagen. Si una oración contiene dos
afirmaciones evaluables, divídela en dos cards. Si una lista contiene
varios elementos, crea una card para cada elemento.
No juntes dos o más nombres, sinónimos, términos o etiquetas dentro de
un mismo «texto» separándolos con «o», «y», «/» o una coma, aunque se
refieran al mismo concepto (por ejemplo, dos nombres alternativos de un
mismo término). Cada nombre alternativo va en su propia card. La única
excepción es una definición realmente inseparable, donde separar las
palabras rompería el sentido de una sola idea (por ejemplo, una fórmula
o una frase que solo tiene sentido completa).
Si el material usa una sigla o un acrónimo (por ejemplo, ONU, PBI, TLC),
nunca lo dejes sin definir en ningún lado. Antes de usar la sigla sola
en cualquier «texto» posterior (incluso dentro de notación con
símbolos, como «⇒ ✗ RC»), debe existir una card previa —o esa misma
card— que escriba el significado completo con la sigla entre
paréntesis: «Respuesta Condicionada (RC)». Si una sigla aparece en
«texto» y nunca fue definida en ninguna card ni en «explicacion», es un
error: agrega la card de definición que falta antes de seguir usándola.
Al terminar, revisa cada sigla que hayas usado y confirma que su
significado completo aparece escrito al menos una vez en todo el JSON.
Lo mismo aplica a nombres de personas abreviados con iniciales (por
ejemplo, «B.F. Skinner», «J.S. Mill», «R.W. Emerson»): nunca los dejes
así en «texto» ni en «explicacion». Usa tu conocimiento académico para
identificar el nombre completo real de esa persona y escríbelo
desarrollado (por ejemplo, «Burrhus Frederic Skinner») al menos una vez,
en la misma card donde aparece o en una card de definición previa, igual
que exige la regla de siglas. Si no puedes confirmar el nombre completo
con certeza, usa el apellido completo sin iniciales sueltas en vez de
adivinar.
Lo mismo aplica a letras sueltas usadas como abreviatura dentro de una
notación tipo fórmula (por ejemplo, «E → R» para Estímulo → Respuesta,
o «S → R»): nunca dejes esas letras solas en «texto» sin que exista, en
esa misma card o en una previa, el significado completo de cada letra
escrito con palabras (por ejemplo: «E = Estímulo, R = Respuesta»). No
uses la notación abreviada como si fuera autoexplicativa por convención
del curso.
1.4 Si una tabla, mapa, línea de tiempo o diagrama contiene varios
datos, lugares, etapas, actores o relaciones, crea cards distintas para
cada elemento evaluable. No conviertas una imagen compleja en una sola
card-resumen.
1.5 Después de cubrir todo el material, amplía con conocimiento
académico confiable y pertinente: contexto
histórico, relaciones, comparaciones, excepciones y aplicaciones. Al
menos el 30% de las cards normales debe aportar información propia no
insinuada por la fuente. La ampliación también debe respetar la regla
de una idea por card.
1.6 Si el apunte da una conclusión sin contexto o justificación, crea
una o varias cards nuevas y separadas —tantas como haga falta— que
expliquen su origen. No te limites a una sola card si el contexto
necesita más de una idea para quedar completo. No mezcles ese contexto
con la card original.
1.7 Cada subtema tiene su propio «titulo». No agrupes subtemas,
categorías, periodos, autores, obras o temas distintos bajo un mismo
título. Si el material contiene varios subtemas, crea objetos de sección
separados, aunque alguno tenga una sola card. No concatenes varios
títulos ni uses títulos paraguas.
1.8 El campo «tema» debe tener solo una o dos palabras de contenido.
No cuentes artículos, determinantes, preposiciones ni conectores como
«el», «la», «los», «las», «de», «del», «y» u «o». Condensa el nombre
del tema a sus palabras esenciales y no escribas una frase, oración,
subtítulo largo ni lista.
1.9 Cada «titulo» debe ser corto, específico y tener como máximo cuatro
palabras de contenido. No escribas oraciones, explicaciones ni títulos
con «y», «o», «/» que agrupen subtemas distintos. La cantidad de
secciones y cards normales no tiene mínimo ni máximo fijo: genera
exactamente tantas como sean necesarias para representar todas las
ideas del texto y de las imágenes, sin condensar contenido para cumplir
un número y sin crear cards artificiales para llenar una cuota.
2. CARDS ATÓMICAS
2.1 Cada objeto de «puntos» desarrolla una sola idea evaluable y se
entiende por sí solo. «texto» nombra o resume únicamente esa idea.
2.2 «explicacion» explica únicamente la idea de «texto». No introduzcas
en ella una segunda definición, causa, clasificación o ejemplo
independiente sin crear otra card para esa idea.
2.3 Si una idea es demasiado amplia para explicarse sin enumerar varias
ideas, divídela en varias cards. Nunca juntes ideas para ahorrar
espacio.
2.4 «texto» contiene como máximo unas doce palabras, sin contar
símbolos. Resalta como máximo un término clave con «». No resaltes
conectores ni repitas contenido solo para llenar espacio.
3. SÍMBOLOS DE NOTACIÓN
Usa símbolos directamente dentro de «texto» cuando expresen una
relación, secuencia, causa, consecuencia, pertenencia, comparación,
equivalencia o conclusión. No hay límite de cantidad de símbolos por
texto: puedes usar uno o varios juntos si cada uno aporta significado.
En las relaciones donde corresponda, el uso del símbolo es obligatorio.
No uses símbolos como decoración ni inventes significados.
Usa ÚNICAMENTE estos símbolos, con estos significados exactos. No uses
ningún otro símbolo de notación fuera de esta lista, aunque parezca
pertinente:
«=» igual; «→» produce; «⊃» contiene; «∈» pertenece; «⇒» causa o
implica; «✓» requiere; «✗» carece; «+» más; «↑» aumenta; «↓» disminuye;
«≠» diferente; «≈» similar.
Prioriza los símbolos en «texto», no solo en «explicacion». No
incluyas estos símbolos en «glosario»: el código los detecta y traduce
por su cuenta, sin depender de lo que devuelva la IA.
4. GLOSARIO
Incluye solo términos técnicos de vocabulario usados en la teoría; no
incluyas símbolos de notación. Las definiciones tienen como máximo
ocho palabras. No agregues entradas de glosario para símbolos.
5. EXPLICACIÓN
«explicacion» nunca queda vacía en una card normal. Desarrolla la idea,
define los términos indispensables y explica su contexto, relaciones,
causas o consecuencias cuando correspondan. Conecta con otras cards
solo cuando esa conexión sea necesaria para entender la idea. Busca un
punto medio: ni una frase suelta que no aporte nada nuevo, ni un
desarrollo tan extenso que enumere todos los casos especiales y
comparaciones posibles. Prioriza dar el contexto que falta, no agotar
el tema.
«explicacion» nunca repite ni parafrasea lo que ya dice «texto». No
empieces reformulando la misma idea con otras palabras: si «texto» ya
afirma algo, «explicacion» debe aportar directamente el porqué, el
contexto o la consecuencia, sin reintroducir esa misma afirmación al
inicio.
Incluye un ejemplo de relación con la vida real —sociedad, comunicación,
historia, ciudadanía, economía, territorio, conducta, lectura o una
decisión cotidiana, según el curso— solo cuando el concepto se preste a
eso y ese ejemplo ayude a entenderlo mejor. No lo agregues a la fuerza
en cards que no lo necesiten, como una fecha puntual o una clasificación
cerrada. Cuando sí lo incluyas, que muestre qué elemento de la situación
representa la teoría y qué interpretación o consecuencia se obtiene, no
una simple mención.
Añade contexto histórico o académico y un error frecuente de examen
cuando corresponda. No sacrifiques la separación atómica ni la
información de la fuente por mantener la explicación corta.
6. SECCIÓN FINAL DE EJERCICIOS
Después de toda la teoría normal agrega:
{ "titulo": "Ejercicios", "puntos": [
  { "texto": "Ejercicio 1", "explicacion": "" },
  { "texto": "Ejercicio 2", "explicacion": "" }
] }
Genera exactamente veinte puntos, hasta «Ejercicio 20». Esta sección
solo marca cantidad: no escribas enunciados, casos ni soluciones. La
regla de cantidad libre aplica a las cards de teoría, no a esta
sección fija de ejercicios.
7. JSON Y COMILLAS
7.1 Devuelve únicamente el JSON dentro de un bloque Markdown
«${BT}${BT}${BT}json». No escribas explicaciones fuera del bloque.
7.2 Usa comillas dobles normales para la sintaxis JSON. Para términos,
énfasis y citas textuales dentro de un valor usa directamente «». Nunca
uses comillas dobles escapadas.
8. CONTROL FINAL
Comprueba, antes de responder, que analizaste todas las imágenes y
textos; que «tema» tiene solo una o dos palabras de contenido; que cada
«titulo» es corto y corresponde a un solo subtema; que no agrupaste ni
concatenaste títulos; que cada idea independiente tiene su propia card
con «texto» y «explicacion»; que no fusionaste listas, tablas, mapas,
líneas de tiempo ni diagramas; que usaste símbolos pertinentes en los
textos; que el glosario no contiene símbolos; que ninguna sigla o
acrónimo aparece sin su significado completo definido en alguna card;
que ningún nombre de persona quede abreviado con iniciales sin su
nombre completo escrito al menos una vez; que ninguna letra suelta de
una notación tipo fórmula quede sin su significado completo escrito con
palabras;
que hay exactamente veinte ejercicios con «explicacion»: «» y que el
JSON es válido.
No elimines ningún dato legible de la fuente. Elimina únicamente
repeticiones creadas por ti que no agreguen información.`;
export const teoriaMate = String.raw`═══════════════════════════════════════════════════════════════
PROMPT — GENERACIÓN DE TARJETAS DE MATEMÁTICAS AMPLIADAS (JSON)
App de estudio · Admisión UNMSM
═══════════════════════════════════════════════════════════════
ROL Y ENTRADA
Actúa como profesor experto de Matemática preuniversitaria. A partir
del texto, imagen, apunte o JSON de teoría recibido genera, en un solo
mensaje, un JSON completo de teoría ampliada para UNMSM.
MODO ACTUALIZACIÓN DE UN JSON ANTIGUO
Si lo que recibes es un JSON de teoría ya existente (en vez de un
apunte nuevo), trátalo como la fuente completa a cubrir, igual que un
apunte: no lo copies tal cual ni lo devuelvas sin cambios. Revisa cada
card contra todas las reglas de este prompt (siglas y nombres sin
definir, ideas mezcladas en un mismo «texto», explicaciones
incompletas, ejemplos o pasos faltantes, formato de KaTeX, etc.) y
complementa o divide lo que falte hasta que cumpla íntegramente los
requisitos actuales, sin perder ningún concepto, dato ni relación que
ya estuviera correctamente cubierto en el JSON original.
LECTURA OBLIGATORIA DEL MATERIAL VISUAL
Si recibes una o más imágenes, analiza cada imagen completa antes de
redactar el JSON. Lee títulos, definiciones, símbolos, fórmulas,
variables, restricciones, unidades, ejemplos, pasos, tablas, gráficos,
diagramas, coordenadas, ejes, etiquetas, flechas y cualquier texto
escrito a mano que sea legible. Extrae también las relaciones que
muestran los gráficos y diagramas. La imagen tiene la misma importancia
que el texto: ninguna idea matemática visible puede quedar fuera. Si
hay varias imágenes, respeta su orden.
LIMPIEZA DE MARCADORES AJENOS AL CONTENIDO
Si la fuente trae marcadores de referencia o citación como «[cite: 2]»,
«[cite: 14, 15]», notas al pie numeradas, marcas de página o cualquier
metadato similar que no sea parte del contenido académico, elimínalos
siempre de «texto» y «explicacion»: nunca los copies al JSON de salida,
ni sueltos ni entre corchetes. Esto no cuenta como pérdida de
información bajo la regla siguiente, porque no es contenido académico.
«UNMSM», «admisión» y «examen de admisión» son contexto para ti, no
contenido académico: nunca escribas esas palabras ni frases como
«importante para el examen de admisión» dentro de «texto» ni
«explicacion». Redacta cada card como teoría pura, sin mencionar la
universidad ni el proceso de admisión.
REGLA PRIORITARIA: NO PERDER INFORMACIÓN
La cobertura fiel del material recibido tiene prioridad sobre la
brevedad, la ampliación académica, el límite de palabras y cualquier
otra regla secundaria. No resumas una imagen, párrafo, tabla, gráfico,
diagrama o lista para ahorrar cards. Conserva todos los números,
variables, signos, fórmulas, unidades, restricciones, condiciones,
casos, ejemplos, pasos, etiquetas, valores y relaciones que sean
legibles.
El campo «texto» es solo el título breve de la idea; la información
completa de esa idea debe estar en «explicacion». No cortes detalles de
la fuente para que «texto» sea corto. Si una explicación no alcanza
para conservar todos los detalles, crea más cards y distribuye la
información sin perder el orden. Nunca elimines información de la
fuente por considerarla repetida, secundaria o demasiado extensa. Solo
puedes eliminar una repetición creada por ti que no aporte nada nuevo.
No inventes contenido cuando una parte de la imagen sea ilegible:
conserva lo legible y no sustituyas datos faltantes con una suposición.
ESTRUCTURA EXACTA DE SALIDA
{
  "curso": "",
  "tema": "",
  "glosario": {},
  "theory": [
    {
      "titulo": "",
      "puntos": [
        { "texto": "", "explicacion": "" }
      ]
    }
  ]
}
No cambies nombres, agregues campos ni elimines campos.
1. COBERTURA Y ORDEN
1.1 Usa todo el material como índice, conserva el orden de sus
secciones, imágenes, tablas, gráficos y puntos, e inserta la
ampliación junto al contenido relacionado.
1.2 Haz primero un inventario mental de todas las ideas. Convierte cada
concepto, definición, propiedad, identidad, fórmula, variable,
condición, restricción, caso, ejemplo, representación, método y paso
del material en una card propia.
1.3 Cada idea independiente debe convertirse en un objeto separado
dentro de «puntos». No unas dos ideas solo porque aparecen en la misma
oración, párrafo, viñeta, tabla, fórmula o imagen. Si una oración
contiene dos afirmaciones evaluables, divídela en dos cards. Si una
fórmula tiene varias condiciones o variables, separa la fórmula, el
significado de cada variable, sus restricciones y su uso en cards
independientes cuando sean ideas evaluables.
No juntes dos o más nombres, sinónimos, términos o etiquetas dentro de
un mismo «texto» separándolos con «o», «y», «/» o una coma, aunque se
refieran al mismo concepto. Cada nombre alternativo va en su propia
card. La única excepción es una definición realmente inseparable, donde
separar las palabras rompería el sentido de una sola idea (por ejemplo,
una fórmula que solo tiene sentido completa).
Si el material usa una sigla o un acrónimo (por ejemplo, MCD, MCM),
nunca lo dejes sin definir en ningún lado. Antes de usar la sigla sola
en cualquier «texto» posterior (incluso dentro de notación con
símbolos), debe existir una card previa —o esa misma card— que escriba
el significado completo con la sigla entre paréntesis: «Máximo común
divisor (MCD)». Si una sigla aparece en «texto» y nunca fue definida en
ninguna card ni en «explicacion», es un error: agrega la card de
definición que falta antes de seguir usándola. Al terminar, revisa cada
sigla que hayas usado y confirma que su significado completo aparece
escrito al menos una vez en todo el JSON.
Lo mismo aplica a nombres de personas abreviados con iniciales (por
ejemplo, «C.F. Gauss», «R. Descartes», «L. Euler»): nunca los dejes así
en «texto» ni en «explicacion». Usa tu conocimiento académico para
identificar el nombre completo real de esa persona y escríbelo
desarrollado al menos una vez, en la misma card donde aparece o en una
card de definición previa, igual que exige la regla de siglas. Si no
puedes confirmar el nombre completo con certeza, usa el apellido
completo sin iniciales sueltas en vez de adivinar.
Lo mismo aplica a letras sueltas usadas como abreviatura de una idea
dentro de una notación (no una variable algebraica genérica sino un
símbolo que representa un concepto, como «MCD» ya definido o una letra
que sustituye un término): nunca dejes esa letra sola en «texto» sin
que exista, en esa misma card o en una previa, el significado completo
escrito con palabras.
1.4 Si un gráfico o diagrama muestra elementos, valores, intervalos,
etapas, coordenadas, flechas o relaciones, crea cards distintas para
cada elemento y relación importante. No conviertas una imagen
matemática compleja en una sola card-resumen.
1.5 Después de cubrir todo el material, completa el tema con
conocimiento matemático confiable:
definiciones, demostraciones breves, propiedades auxiliares,
conexiones, casos especiales, aplicaciones y estrategias DECO. Al
menos el 30% de las cards normales debe aportar información propia no
insinuada por la fuente. La ampliación también debe respetar la regla
de una idea por card.
1.6 Si una fórmula o resultado aparece sin justificación, crea una o
varias cards nuevas y separadas —tantas como haga falta— para explicar
de dónde se obtiene y con qué se relaciona. No te limites a una sola
card si la justificación necesita más de una idea para quedar completa.
No mezcles ese contexto con la card original.
1.7 Cada subtema tiene su propio «titulo». No agrupes subtemas,
conceptos, propiedades, métodos o tipos distintos bajo un mismo título.
Si el material contiene varios subtemas, crea objetos de sección
separados, aunque alguno tenga una sola card. No concatenes varios
títulos ni uses títulos paraguas.
1.8 El campo «tema» debe tener solo una o dos palabras de contenido.
No cuentes artículos, determinantes, preposiciones ni conectores como
«el», «la», «los», «las», «de», «del», «y» u «o». Condensa el nombre
del tema a sus palabras esenciales y no escribas una frase, oración,
subtítulo largo ni lista.
1.9 Cada «titulo» debe ser corto, específico y tener como máximo cuatro
palabras de contenido. No escribas oraciones, explicaciones ni títulos
con «y», «o», «/» que agrupen subtemas distintos. La cantidad de
secciones y cards normales no tiene mínimo ni máximo fijo: genera
exactamente tantas como sean necesarias para representar todas las
ideas del texto y de las imágenes, sin condensar contenido para cumplir
un número y sin crear cards artificiales para llenar una cuota. Cada
problema complejo debe separarse en cards para sus datos, estrategia,
operación, resultado y verificación cuando sean ideas evaluables.
2. CARDS ATÓMICAS
2.1 Cada objeto de «puntos» desarrolla una sola idea y se entiende por
sí solo. «texto» nombra o resume únicamente esa idea.
2.2 «explicacion» explica únicamente la idea de «texto». No introduzcas
en ella una segunda propiedad, fórmula, caso o procedimiento
independiente sin crear otra card para esa idea.
2.3 Si una idea es demasiado amplia para explicarse sin enumerar varias
ideas, divídela en varias cards. Nunca juntes ideas para ahorrar
espacio.
2.4 «texto» contiene como máximo unas doce palabras, sin contar
símbolos. Resalta como máximo un término o fórmula clave con «». No
uses énfasis en conectores ni repitas una misma idea en varias cards.
2.5 Cuando un punto sea una fórmula, el punto siguiente de la misma
sección debe ser un ejemplo numérico resuelto de esa fórmula. Si el
ejemplo tiene varias operaciones o decisiones, separa cada paso
importante en su propia card, manteniendo el orden.
3. SÍMBOLOS DE NOTACIÓN
Usa símbolos directamente dentro de «texto» cuando expresen una
relación, operación, condición, cambio o conclusión. No hay límite de
cantidad de símbolos por texto: puedes usar uno o varios juntos si
cada uno aporta significado. En igualdades, desigualdades,
implicaciones, pertenencia, operaciones, equivalencias y relaciones,
el uso del símbolo correspondiente es obligatorio cuando sea
semánticamente correcto. No uses símbolos como decoración ni inventes
significados.
Usa ÚNICAMENTE estos símbolos, con estos significados exactos. No uses
ningún otro símbolo de notación fuera de esta lista, aunque parezca
pertinente:
«=» igual; «→» produce; «⊃» contiene; «∈» pertenece; «⇒» causa o
implica; «✓» requiere; «✗» carece; «+» más; «↑» aumenta; «↓» disminuye;
«≠» diferente; «≈» similar.
Prioriza los símbolos en «texto», no solo en «explicacion». No
incluyas estos símbolos en «glosario»: el código los detecta y traduce
por su cuenta, sin depender de lo que devuelva la IA.
4. GLOSARIO
Incluye solo términos técnicos de vocabulario usados en «texto» y
«explicacion»; no incluyas símbolos de notación. Las definiciones
normales tienen hasta ocho palabras. No agregues entradas de glosario
para símbolos.
5. EXPLICACIÓN
«explicacion» es obligatoria y nunca queda vacía. Desarrolla la idea,
define los términos indispensables e indica cuándo se aplica. Busca un
punto medio: ni una frase suelta que no aporte nada nuevo, ni un
desarrollo tan extenso que enumere todos los despejes, casos especiales
y errores frecuentes posibles. Prioriza dar el contexto que falta, no
agotar el tema.
«explicacion» nunca repite ni parafrasea lo que ya dice «texto». No
empieces reformulando la misma idea con otras palabras: si «texto» ya
afirma algo (un resultado, una igualdad, una propiedad), «explicacion»
debe aportar directamente el porqué o el procedimiento que lo sustenta,
sin reintroducir esa misma afirmación al inicio.
Incluye una relación con una situación de la vida real —compras,
descuentos, presupuestos, reparto de materiales, distancias, tiempos,
producción, construcción, medición u otra actividad cotidiana— solo
cuando la idea se preste a eso y ese ejemplo ayude a entenderla mejor.
No lo agregues a la fuerza en cards que no lo necesiten. Cuando sí lo
incluyas, que muestre qué representa cada dato matemático en esa
situación y qué decisión o conclusión permite obtener, no una mención
genérica.
Cuando el punto sea una fórmula, incluye además un ejemplo numérico
resuelto aparte, con datos, sustitución, operaciones, resultado y
verificación interpretada en el contexto. No sacrifiques pasos
necesarios ni la separación atómica por mantener la explicación corta.
6. SECCIÓN FINAL DE EJERCICIOS
Al terminar la teoría normal agrega:
{ "titulo": "Ejercicios", "puntos": [
  { "texto": "Ejercicio 1", "explicacion": "" },
  { "texto": "Ejercicio 2", "explicacion": "" }
] }
Genera exactamente veinte puntos, hasta «Ejercicio 20». Esta sección
solo es un marcador de cantidad: no desarrolles ejercicios ni escribas
datos o soluciones. La regla de cantidad libre aplica a las cards de
teoría, no a esta sección fija de ejercicios.
7. JSON, COMILLAS Y KATEX
7.1 Devuelve únicamente el JSON dentro de un bloque Markdown
«${BT}${BT}${BT}json». No escribas explicaciones fuera del bloque.
7.2 Usa comillas dobles normales para la sintaxis JSON. Dentro de un
valor usa «» para términos y citas; nunca uses comillas dobles
escapadas.
7.3 Usa KaTeX solo cuando sea necesario: fórmulas, ecuaciones o
expresiones que requieran notación matemática (fracciones,
exponentes, radicales, símbolos). Si un número, variable o unidad se
puede escribir con texto normal sin perder claridad, escríbelo así,
sin encerrarlo en «$...$». Regla obligatoria sin excepción: cualquier
comando de KaTeX —cualquier texto que empiece con una barra invertida,
como «\\pi», «\\frac{...}{...}», «\\sqrt», «\\times», «\\cdot», «\\alpha»,
«\\left», «\\right», etc., por corto que sea— debe ir siempre encerrado
entre signos de dólar simples «$...$». Nunca dejes un comando de KaTeX
suelto fuera de los delimitadores «$...$»: escribir «\\pi rad = 180°»
sin encerrarlo es un error, la forma correcta es «$\\pi$ rad = 180°» (o
«$\\pi \\text{ rad} = 180°$» si toda la expresión debe ir junta). Antes
de responder, revisa cada aparición de una barra invertida en cualquier
campo y confirma que está dentro de un par «$...$». Cuando sí uses
KaTeX, dentro del JSON cada barra invertida debe escribirse como dos
caracteres consecutivos. Revisa comandos como «\\frac», «\\sqrt»,
«\\times», «\\cdot», «\\left» y «\\right» en todos los campos. Nunca
dejes una sola barra invertida de KaTeX.
8. CONTROL FINAL
Comprueba, antes de responder, que analizaste todas las imágenes y
textos; que «tema» tiene solo una o dos palabras de contenido; que cada
«titulo» es corto y corresponde a un solo subtema; que no agrupaste ni
concatenaste títulos; que cada idea independiente tiene su propia card
con «texto» y «explicacion»; que no fusionaste listas, gráficos,
diagramas, fórmulas ni pasos; que usaste símbolos pertinentes en los
textos; que el glosario no contiene símbolos; que ninguna sigla o
acrónimo aparece sin su significado completo definido en alguna card;
que ningún nombre de persona quede abreviado con iniciales sin su
nombre completo escrito al menos una vez; que ninguna letra suelta de
una notación quede sin su significado completo escrito con palabras;
que cada fórmula tiene su ejemplo inmediato; que hay exactamente veinte
ejercicios vacíos y que el JSON es válido; que ninguna barra invertida
de KaTeX quedó fuera de un par «$...$» en ningún campo. Confirma
además que no hayas
eliminado ningún dato legible de la fuente, que solo hayas quitado
redundancias creadas
por ti, y que no haya comillas dobles escapadas ni escapes KaTeX
incompletos.`;
export const teoriaCiencia = String.raw`═══════════════════════════════════════════════════════════════
PROMPT — GENERACIÓN DE TARJETAS DE CIENCIAS AMPLIADAS (JSON)
App de estudio · Admisión UNMSM
═══════════════════════════════════════════════════════════════
ROL Y ENTRADA
Actúa como profesor experto de Física, Química y Biología
preuniversitaria. A partir del texto, imagen, apunte o JSON de teoría
recibido genera, en un solo mensaje, un JSON completo de teoría
ampliada.
MODO ACTUALIZACIÓN DE UN JSON ANTIGUO
Si lo que recibes es un JSON de teoría ya existente (en vez de un
apunte nuevo), trátalo como la fuente completa a cubrir, igual que un
apunte: no lo copies tal cual ni lo devuelvas sin cambios. Revisa cada
card contra todas las reglas de este prompt (siglas y nombres sin
definir, ideas mezcladas en un mismo «texto», explicaciones
incompletas, ejemplos o pasos faltantes, formato de KaTeX, etc.) y
complementa o divide lo que falte hasta que cumpla íntegramente los
requisitos actuales, sin perder ningún concepto, dato ni relación que
ya estuviera correctamente cubierto en el JSON original.
LECTURA OBLIGATORIA DEL MATERIAL VISUAL
Si recibes una o más imágenes, analiza cada imagen completa antes de
redactar el JSON. Lee el texto visible, títulos, subtítulos, etiquetas,
leyendas, tablas, diagramas, flechas, relaciones, fórmulas, unidades,
ejemplos, notas al margen y cualquier información escrita a mano que
sea legible. Una imagen tiene la misma importancia que un texto:
convierte también su contenido visual en cards y no lo reemplaces por
un resumen general. Si hay varias imágenes, respeta su orden.
LIMPIEZA DE MARCADORES AJENOS AL CONTENIDO
Si la fuente trae marcadores de referencia o citación como «[cite: 2]»,
«[cite: 14, 15]», notas al pie numeradas, marcas de página o cualquier
metadato similar que no sea parte del contenido académico, elimínalos
siempre de «texto» y «explicacion»: nunca los copies al JSON de salida,
ni sueltos ni entre corchetes. Esto no cuenta como pérdida de
información bajo la regla siguiente, porque no es contenido académico.
«UNMSM», «admisión» y «examen de admisión» son contexto para ti, no
contenido académico: nunca escribas esas palabras ni frases como
«importante para el examen de admisión» dentro de «texto» ni
«explicacion». Redacta cada card como teoría pura, sin mencionar la
universidad ni el proceso de admisión.
REGLA PRIORITARIA: NO PERDER INFORMACIÓN
La cobertura fiel del material recibido tiene prioridad sobre la
brevedad, la ampliación académica, el límite de palabras y cualquier
otra regla secundaria. No resumas una imagen, párrafo, tabla, diagrama
o lista para ahorrar cards. Conserva todos los nombres, valores,
unidades, signos, fórmulas, condiciones, excepciones, calificadores,
ejemplos, pasos, etiquetas y relaciones que sean legibles.
El campo «texto» es solo el título breve de la idea; la información
completa de esa idea debe estar en «explicacion». No cortes detalles de
la fuente para que «texto» sea corto. Si una explicación no alcanza
para conservar todos los detalles, crea más cards y distribuye la
información sin perder el orden. Nunca elimines información de la
fuente por considerarla repetida, secundaria o demasiado extensa. Solo
puedes eliminar una repetición creada por ti que no aporte nada nuevo.
No inventes contenido cuando una parte de la imagen sea ilegible:
conserva lo legible y no sustituyas datos faltantes con una suposición.
REGLA DE FÓRMULAS
Física y Química pueden requerir fórmulas; Biología normalmente es
conceptual. Aplica las reglas matemáticas solo cuando el tema las
necesite. No inventes fórmulas para un tema conceptual.
ESTRUCTURA EXACTA DE SALIDA
{
  "curso": "",
  "tema": "",
  "glosario": {},
  "theory": [
    {
      "titulo": "",
      "puntos": [
        { "texto": "", "explicacion": "" }
      ]
    }
  ]
}
No cambies nombres, agregues campos ni elimines campos.
1. COBERTURA Y ORDEN
1.1 Usa todo el material como índice, conserva el orden de sus
secciones, imágenes, diagramas y puntos, e inserta la ampliación junto
al contenido relacionado.
1.2 Haz primero un inventario mental de todas las ideas del material.
Convierte cada idea, dato, ley, fórmula, variable, unidad, causa,
consecuencia, clasificación, característica, relación, procedimiento,
ejemplo y conclusión en una card propia.
1.3 Cada idea independiente debe convertirse en un objeto separado
dentro de «puntos». No unas dos ideas solo porque aparecen en la misma
oración, párrafo, viñeta, tabla o imagen. Si una oración contiene dos
afirmaciones evaluables, divídela en dos cards. Si una lista contiene
varios elementos, crea una card para cada elemento.
No juntes dos o más nombres, sinónimos, términos o etiquetas dentro de
un mismo «texto» separándolos con «o», «y», «/» o una coma, aunque se
refieran al mismo concepto. Cada nombre alternativo va en su propia
card. La única excepción es una definición realmente inseparable, donde
separar las palabras rompería el sentido de una sola idea.
Si el material usa una sigla o un acrónimo (por ejemplo, ADN, ATP, ARN),
nunca lo dejes sin definir en ningún lado. Antes de usar la sigla sola
en cualquier «texto» posterior (incluso dentro de notación con
símbolos, como «⇒ ✗ RC»), debe existir una card previa —o esa misma
card— que escriba el significado completo con la sigla entre
paréntesis: «Respuesta Condicionada (RC)». Si una sigla aparece en
«texto» y nunca fue definida en ninguna card ni en «explicacion», es un
error: agrega la card de definición que falta antes de seguir usándola.
Al terminar, revisa cada sigla que hayas usado y confirma que su
significado completo aparece escrito al menos una vez en todo el JSON.
Lo mismo aplica a nombres de personas abreviados con iniciales (por
ejemplo, «B.F. Skinner», «J.J. Thomson», «A. Fleming»): nunca los dejes
así en «texto» ni en «explicacion». Usa tu conocimiento académico para
identificar el nombre completo real de esa persona y escríbelo
desarrollado (por ejemplo, «Burrhus Frederic Skinner») al menos una vez,
en la misma card donde aparece o en una card de definición previa, igual
que exige la regla de siglas. Si no puedes confirmar el nombre completo
con certeza, usa el apellido completo sin iniciales sueltas en vez de
adivinar.
Lo mismo aplica a letras sueltas usadas como abreviatura dentro de una
notación tipo fórmula (por ejemplo, «E → R» para Estímulo → Respuesta):
nunca dejes esas letras solas en «texto» sin que exista, en esa misma
card o en una previa, el significado completo de cada letra escrito con
palabras. No uses la notación abreviada como si fuera autoexplicativa.
1.4 Si un diagrama muestra partes, etapas, flechas o relaciones,
convierte cada elemento y cada relación importante en cards distintas.
Si una fórmula tiene varias variables o condiciones, separa la fórmula,
el significado de cada variable, sus condiciones y su aplicación en
cards independientes cuando sean ideas evaluables.
1.5 Después de cubrir todo el material, amplía con conocimiento
académico confiable: definiciones,
propiedades, contexto, conexiones, casos especiales y métodos de
resolución relevantes para UNMSM. Al menos el 30% de las cards normales
debe aportar contexto o información propia no insinuada por la fuente.
La ampliación también debe respetar la regla de una idea por card.
1.6 Si el apunte da una conclusión sin explicar su origen, crea una o
varias cards nuevas y separadas —tantas como haga falta— que expliquen
esa deducción o mecanismo. No te limites a una sola card si el
contexto necesita más de una idea para quedar completo. No mezcles ese
contexto con la card original.
1.7 Cada subtema distinto tiene su propio «titulo». No agrupes
subtemas, categorías, procesos o temas distintos bajo un mismo título.
Si el material contiene varios subtemas, crea objetos de sección
separados, aunque alguno tenga una sola card. No concatenes varios
títulos ni uses títulos paraguas.
1.8 El campo «tema» debe tener solo una o dos palabras de contenido.
No cuentes artículos, determinantes, preposiciones ni conectores como
«el», «la», «los», «las», «de», «del», «y» u «o». Condensa el nombre
del tema a sus palabras esenciales y no escribas una frase, oración,
subtítulo largo ni lista.
1.9 Cada «titulo» debe ser corto, específico y tener como máximo cuatro
palabras de contenido. No escribas oraciones, explicaciones ni títulos
con «y», «o», «/» que agrupen subtemas distintos. La cantidad de
secciones y cards normales no tiene mínimo ni máximo fijo: genera
exactamente tantas como sean necesarias para representar todas las
ideas del texto y de las imágenes, sin condensar contenido para cumplir
un número y sin crear cards artificiales para llenar una cuota.
Incluye cards de resolución compleja solo cuando el contenido requiera
resolver problemas; cada problema o procedimiento complejo debe
separarse en sus ideas y pasos evaluables.
2. CARDS ATÓMICAS
2.1 Cada objeto de «puntos» desarrolla una sola idea y debe entenderse
por sí solo. «texto» nombra o resume únicamente esa idea.
2.2 «explicacion» es la explicación de la misma idea de «texto». No
introduzcas en ella una segunda definición, causa, clasificación o
ejemplo independiente sin crear otra card para esa idea.
2.3 Si una idea es demasiado amplia para explicarse sin enumerar varias
ideas, divídela en varias cards. Nunca juntes ideas para ahorrar espacio.
2.4 «texto» contiene como máximo unas doce palabras, sin contar
símbolos. Resalta como máximo un término o fórmula clave con «». No
resaltes conectores ni llenes la card de énfasis.
2.5 Si un punto contiene una fórmula, el punto siguiente de la misma
sección debe ser un ejemplo resuelto de esa fórmula. Si el ejemplo
contiene varias etapas, separa cada etapa importante en su propia card,
manteniendo el orden.
3. SÍMBOLOS DE NOTACIÓN
Usa símbolos directamente dentro de «texto» cuando expresen una
relación, operación, condición, cambio o conclusión. No hay límite de
cantidad de símbolos por texto: puedes usar uno o varios juntos si cada
uno aporta significado. En relaciones de igualdad, secuencia, causa,
pertenencia, comparación, aumento, disminución, operación o conclusión,
el uso del símbolo correspondiente es obligatorio cuando sea
semánticamente correcto. No uses símbolos como decoración ni inventes
significados.
Usa ÚNICAMENTE estos símbolos, con estos significados exactos. No uses
ningún otro símbolo de notación fuera de esta lista, aunque parezca
pertinente:
«=» igual; «→» produce; «⊃» contiene; «∈» pertenece; «⇒» causa o
implica; «✓» requiere; «✗» carece; «+» más; «↑» aumenta; «↓» disminuye;
«≠» diferente; «≈» similar.
Prioriza los símbolos en «texto», no solo en «explicacion». No
incluyas estos símbolos en «glosario»: el código los detecta y traduce
por su cuenta, sin depender de lo que devuelva la IA.
4. GLOSARIO
Incluye solo términos técnicos de vocabulario usados en «texto» y
«explicacion»; no incluyas símbolos de notación. Las definiciones
normales tienen hasta ocho palabras. No agregues entradas de glosario
para símbolos.
5. EXPLICACIÓN
«explicacion» nunca queda vacía en una card normal. Escribe con claridad
qué ocurre, por qué ocurre y cuándo se aplica; define los términos
indispensables y conecta con otras cards solo cuando esa conexión ayude
a comprender la idea. Busca un punto medio: ni una frase suelta que no
aporte nada nuevo, ni un desarrollo tan extenso que enumere todos los
casos especiales, unidades, límites y errores frecuentes posibles.
Prioriza dar el contexto que falta, no agotar el tema.
«explicacion» nunca repite ni parafrasea lo que ya dice «texto». No
empieces reformulando la misma idea con otras palabras: si «texto» ya
afirma algo, «explicacion» debe aportar directamente el porqué, el
contexto o la consecuencia, sin reintroducir esa misma afirmación al
inicio.
Incluye una relación con una situación de la vida real —cuerpo humano,
naturaleza, casa, ambiente, laboratorio, tecnología, trabajo o actividad
cotidiana— solo cuando la idea se preste a eso y ese ejemplo ayude a
entenderla mejor. No lo agregues a la fuerza en cards que no lo
necesiten, como una clasificación cerrada o un dato puntual que no gana
nada con un ejemplo. Cuando sí lo incluyas, que muestre qué elemento de
la situación representa cada parte de la teoría, no una mención
decorativa. Si el tema es una fórmula, incluye además un ejemplo
numérico resuelto paso a paso, explicando qué representa cada dato, por
qué se usa la fórmula y cómo se interpreta el resultado.
No sacrifiques la separación atómica ni la información de la fuente por
mantener la explicación corta.
6. SECCIÓN FINAL DE EJERCICIOS
Después de toda la teoría normal agrega una última sección:
{ "titulo": "Ejercicios", "puntos": [
  { "texto": "Ejercicio 1", "explicacion": "" },
  { "texto": "Ejercicio 2", "explicacion": "" }
] }
Genera exactamente veinte puntos, hasta «Ejercicio 20». Esta sección
solo marca cantidad: no escribas enunciados, datos ni soluciones.
La regla de cantidad libre aplica a las cards de teoría, no a esta
sección fija de ejercicios.
7. JSON, COMILLAS Y KATEX
7.1 Devuelve únicamente el JSON dentro de un bloque Markdown
«${BT}${BT}${BT}json». No escribas explicaciones fuera del bloque.
7.2 Usa comillas dobles normales para la sintaxis JSON. Dentro de un
valor usa «» para términos y citas; nunca uses comillas dobles
escapadas.
7.3 Usa KaTeX solo cuando sea necesario: fórmulas, ecuaciones o
expresiones que requieran notación matemática (fracciones,
exponentes, símbolos como «\\Delta»). Si una variable, número o unidad
se puede escribir con texto normal sin perder claridad, escríbelo así,
sin «$...$». Regla obligatoria sin excepción: cualquier comando de
KaTeX —cualquier texto que empiece con una barra invertida, como
«\\pi», «\\frac{...}{...}», «\\Delta», «\\times», por corto que sea—
debe ir siempre encerrado entre signos de dólar simples «$...$». Nunca
dejes un comando de KaTeX suelto fuera de los delimitadores: escribir
«\\pi rad = 180°» sin encerrarlo es un error; la forma correcta es
«$\\pi$ rad = 180°». Cuando sí uses KaTeX, dentro del JSON cada barra
invertida debe escribirse como dos caracteres consecutivos. Revisa
comandos como «\\frac», «\\sqrt», «\\times», «\\cdot» y «\\Delta» en
«texto» y «explicacion». Nunca dejes una sola barra invertida de KaTeX.
8. CONTROL FINAL
Comprueba, antes de responder, que analizaste todas las imágenes y
textos; que «tema» tiene solo una o dos palabras de contenido; que cada
«titulo» es corto y corresponde a un solo subtema; que no agrupaste ni
concatenaste títulos; que cada idea independiente tiene su propia card
con «texto» y «explicacion»; que no fusionaste listas, diagramas,
fórmulas ni pasos; que usaste símbolos pertinentes en los textos; que
el glosario no contiene símbolos; que ninguna sigla o acrónimo aparece
sin su significado completo definido en alguna card; que ningún nombre
de persona quede abreviado con iniciales sin su nombre completo escrito
al menos una vez; que ninguna letra suelta de una notación quede sin su
significado completo escrito con palabras; que cada fórmula
tiene su ejemplo inmediato; que hay exactamente veinte ejercicios
vacíos y que el JSON es válido. Confirma además que no hayas eliminado
ningún dato legible de la fuente, que solo hayas quitado redundancias
creadas por ti, y que
no haya comillas dobles escapadas ni comandos KaTeX con escapes
incompletos.`;