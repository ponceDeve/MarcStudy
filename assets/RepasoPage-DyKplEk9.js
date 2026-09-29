import{f as e,g as t,r as n,t as r,v as i}from"./AppHeader-DxylcgVS.js";import{A as a,D as o,E as s,F as c,I as ee,L as l,M as u,N as te,O as d,P as ne,R as re,T as ie,j as ae,k as oe,v as se}from"./index-BprcMrQO.js";import{t as f}from"./coursesSemanas-C-uNaywv.js";var p=i(t(),1),m="`",h=String.raw`═══════════════════════════════════════════════════════════════
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
6. SIN SECCIÓN DE EJERCICIOS
No agregues ninguna sección «Ejercicios» ni marcadores «Ejercicio N». Los
ejercicios se generan aparte, en el paso del examen. El JSON termina con
la última sección de teoría.
7. JSON Y COMILLAS
7.1 Devuelve únicamente el JSON dentro de un bloque Markdown
«${m}${m}${m}json». No escribas explicaciones fuera del bloque.
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
que no agregaste ninguna sección «Ejercicios» y que el JSON es válido.
No elimines ningún dato legible de la fuente. Elimina únicamente
repeticiones creadas por ti que no agreguen información.`,ce=String.raw`═══════════════════════════════════════════════════════════════
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
Cuando el punto sea una fórmula o una regla operativa, «explicacion»
debe priorizar el desarrollo numérico sobre la descripción verbal de la
regla: no repitas la regla con otras palabras, resuélvela con números.
Incluye, dentro de esa misma «explicacion», un ejemplo numérico
resuelto con datos, sustitución, cada operación y el resultado,
interpretado en el contexto. Desarrolla tantos pasos como el
procedimiento realmente necesite para quedar completo: no te limites a
un número fijo de pasos ni recortes operaciones para acortar la
explicación, y tampoco inventes pasos de más si el procedimiento es
corto. No sacrifiques pasos necesarios ni la separación atómica por
mantener la explicación corta.
6. SIN SECCIÓN DE EJERCICIOS
No agregues ninguna sección «Ejercicios» ni marcadores «Ejercicio N». Los
ejercicios se generan aparte, en el paso del examen. El JSON termina con
la última sección de teoría.
7. JSON, COMILLAS Y KATEX
7.1 Devuelve únicamente el JSON dentro de un bloque Markdown
«${m}${m}${m}json». No escribas explicaciones fuera del bloque.
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
que cada fórmula tiene su ejemplo inmediato; que no agregaste ninguna sección «Ejercicios» y que el JSON es válido; que ninguna barra invertida
de KaTeX quedó fuera de un par «$...$» en ningún campo. Confirma
además que no hayas
eliminado ningún dato legible de la fuente, que solo hayas quitado
redundancias creadas
por ti, y que no haya comillas dobles escapadas ni escapes KaTeX
incompletos.`,g=String.raw`═══════════════════════════════════════════════════════════════
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
decorativa.
Si el punto es una fórmula (Física o Química), «explicacion» debe
priorizar el desarrollo numérico sobre la descripción verbal de la
fórmula: no repitas la fórmula con otras palabras, resuélvela con
números. Incluye, dentro de esa misma «explicacion», un ejemplo
numérico resuelto con datos, sustitución, cada operación y el
resultado, explicando qué representa cada dato y cómo se interpreta el
resultado. Desarrolla tantos pasos como el procedimiento realmente
necesite para quedar completo: no te limites a un número fijo de pasos
ni recortes operaciones para acortar la explicación, y tampoco
inventes pasos de más si el procedimiento es corto.
En Biología, que normalmente no tiene fórmulas, la explicación va en
prosa —qué ocurre, por qué ocurre y cuándo se aplica— sin forzar un
formato de pasos.
No sacrifiques la separación atómica ni la información de la fuente por
mantener la explicación corta.
6. SIN SECCIÓN DE EJERCICIOS
No agregues ninguna sección «Ejercicios» ni marcadores «Ejercicio N». Los
ejercicios se generan aparte, en el paso del examen. El JSON termina con
la última sección de teoría.
7. JSON, COMILLAS Y KATEX
7.1 Devuelve únicamente el JSON dentro de un bloque Markdown
«${m}${m}${m}json». No escribas explicaciones fuera del bloque.
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
tiene su ejemplo inmediato; que no agregaste ninguna sección «Ejercicios» y que el JSON es válido. Confirma además que no hayas eliminado
ningún dato legible de la fuente, que solo hayas quitado redundancias
creadas por ti, y que
no haya comillas dobles escapadas ni comandos KaTeX con escapes
incompletos.`,_=String.raw`═══════════════════════════════════════════════════════════════
PROMPT — GENERACIÓN DE EXAMEN DE LETRAS TIPO DECO (JSON)
App de estudio · Admisión UNMSM
═══════════════════════════════════════════════════════════════
ROL Y ENTRADA
Actúa como especialista en Lenguaje, Literatura, Historia, Filosofía, Cívica, Economía, Geografía, Psicología o Razonamiento Verbal, según el curso recibido, con nivel UNMSM. Recibirás un JSON de teoría con secciones («titulo») y, dentro de cada una, puntos con «texto» y «explicacion». No hay una sección «Ejercicios» ni marcadores «Ejercicio N»: los ejercicios los redactas tú (Bloque B).
FUENTE EXCLUSIVA DE CONOCIMIENTO
Toda pregunta, alternativa, explicación y ejercicio debe poder resolverse EXCLUSIVAMENTE con la teoría recibida en el JSON.
Puedes combinar varios puntos de la teoría, incluso puntos diferentes del mismo tema, pero no puedes introducir:
- conceptos no enseñados;
- autores no mencionados;
- obras no mencionadas;
- hechos no proporcionados;
- corrientes no incluidas;
- relaciones externas que el estudiante no tenga en la teoría.
La dificultad debe provenir de interpretar, relacionar y aplicar la teoría recibida, NO de introducir conocimientos nuevos.
Antes de construir cada pregunta, identifica internamente qué información del JSON permite resolverla. Si necesitas información que no aparece en la teoría, modifica la pregunta.
OBJETIVO PEDAGÓGICO PRIORITARIO
Evalúa comprensión, interpretación, transferencia, inferencia y juicio, no memoria literal.
El estudiante no debe acertar por reconocer una palabra, definición, nombre de autor, corriente, periodo o frase idéntica al apunte.
Cada pregunta del Bloque A corresponde únicamente al título que le toca y evalúa uno solo de sus puntos, pero debe transformar esa teoría en una situación DECO: caso, fragmento, evidencia, afirmación, comparación, situación comunicativa, hecho histórico, situación social, económica, geográfica o psicológica, o error conceptual que obligue a razonar.
FLUJO OBLIGATORIO DE DOS MENSAJES
1. Primer mensaje: enumera cada título en el orden recibido, con sus puntos numerados (número y «texto»). Calcula cuántas preguntas del Bloque A le corresponden según 1.1 y muestra una lista «Título — puntos — preguntas». Cierra con:
«Bloque A: X preguntas — Bloque B: 20 ejercicios — Total: X+20».
No redactes preguntas, alternativas, respuestas ni JSON.
2. Detente y espera la confirmación «genera json» o equivalente. En esa pausa el usuario puede pedir ajustes. Anótalos antes de continuar.
3. Segundo mensaje: entrega únicamente un objeto JSON con dos claves, «examen» (Bloque A) y «ejercicios» (Bloque B), como texto plano, directamente en el cuerpo de la respuesta, dentro de un bloque de código markdown, sin comentarios antes ni después.
Forma:
{ "examen": [ ... ], "ejercicios": [ ... ] }
1. BLOQUES Y CANTIDAD
1.1 BLOQUE A
Hay exactamente una pregunta por cada punto: un título de N puntos lleva N preguntas, una por punto y en el mismo orden.
Cada pregunta evalúa su propio punto mediante aplicación, interpretación o inferencia, nunca mediante definición directa. No fusiones varios puntos en una sola pregunta.
Usa únicamente información de los puntos del título.
Todas las preguntas del Bloque A son «opcion_multiple».
1.2 BLOQUE B
Crea EXACTAMENTE 20 ejercicios, sin ningún valor «null».
Ordénalos de dificultad creciente.
Usa los cuatro tipos de la sección 2 («opcion_multiple», «verdadero_falso», «completar» y «relacionar»), alternándolos a lo largo de los 20.
Cada ejercicio combina puntos de distintos títulos de toda la teoría recibida cuando esta tenga varios títulos, de modo que los 20 recorran toda la teoría.
Cada ejercicio debe integrar obligatoriamente varios elementos de la teoría recibida. No construyas ejercicios que dependan de un único punto aislado cuando el tema permita combinar más información.
La integración puede realizarse entre:
- conceptos;
- características;
- relaciones;
- causas y consecuencias;
- hechos y contexto;
- fragmentos y rasgos;
- procesos y resultados;
- evidencias e interpretaciones.
Progresión orientativa:
1–5:
integración de al menos 2 elementos de teoría.
6–10:
integración de 2 o 3 elementos y aplicación al contexto.
11–15:
integración de al menos 3 elementos con inferencia o relación causal.
16–20:
integración de 3 o más elementos con inferencia, transferencia, comparación, evaluación de evidencia o interpretación compleja.
No repitas consecutivamente la misma combinación de conceptos ni el mismo tipo de situación.
No introduzcas conocimientos externos al JSON.
No recibes marcadores «Ejercicio N»: esa expresión no debe aparecer ni parafrasearse en «q», «textoConEspacios» ni en ningún otro campo.
1.3 Los Bloques A y B van en arreglos separados («examen» y «ejercicios»).
1.4 CORRESPONDENCIA UNO A UNO
El arreglo «examen» debe tener exactamente tantos elementos como puntos de teoría recibidos, todos los de todos los títulos, en el mismo orden: la posición N del arreglo es la pregunta del punto N.
Cada posición lleva una pregunta. No uses «null» ni dejes ningún punto sin pregunta.
Ejemplo:
un título de 3 puntos: [pregunta, pregunta, pregunta].
El arreglo «ejercicios» tiene exactamente 20 elementos y ninguno es «null».
2. TIPOS Y CAMPOS EXACTOS
No inventes campos ni cambies estos nombres.
El Bloque A usa solo el tipo 2.1. El Bloque B usa los cuatro tipos (2.1, 2.2, 2.3 y 2.4).
2.1 Opción múltiple:
{ "tipo": "opcion_multiple", "q": "...", "opts": ["...", "...", "...", "...", "..."], "correct": 0, "explicacion": "..." }
Usa exactamente cinco alternativas.
Cada alternativa tiene una sola idea y máximo 5 palabras, sin explicación ni justificación dentro. Las cinco tienen un largo parecido. El detalle sutil de un distractor se logra cambiando una palabra o frase corta, no alargando la oración.
Las cinco deben responder al mismo caso o fragmento y competir entre sí.
No redactes cinco paráfrasis de la teoría.
No construyas las alternativas cambiando únicamente una palabra de una misma oración.
Las alternativas deben poder tener estructuras sintácticas diferentes, inicios diferentes y órdenes diferentes.
Cada una debe representar una interpretación, conclusión, clasificación, decisión, relación causal, contexto o explicación que podría parecer razonable al analizar rápidamente el caso.
La correcta debe depender del análisis completo del caso y de la teoría.
2.1b Variante «enunciados correctos» (sigue siendo «opcion_multiple», con los mismos campos):
Dentro de «q», después del planteamiento, escribe tres o cuatro enunciados numerados con números romanos (I., II., III. y, si son cuatro, IV.), cada uno separado por un salto de línea, y cierra pidiendo identificar cuáles son correctos o cuáles cumplen la condición del caso.
Las cinco alternativas son combinaciones distintas de esos números: mezcla «Solo II», pares como «I y III» y tríos como «II, III y IV».
Cada enunciado exige interpretar el caso; los falsos contienen un detalle conceptual sutil, no un error evidente.
2.2 Verdadero o falso:
{ "tipo": "verdadero_falso", "q": "...", "proposiciones": [ { "texto": "...", "correct": true }, { "texto": "...", "correct": false }, { "texto": "...", "correct": true } ], "explicacion": "..." }
Presenta primero una situación, fragmento, afirmación o evidencia contextualizada.
Incluye tres o cuatro proposiciones que exijan interpretar sus rasgos, consecuencias, intención, relación o contexto.
No uses definiciones aisladas.
2.3 Completar:
{ "tipo": "completar", "q": "", "textoConEspacios": "...___1___...", "opts": [["..."], ["..."], ["..."], ["..."], ["..."]], "correct": 0, "explicacion": "..." }
«q» siempre es una cadena vacía «""».
«textoConEspacios» presenta un caso breve que exige inferir relaciones, consecuencias, categorías, interpretaciones o características.
Usa uno, dos o tres blancos. Cada blanco se completa con una palabra o frase muy corta, de una o dos palabras.
No pidas simplemente el nombre literal de una teoría, autor, obra o definición.
Marca los blancos literalmente como «___1___», «___2___», etc.
«opts» contiene exactamente cinco combos.
Todos los combos deben tener la misma cantidad de blancos y la misma cantidad de palabras en cada posición.
Cruza los elementos entre combos para impedir que una sola palabra o su posición permita descartar una combinación.
No repitas combos idénticos.
2.4 Relacionar:
{ "tipo": "relacionar", "q": "...", "columnaA": ["1. ...", "2. ...", "3. ..."], "columnaB": ["a) ...", "b) ...", "c) ..."], "opts": ["1a - 2b - 3c", "...", "...", "...", "..."], "correct": 0, "explicacion": "..." }
Relaciona situaciones, fragmentos, evidencias, hechos o rasgos con sus interpretaciones, consecuencias, contextos o decisiones.
No relaciones términos con definiciones memorizables.
Cada columna tiene al menos tres elementos.
«opts» contiene cinco combinaciones completas con el formato: «1a - 2b - 3c».
No uses flechas, comas ni el texto completo de las columnas.
2.5 DISTRACTORES: DETALLE SUTIL QUE INVALIDA TODA LA ALTERNATIVA
Las cinco alternativas deben redactarse como respuestas independientes.
NO deben comenzar igual.
NO deben seguir una plantilla común.
NO deben mantener necesariamente el mismo orden de ideas.
NO deben ser cinco versiones de una misma oración.
Cada distractor debe ser razonable dentro del contexto, pero contener un detalle semántico que lo vuelva incorrecto.
Ese detalle puede encontrarse en CUALQUIER posición:
- al inicio;
- en medio;
- entre dos ideas;
- dentro de una condición;
- en una relación;
- en una causa;
- en una consecuencia;
- al final.
El detalle puede ser una palabra, una expresión breve, una condición, una relación, una causa, una consecuencia, una cantidad, una secuencia, una clasificación, una negación, una precisión o cualquier otro elemento relevante.
NO existe una palabra obligatoria para construir distractores.
No debes buscar siempre el mismo tipo de error.
El detalle decisivo debe variar de una pregunta a otra.
La alternativa completa debe parecer razonable hasta que se contraste con el caso y la teoría.
El distractor no debe ser incorrecto por contener una palabra absurda, extraña o evidentemente sospechosa.
El error debe ser conceptual y real.
No hagas que la alternativa correcta destaque por ser:
- más larga;
- más técnica;
- más específica;
- más completa;
- gramaticalmente diferente;
- la única que menciona el concepto central.
Si una alternativa puede descartarse sin analizar el caso completo, debes regenerarla.
La similitud buscada es de plausibilidad y contexto, NO de redacción.
3. DISEÑO DE LAS PREGUNTAS DECO
Las preguntas deben presentar una situación, texto, fragmento, evidencia, caso o escenario que obligue a utilizar la teoría.
El interrogante debe formar parte NATURAL del propio planteamiento.
NO es obligatorio terminar el caso con una pregunta independiente como «¿Cuál de las siguientes...?» ni separar el interrogante en una línea aparte.
El planteamiento puede terminar, por ejemplo, conduciendo naturalmente a:
- una interpretación que debe determinarse;
- una conclusión que puede establecerse;
- una relación que puede inferirse;
- una explicación que resulta compatible;
- una consecuencia que se desprende;
- una afirmación que completa correctamente el caso.
Las alternativas deben funcionar directamente como respuestas a ese interrogante integrado.
Ejemplo de estructura válida:
«...a partir de estas evidencias, se puede inferir que»
seguido de las cinco alternativas.
También puede utilizarse una pregunta explícita integrada dentro de la misma redacción cuando resulte natural.
Lo importante es que el interrogante pertenezca al planteamiento y no aparezca como una pregunta artificial separada del caso.
No hagas preguntas que puedan resolverse por copiar literalmente una frase de la teoría.
No preguntes directamente «¿qué es...?, ¿quién fue...?, ¿cuál es la definición...?».
En el Bloque A, el caso no debe superar aproximadamente 80 palabras.
En el Bloque B puede utilizarse más de una oración, sin superar aproximadamente 90 palabras.
El JSON no lleva imágenes: todo dato que el caso necesite de un gráfico, mapa o esquema va escrito dentro del planteamiento.
En Literatura, el caso puede ser un fragmento breve redactado por ti que ejemplifique los rasgos enseñados (sin nombrar obras ni autores que la teoría no mencione); la pregunta indaga qué se identifica, cuestiona o caracteriza en él.
Cada palabra del caso debe aportar información útil para resolverlo.
4. TEXTO, COMILLAS Y JSON
Usa comillas dobles normales solo para la sintaxis JSON.
Para términos, énfasis o citas dentro de un valor usa directamente «».
No uses comillas dobles escapadas.
Si una explicación tiene varios pasos, separa las líneas con la secuencia JSON «\\n».
Distribuye «correct» entre 0, 1, 2, 3 y 4 de forma pareja.
En un examen de N preguntas, ningún índice debe usarse más de ⌈N/5⌉+1 veces y no puede repetirse el mismo índice en más de dos preguntas consecutivas.
5. EXPLICACIONES
Toda explicación debe utilizar únicamente información disponible en el JSON.
En el Bloque A explica:
1. qué información del caso es relevante;
2. cómo se relaciona con la teoría;
3. por qué la respuesta correcta encaja;
4. qué detalle conceptual hace fallar los distractores.
No copies la teoría literalmente.
En el Bloque B redacta una explicación nueva aplicada al caso, en prosa
(no en pasos numerados): identifica los indicios relevantes, relaciónalos
con la teoría, y concluye por qué la respuesta correcta encaja y por qué
los distractores fallan.
6. VALIDACIÓN FINAL
Comprueba que:
- el primer mensaje solo enumera y calcula;
- el segundo mensaje solo entrega JSON;
- el arreglo «examen» tiene exactamente tantos elementos como puntos;
- el arreglo «ejercicios» tiene exactamente 20 elementos;
- todas las preguntas del Bloque A son «opcion_multiple»;
- los ejercicios usan los cuatro tipos y combinan puntos de distintos títulos;
- no existe «null» dentro de «ejercicios»;
- cada pregunta del Bloque A corresponde únicamente a su título;
- cada punto tiene exactamente una pregunta y ninguna pregunta fusiona varios puntos;
- todos los puntos del título quedan cubiertos entre las preguntas;
- el Bloque B integra varios elementos de teoría;
- ningún ejercicio utiliza conocimiento externo al JSON;
- las alternativas no siguen una plantilla común;
- las alternativas no comienzan necesariamente igual;
- los distractores contienen detalles sutiles que pueden estar en cualquier posición;
- no existe una palabra obligatoria para construir distractores;
- al menos dos distractores son plausibles;
- ninguna alternativa puede descartarse por una pista superficial;
- la correcta no destaca por longitud, vocabulario o estructura;
- cada alternativa tiene máximo 5 palabras y un largo parecido al de las otras cuatro;
- los casos son DECO y requieren análisis;
- las preguntas de «enunciados correctos» tienen tres o cuatro enunciados romanos y cinco combinaciones distintas;
- «verdadero_falso» tiene tres o cuatro proposiciones;
- «completar» tiene uno, dos o tres blancos;
- el interrogante está integrado naturalmente en el planteamiento;
- no se añade artificialmente una pregunta separada cuando no sea necesaria;
- cada tipo tiene exactamente sus campos;
- «completar» conserva «q»: «» y sus blancos;
- «relacionar» usa «1a - 2b - 3c»;
- no aparece «Ejercicio N»;
- la distribución de «correct» es equilibrada;
- el resultado final es JSON válido.`,v=String.raw`═══════════════════════════════════════════════════════════════
PROMPT — GENERACIÓN DE EXAMEN DE MATEMÁTICAS TIPO DECO (JSON)
App de estudio · Admisión UNMSM
═══════════════════════════════════════════════════════════════
ROL Y ENTRADA
Actúa como especialista en Matemática tipo DECO de nivel UNMSM.
Recibirás un JSON de teoría con secciones («titulo») y, dentro de cada una, puntos con «texto» y «explicacion».
No hay una sección «Ejercicios» ni marcadores «Ejercicio N»: los ejercicios los redactas tú (Bloque B).
FUENTE EXCLUSIVA DE CONOCIMIENTO
Todo el examen debe poder resolverse exclusivamente con la teoría recibida en el JSON.
No introduzcas:
- fórmulas no enseñadas;
- propiedades no enseñadas;
- procedimientos no explicados;
- conceptos externos;
- métodos que requieran conocimientos ausentes;
- datos que exijan teoría externa.
La dificultad debe provenir de combinar y aplicar conocimientos presentes en la teoría, no de introducir contenido nuevo.
OBJETIVO PEDAGÓGICO PRIORITARIO
Evalúa modelación, interpretación, estrategia, procedimiento, verificación e inferencia.
No evalúes memoria literal de una propiedad o fórmula.
El estudiante debe interpretar una situación, identificar los datos relevantes, elegir relaciones apropiadas, realizar operaciones y comprobar o interpretar el resultado.
FLUJO OBLIGATORIO DE DOS MENSAJES
1. Primer mensaje: enumera cada título en el orden recibido, con sus puntos numerados (número y «texto»).
Muestra:
«Título — puntos — preguntas» (una pregunta por cada punto).
Cierra con:
«Bloque A: X preguntas — Bloque B: 20 ejercicios — Total: X+20».
No redactes preguntas, alternativas, respuestas ni JSON.
2. Detente y espera la confirmación «genera json» o equivalente.
El usuario puede pedir ajustes.
3. Segundo mensaje: entrega únicamente un objeto JSON con dos claves: «examen» y «ejercicios».
Forma:
{ "examen": [ ... ], "ejercicios": [ ... ] }
1. BLOQUES Y CANTIDAD
1.1 BLOQUE A — UNA PREGUNTA POR PUNTO
Hay exactamente una pregunta por cada punto: un título de N puntos lleva N preguntas, una por punto y en el mismo orden.
Cada pregunta evalúa su propio punto mediante aplicación y razonamiento: si el punto es una fórmula, ecuación o procedimiento, se resuelve; si es conceptual, se plantea una situación donde el concepto deba aplicarse o interpretarse, nunca por definición directa ni por simple reconocimiento. No fusiones varios puntos en una sola pregunta.
No mezcles puntos de otros títulos.
Todas las preguntas del Bloque A son «opcion_multiple».
1.2 BLOQUE B — 20 EJERCICIOS INTEGRADORES
Crea EXACTAMENTE 20 ejercicios.
Ninguno puede ser «null».
Los 20 deben utilizar exclusivamente la teoría recibida.
Usa los cuatro tipos de la sección 2 («opcion_multiple», «verdadero_falso», «completar» y «relacionar»), alternándolos a lo largo de los 20.
Cada ejercicio combina puntos de distintos títulos de toda la teoría recibida cuando esta tenga varios títulos, de modo que los 20 recorran toda la teoría.
Cada ejercicio debe integrar obligatoriamente al menos dos elementos distintos de la teoría.
Cuando el tema lo permita, integra tres o más elementos.
No construyas ejercicios que puedan resolverse mediante una única sustitución directa en una fórmula.
La resolución debe requerir una cadena de razonamiento.
Los ejercicios pueden combinar:
- fórmulas;
- propiedades;
- ecuaciones;
- relaciones;
- procedimientos;
- interpretación de datos;
- restricciones;
- condiciones;
- operaciones intermedias;
- comparación;
- verificación;
- interpretación del resultado.
Progresión:
1–5:
al menos 2 elementos de teoría.
6–10:
2 o 3 elementos y aplicación contextual.
11–15:
al menos 3 elementos con análisis del procedimiento.
16–20:
3 o más elementos con interpretación, condición, comparación, inferencia o verificación.
No repitas consecutivamente la misma combinación de conceptos.
No introduzcas conocimientos que no aparezcan en el JSON.
1.3 Los Bloques A y B están separados.
1.4 El Bloque A usa exclusivamente «opcion_multiple». El Bloque B usa los cuatro tipos de la sección 2.
1.5 En los ejercicios «opcion_multiple» del Bloque B, las cinco alternativas son únicamente números: enteros, decimales o fracciones.
No escribas unidades, palabras, etiquetas ni letras dentro de las alternativas.
1.6 CORRESPONDENCIA UNO A UNO
El arreglo «examen» tiene exactamente tantos elementos como puntos de teoría recibidos, en el mismo orden: la posición N es la pregunta del punto N.
Cada posición lleva una pregunta. No uses «null» ni dejes ningún punto sin pregunta.
El arreglo «ejercicios» tiene exactamente 20 elementos y ninguno es «null».
2. TIPOS Y CAMPOS EXACTOS
No inventes campos ni cambies estos nombres.
2.1 Opción múltiple:
{ "tipo": "opcion_multiple", "q": "...", "opts": ["...", "...", "...", "...", "..."], "correct": 0, "explicacion": "..." }
En Bloque A, las alternativas pueden ser resultados, expresiones, estrategias, relaciones o decisiones matemáticas.
Cuando el resultado sea una magnitud, las cinco alternativas llevan la misma unidad.
En Bloque A, toda alternativa escrita con palabras tiene una sola idea y máximo 5 palabras, con largo parecido entre las cinco.
En los ejercicios «opcion_multiple» del Bloque B, las alternativas son únicamente resultados numéricos.
2.1b Variante «enunciados correctos» (sigue siendo «opcion_multiple», con los mismos campos):
Dentro de «q», después del planteamiento, escribe tres o cuatro enunciados matemáticos numerados con números romanos (I., II., III. y, si son cuatro, IV.), cada uno separado por un salto de línea, y cierra pidiendo identificar cuáles son correctos o cuáles cumplen la condición del caso.
Las cinco alternativas son combinaciones distintas de esos números: mezcla «Solo II», pares como «I y III» y tríos como «II, III y IV».
Cada enunciado exige analizar el procedimiento, resultado o condición del caso; los falsos contienen un error matemático plausible.
2.2 Verdadero o falso:
{ "tipo": "verdadero_falso", "q": "...", "proposiciones": [ { "texto": "...", "correct": true }, { "texto": "...", "correct": false }, { "texto": "...", "correct": true } ], "explicacion": "..." }
Presenta una situación matemática antes de las proposiciones.
Incluye tres o cuatro proposiciones.
Las proposiciones deben exigir analizar el procedimiento, relación, resultado o condición del caso.
2.3 Completar:
{ "tipo": "completar", "q": "", "textoConEspacios": "...___1___...", "opts": [["..."], ["..."], ["..."], ["..."], ["..."]], "correct": 0, "explicacion": "..." }
«q» siempre es «».
Los blancos deben corresponder a pasos, valores, relaciones, condiciones o conclusiones necesarias para resolver el caso.
No pidas recordar únicamente el nombre de una fórmula.
Cada blanco contiene una palabra, número o expresión muy corta.
Los cinco combos deben tener la misma cantidad de blancos.
Cruza valores entre combos para impedir pistas por posición.
2.4 Relacionar:
{ "tipo": "relacionar", "q": "...", "columnaA": ["1. ...", "2. ...", "3. ..."], "columnaB": ["a) ...", "b) ...", "c) ..."], "opts": ["1a - 2b - 3c", "...", "...", "...", "..."], "correct": 0, "explicacion": "..." }
Relaciona casos, representaciones, procedimientos, errores o resultados con sus consecuencias, modelos o correcciones.
No relaciones una propiedad con su definición de memoria.
3. DISTRACTORES MATEMÁTICOS
Las alternativas no deben ser números aleatorios.
Cada distractor debe proceder de un error matemático plausible.
El error puede encontrarse en cualquier parte del razonamiento:
- interpretación de datos;
- planteamiento;
- signo;
- despeje;
- sustitución;
- propiedad;
- orden de operaciones;
- condición;
- dominio;
- unidad;
- conversión;
- redondeo;
- interpretación final.
No existe un tipo de error obligatorio.
El modelo debe identificar qué parte del procedimiento es determinante en cada problema y construir distractores a partir de errores diferentes.
Los cinco resultados deben ser razonablemente cercanos o plausibles cuando el contexto matemático lo permita.
No utilices un valor evidentemente absurdo solo para fabricar un distractor.
En Bloque A, las alternativas no deben comenzar ni estructurarse todas de la misma manera.
En los ejercicios «opcion_multiple» del Bloque B, al ser numéricas, evita que la correcta pueda identificarse por magnitud, cantidad de cifras o formato.
4. DISEÑO DECO
El problema debe presentar una situación, patrón, relación, restricción, error, comparación, medición, representación o decisión.
El interrogante debe integrarse naturalmente en el planteamiento.
No es obligatorio terminar con una pregunta independiente.
Ejemplo de estructura:
«...por lo que, considerando las condiciones anteriores, el valor que corresponde a la cantidad solicitada es»
seguido de las alternativas.
También puede utilizarse una pregunta explícita si resulta natural.
Lo importante es que el interrogante pertenezca al propio planteamiento y que las alternativas respondan directamente a él.
No preguntes:
- «¿cuál es la fórmula?»;
- «¿qué propiedad se aplica?»;
- «¿qué significa esta fórmula?»;
- «¿qué es...?».
Si la teoría contiene una fórmula, presenta una situación donde el estudiante deba reconocer las magnitudes, plantear la relación, operar, verificar restricciones e interpretar.
El Bloque A no debe superar aproximadamente 80 palabras.
El Bloque B no debe superar aproximadamente 90 palabras.
El JSON no lleva imágenes: todo dato de figura, gráfico o esquema que el problema necesite (medidas, coordenadas, porcentajes, posiciones, valores) va escrito dentro del planteamiento.
Cuando el tema lo permita, lo que se pide corresponde a algo del relato (una cantidad de dinero, de personas, una altura, una temperatura, un tiempo) y se obtiene a partir de valores intermedios que el estudiante debe hallar antes, por ejemplo mediante una expresión que combina esos valores.
5. NOTACIÓN Y JSON
Usa KaTeX («$...$») solo cuando sea necesario.
Cualquier comando con barra invertida debe encontrarse dentro de «$...$».
Dentro del JSON, cada barra invertida de KaTeX debe escribirse como dos caracteres consecutivos.
No uses delimitadores alternativos.
Para texto dentro de valores usa «».
Para saltos de línea en cadenas utiliza «\\n».
Distribuye «correct» entre 0, 1, 2, 3 y 4 de forma pareja.
Ningún índice debe superar ⌈N/5⌉+1 apariciones y no puede repetirse más de dos preguntas consecutivas.
6. EXPLICACIONES
Las explicaciones deben utilizar únicamente teoría presente en el JSON.
En Bloque A explica:
1. qué datos son relevantes;
2. qué relación o procedimiento se utiliza;
3. cómo se realizan las operaciones;
4. por qué la respuesta es válida;
5. qué error produce cada distractor relevante.
En Bloque B utiliza pasos numerados cuando la resolución lo permita: tantos
como el procedimiento realmente necesite para quedar completo, sin un
piso ni un tope fijo.
Cada paso debe explicar qué se hace y por qué.
Incluye sustitución, operaciones, restricciones, unidades y verificación cuando correspondan.
7. VALIDACIÓN FINAL
Comprueba que:
- el primer mensaje solo enumera y calcula;
- el segundo mensaje solo entrega JSON;
- el arreglo «examen» tiene exactamente tantos elementos como puntos;
- todas las preguntas del Bloque A son «opcion_multiple»;
- el Bloque B usa los cuatro tipos y combina puntos de distintos títulos;
- ningún punto del Bloque A queda sin pregunta y no hay «null» en «examen»;
- los puntos conceptuales se evalúan mediante aplicación, no por definición directa;
- cada pregunta del Bloque A usa únicamente información de su mismo título;
- cada punto tiene exactamente una pregunta;
- el Bloque B tiene exactamente 20 ejercicios;
- ningún ejercicio del Bloque B es «null»;
- todos los ejercicios del Bloque B integran al menos dos elementos de teoría;
- los ejercicios más difíciles integran tres o más elementos cuando el tema lo permite;
- ningún ejercicio requiere conocimiento externo al JSON;
- ningún ejercicio se reduce a una sustitución directa aislada;
- las alternativas numéricas proceden de errores matemáticos plausibles;
- en el Bloque A, toda alternativa escrita con palabras tiene máximo 5 palabras;
- no hay números absurdos utilizados únicamente como distractores;
- el interrogante está integrado naturalmente en el planteamiento;
- las preguntas de «enunciados correctos» tienen tres o cuatro enunciados romanos y cinco combinaciones distintas;
- «verdadero_falso» tiene tres o cuatro proposiciones;
- los datos de figuras o gráficos están escritos en el texto;
- no se depende de una pregunta artificial separada;
- no aparece «Ejercicio N»;
- «correct» está distribuido;
- el JSON es válido.`,y=String.raw`═══════════════════════════════════════════════════════════════
PROMPT — GENERACIÓN DE EXAMEN DE CIENCIAS TIPO DECO (JSON)
App de estudio · Admisión UNMSM
═══════════════════════════════════════════════════════════════
ROL Y ENTRADA
Actúa como especialista en Física, Química y Biología de nivel UNMSM.
Recibirás un JSON de teoría con secciones («titulo») y, dentro de cada una, puntos con «texto» y «explicacion».
No hay una sección «Ejercicios» ni marcadores «Ejercicio N»: los ejercicios los redactas tú (Bloque B).
FUENTE EXCLUSIVA DE CONOCIMIENTO
Todos los ejercicios deben poder resolverse exclusivamente con la teoría recibida en el JSON.
No introduzcas:
- fórmulas no enseñadas;
- leyes no enseñadas;
- mecanismos no explicados;
- sustancias no incluidas;
- procesos no incluidos;
- conceptos externos;
- procedimientos que dependan de conocimientos ausentes.
La dificultad debe provenir de combinar y aplicar los conocimientos recibidos, NO de agregar conocimientos nuevos.
OBJETIVO PEDAGÓGICO PRIORITARIO
Evalúa comprensión, aplicación e inferencia.
El estudiante no debe acertar por reconocer una palabra, definición, nombre de teoría o frase idéntica al apunte.
Cada pregunta debe transformar la teoría en una situación que obligue a interpretar evidencias, anticipar consecuencias, comparar explicaciones, detectar errores, realizar cálculos o elegir una decisión justificada.
FLUJO OBLIGATORIO DE DOS MENSAJES
1. Primer mensaje: enumera cada título en el orden recibido, con sus puntos numerados (número y «texto»). Calcula las preguntas del Bloque A según 1.1 y muestra:
«Título — puntos — preguntas».
Cierra con:
«Bloque A: X preguntas — Bloque B: 20 ejercicios — Total: X+20».
No redactes preguntas, alternativas, respuestas ni JSON.
2. Detente y espera «genera json» o equivalente.
3. Segundo mensaje: entrega únicamente un objeto JSON con:
«examen» y «ejercicios».
Forma:
{ "examen": [ ... ], "ejercicios": [ ... ] }
1. BLOQUES Y CANTIDAD
1.1 BLOQUE A
Hay exactamente una pregunta por cada punto: un título de N puntos lleva N preguntas, una por punto y en el mismo orden.
Cada pregunta evalúa su propio punto aplicándolo a un caso. No fusiones varios puntos en una sola pregunta.
Todas las preguntas del Bloque A son «opcion_multiple».
1.2 BLOQUE B — 20 EJERCICIOS INTEGRADORES
Crea EXACTAMENTE 20 ejercicios.
Ninguno puede ser «null».
Todos deben utilizar únicamente teoría recibida.
Usa los cuatro tipos de la sección 2 («opcion_multiple», «verdadero_falso», «completar» y «relacionar»), alternándolos a lo largo de los 20.
Cada ejercicio combina puntos de distintos títulos de toda la teoría recibida cuando esta tenga varios títulos, de modo que los 20 recorran toda la teoría.
Cada ejercicio debe integrar obligatoriamente al menos dos elementos distintos de teoría.
Cuando el tema lo permita, utiliza tres o más.
No construyas ejercicios que puedan resolverse mediante una sola fórmula, una sola definición o un único dato aislado.
Para Física y Química, la integración puede combinar:
- magnitudes;
- fórmulas;
- leyes;
- relaciones;
- unidades;
- conversiones;
- procedimientos;
- interpretación física o química;
- condiciones;
- resultados intermedios.
Para Biología, la integración puede combinar:
- estructura y función;
- proceso y consecuencia;
- condición y resultado;
- organismo y mecanismo;
- característica y función;
- proceso y regulación;
- evidencia y explicación.
Progresión:
1–5:
al menos 2 elementos.
6–10:
2 o 3 elementos con aplicación.
11–15:
al menos 3 elementos con interpretación o análisis.
16–20:
3 o más elementos con inferencia, condición, comparación, consecuencia o transferencia.
No repitas consecutivamente la misma combinación de conceptos.
No introduzcas conocimiento externo.
1.3 Los Bloques A y B están separados.
1.4 El Bloque A usa exclusivamente «opcion_multiple». El Bloque B usa los cuatro tipos de la sección 2.
1.5 En los ejercicios «opcion_multiple» cuantitativos de Física y Química, las alternativas son números (enteros, decimales o fracciones) seguidos de la unidad de la magnitud pedida, la misma en las cinco.
No añadas otras palabras ni etiquetas.
En Biología conceptual, las alternativas pueden ser frases breves.
Toda alternativa escrita con palabras tiene una sola idea y máximo 5 palabras, sin explicación dentro, con largo parecido entre las cinco.
1.6 CORRESPONDENCIA UNO A UNO
El arreglo «examen» tiene exactamente tantos elementos como puntos de teoría recibidos, en el mismo orden: la posición N es la pregunta del punto N.
Cada posición lleva una pregunta. No uses «null» ni dejes ningún punto sin pregunta.
El arreglo «ejercicios» tiene exactamente 20 elementos y ninguno es «null».
2. TIPOS Y CAMPOS EXACTOS
El Bloque A usa solo el tipo 2.1. El Bloque B usa los cuatro tipos (2.1, 2.2, 2.3 y 2.4).
2.1 Opción múltiple:
{ "tipo": "opcion_multiple", "q": "...", "opts": ["...", "...", "...", "...", "..."], "correct": 0, "explicacion": "..." }
Usa exactamente cinco alternativas.
Las cinco deben competir dentro del mismo caso.
No construyas cinco paráfrasis de una misma teoría.
No copies una oración y cambies únicamente un término.
2.1b Variante «enunciados correctos» (sigue siendo «opcion_multiple», con los mismos campos):
Dentro de «q», después del planteamiento, escribe tres o cuatro enunciados numerados con números romanos (I., II., III. y, si son cuatro, IV.), cada uno separado por un salto de línea, y cierra pidiendo identificar cuáles son correctos o cuáles cumplen la condición del caso.
Las cinco alternativas son combinaciones distintas de esos números: mezcla «Solo II», pares como «I y III» y tríos como «II, III y IV».
En Química, los enunciados también pueden ser ecuaciones o fórmulas numeradas y las alternativas parejas ordenadas como «IV – II».
Cada enunciado exige interpretar el caso; los falsos contienen un detalle conceptual sutil, no un error evidente.
2.2 Verdadero o falso:
{ "tipo": "verdadero_falso", "q": "...", "proposiciones": [ { "texto": "...", "correct": true }, { "texto": "...", "correct": false }, { "texto": "...", "correct": true } ], "explicacion": "..." }
Presenta primero una situación o evidencia.
Incluye tres o cuatro proposiciones.
Las proposiciones deben interpretar el caso.
2.3 Completar:
{ "tipo": "completar", "q": "", "textoConEspacios": "...___1___...", "opts": [["..."], ["..."], ["..."], ["..."], ["..."]], "correct": 0, "explicacion": "..." }
«q» siempre es «».
El caso debe requerir inferencia.
Los blancos completan consecuencias, relaciones, interpretaciones, magnitudes o decisiones.
No uses un blanco para copiar literalmente una definición.
Cada blanco contiene una palabra o frase muy corta.
Todos los combos tienen la misma cantidad de blancos.
Cruza los elementos entre combos.
2.4 Relacionar:
{ "tipo": "relacionar", "q": "...", "columnaA": ["1. ...", "2. ...", "3. ..."], "columnaB": ["a) ...", "b) ...", "c) ..."], "opts": ["1a - 2b - 3c", "...", "...", "...", "..."], "correct": 0, "explicacion": "..." }
Relaciona observaciones, situaciones, resultados o evidencias con sus consecuencias, interpretaciones, mecanismos o decisiones.
No relaciones términos con definiciones memorizables.
3. DISTRACTORES DE CIENCIAS
Las cinco alternativas deben ser respuestas independientes y naturales.
NO deben comenzar necesariamente igual.
NO deben seguir una plantilla común.
NO deben conservar necesariamente el mismo orden de ideas.
Cada distractor debe contener un detalle sutil que lo vuelva incorrecto.
Ese detalle puede estar en cualquier parte de la alternativa.
Puede ser una palabra, expresión, condición, relación, causa, consecuencia, cantidad, secuencia, mecanismo, dirección, escala, unidad, clasificación o cualquier otro elemento relevante.
No existe una palabra obligatoria para construir distractores.
No repitas deliberadamente el mismo tipo de detalle en todas las preguntas.
El modelo debe identificar en cada caso qué aspecto es determinante y alterarlo de forma plausible.
El distractor debe seguir pareciendo compatible con el contexto hasta que se contraste con la teoría.
No utilices palabras absurdas ni afirmaciones obviamente falsas.
La alternativa correcta no debe destacar por longitud, vocabulario técnico, precisión, estructura o posición.
Si una alternativa puede descartarse sin analizar el caso, regénérala.
En Física y Química, los distractores numéricos deben proceder de errores plausibles de procedimiento, interpretación, unidades, signo, despeje, conversión, redondeo o aplicación de una relación.
En Biología, los distractores deben surgir de confusiones plausibles entre funciones, procesos, condiciones, mecanismos, estructuras, consecuencias o relaciones enseñadas.
4. DISEÑO DECO
Presenta primero una situación, experimento, observación, fenómeno, problema, evidencia, análisis de muestra, proceso biológico, químico o físico.
El interrogante debe integrarse naturalmente en el propio planteamiento.
NO es obligatorio terminar con una pregunta independiente.
Puede terminar, por ejemplo, con una formulación como:
«a partir de estas observaciones, se puede concluir que»
y las alternativas completan el planteamiento.
También puede utilizarse una pregunta explícita integrada si resulta natural.
Lo importante es que el interrogante forme parte del planteamiento y conduzca directamente a las alternativas.
No preguntes directamente:
- «¿qué es...?»
- «¿cuál es la definición...?»
- «¿qué ley afirma...?»
- «¿cuál es la fórmula...?».
Si el punto contiene una fórmula, plantea una situación donde deba identificarse qué relación utilizar, realizar el procedimiento e interpretar el resultado.
En Biología conceptual no inventes cálculos ni fórmulas.
No uses KaTeX en preguntas de Biología conceptual.
El Bloque A no debe superar aproximadamente 80 palabras.
El Bloque B no debe superar aproximadamente 90 palabras.
El JSON no lleva imágenes: todo dato de figura, gráfico o esquema que el problema necesite (medidas, coordenadas, porcentajes, posiciones, valores) va escrito dentro del planteamiento.
En Física y Química, cuando el tema lo permita, lo que se pide corresponde a algo del relato (una rapidez, una intensidad, un volumen, una temperatura) y se obtiene a partir de valores intermedios que el estudiante debe hallar antes.
5. NOTACIÓN Y JSON
En Física y Química usa KaTeX solo cuando sea necesario.
Cualquier comando con barra invertida debe estar dentro de «$...$».
Dentro del JSON, cada barra invertida de KaTeX debe escribirse como dos caracteres consecutivos.
En Biología conceptual no uses «$» ni comandos KaTeX.
Para texto dentro de valores utiliza «».
Para saltos de línea utiliza «\\n».
Distribuye «correct» entre 0, 1, 2, 3 y 4 de forma pareja.
No uses el mismo índice más de dos preguntas consecutivas.
6. EXPLICACIONES
Las explicaciones deben utilizar únicamente la teoría recibida.
En Bloque A explica:
1. qué evidencia es relevante;
2. qué concepto o relación se aplica;
3. cómo se conecta con el caso;
4. por qué la respuesta correcta encaja;
5. qué detalle hace fallar los distractores.
En Física y Química, cuando haya cálculo, muestra:
- selección de la relación;
- significado de las magnitudes;
- sustitución;
- unidades;
- operaciones;
- interpretación;
- verificación.
En Bloque B (Física y Química con cálculo) utiliza pasos numerados:
tantos como el procedimiento realmente necesite para quedar completo,
sin un piso ni un tope fijo.
En Biología, explica la cadena:
estructura/proceso → mecanismo → consecuencia,
o la relación equivalente que corresponda al contenido.
No agregues conocimientos externos.
7. VALIDACIÓN FINAL
Comprueba que:
- el primer mensaje solo enumera y calcula;
- el segundo mensaje solo entrega JSON;
- «examen» tiene exactamente tantos elementos como puntos;
- «ejercicios» tiene exactamente 20 elementos;
- todas las preguntas del Bloque A son «opcion_multiple»;
- los ejercicios usan los cuatro tipos y combinan puntos de distintos títulos;
- ningún ejercicio del Bloque B es «null»;
- cada pregunta del Bloque A corresponde únicamente a su título;
- cada punto tiene exactamente una pregunta y ninguna pregunta fusiona varios puntos;
- todos los puntos del título quedan cubiertos;
- los 20 ejercicios del Bloque B integran al menos dos elementos de teoría;
- cuando el tema lo permita, los ejercicios difíciles integran tres o más;
- ningún ejercicio requiere conocimiento externo al JSON;
- Física y Química no se reducen a una sola sustitución directa;
- Biología no inventa cálculos ni fórmulas;
- las alternativas no siguen una plantilla común;
- los distractores contienen detalles sutiles que pueden aparecer en cualquier posición;
- no existe una palabra obligatoria para construir distractores;
- los distractores son plausibles;
- la correcta no destaca por pistas formales;
- toda alternativa escrita con palabras tiene máximo 5 palabras;
- el interrogante está integrado naturalmente en el planteamiento;
- las preguntas de «enunciados correctos» tienen tres o cuatro enunciados romanos y cinco combinaciones distintas;
- «verdadero_falso» tiene tres o cuatro proposiciones;
- los datos de figuras o gráficos están escritos en el texto;
- no se añade una pregunta artificial separada cuando no sea necesaria;
- las alternativas de los ejercicios «opcion_multiple» cuantitativos de Física y Química son números con la misma unidad;
- no aparece «Ejercicio N»;
- la distribución de «correct» es equilibrada;
- Biología conceptual no contiene KaTeX;
- el Bloque A no supera aproximadamente 80 palabras por caso;
- el Bloque B no supera aproximadamente 90 palabras por caso;
- el resultado final es JSON válido.`,b=`Las fórmulas y operaciones se escriben en texto plano (x², √, ×, ÷, π), sin LaTeX; dentro de ellas se usan los símbolos matemáticos normales.`,x={"Habilidad Lógico Matemático":{arquetipo:`practico`,unidadSing:`tipo de problema`,unidadPlur:`tipos de problema`,rasgo:`atajos, propiedades o casos límite de ese tipo de problema`,formulas:!0},Aritmética:{arquetipo:`practico`,unidadSing:`tipo de problema`,unidadPlur:`tipos de problema`,rasgo:`las condiciones de validez de la propiedad (conjunto numérico, valores excluidos) y sus casos especiales`,formulas:!0},Álgebra:{arquetipo:`practico`,unidadSing:`tipo de problema`,unidadPlur:`tipos de problema`,rasgo:`las condiciones de existencia, restricciones y teoremas asociados`,formulas:!0},Geometría:{arquetipo:`practico`,unidadSing:`tipo de problema`,unidadPlur:`tipos de problema`,rasgo:`las condiciones del teorema y a qué tipo de figura se aplica`,formulas:!0},Trigonometría:{arquetipo:`practico`,unidadSing:`tipo de problema`,unidadPlur:`tipos de problema`,rasgo:`la condición de validez de la identidad y el cuadrante o rango donde aplica`,formulas:!0},"Habilidad Verbal":{arquetipo:`practico`,unidadSing:`tipo de pregunta`,unidadPlur:`tipos de pregunta`,rasgo:`las palabras clave del enunciado y los tipos de alternativa incorrecta de esa habilidad`,formulas:!1},"Historia Universal":{arquetipo:`historico`},"Historia del Perú":{arquetipo:`historico`},Biología:{arquetipo:`conceptual`,rasgo:`qué molécula interviene y en qué dirección cambia, tipo de reacción, energía, enzimas, u otro rasgo que los exámenes usen para diferenciarlos`,formulas:!1,notaExtra:`Un subtema que NO tenga su propio número en el temario (por ejemplo taxia, tropismo, nastia o movimiento dentro de Irritabilidad) va DENTRO del subtema al que pertenece, nunca como un subtítulo aparte.`},Física:{arquetipo:`conceptual`,rasgo:`si es escalar o vectorial, su fórmula con las unidades del Sistema Internacional, y sus condiciones de validez`,formulas:!0},Química:{arquetipo:`conceptual`,rasgo:`su fórmula, su nomenclatura, sus propiedades y el tipo de reacción en que participa`,formulas:!0},Economía:{arquetipo:`conceptual`,rasgo:`los agentes o variables que intervienen y, si tiene fórmula, sus unidades y cómo se interpreta`,formulas:!0},Lenguaje:{arquetipo:`conceptual`,rasgo:`su criterio de identificación, sus excepciones y un ejemplo propio de una línea`,formulas:!1},Literatura:{arquetipo:`conceptual`,rasgo:`autor u obra representativa, época y rasgo de estilo que lo distingue`,formulas:!1,notaExtra:`No copies fragmentos de obras ni versos: parafrasea siempre.`},Filosofía:{arquetipo:`conceptual`,rasgo:`representante, época y la tesis central que lo distingue de corrientes vecinas`,formulas:!1},Geografía:{arquetipo:`conceptual`,rasgo:`su ubicación, su causa y, si es un dato numérico, su unidad`,formulas:!1},"Educación Cívica":{arquetipo:`conceptual`,rasgo:`su función o atribución concreta y la norma que lo respalda`,formulas:!1},Psicología:{arquetipo:`conceptual`,rasgo:`el autor y su aporte, o los componentes y fases del proceso`,formulas:!1}},S={arquetipo:`conceptual`,rasgo:`los rasgos que distinguen un tipo de otro dentro de este curso`,formulas:!1},C={Literatura:`# Alejo Carpentier
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
- Narración: lineal-cronológica + episódica`,"Historia Universal":`# Imperio napoleónico (1804-1815)
## III Coalición
- Trafalgar → derrota franco-española
- Austerlitz → gran victoria («los tres emperadores»)
- Crea la Confederación del Rin
## IV Coalición
- Decreto de Berlín → bloqueo continental contra Inglaterra
- Tilsit → acuerdo con el zar Alejandro I (Rusia)`,Biología:`# Histología vegetal
## Concepto
- Rama de la Botánica: estudia los tejidos de la planta
- Tejido: conjunto de células similares que cumplen funciones específicas
## Clases de tejidos
- Juveniles (embrionarios): células indiferenciadas, crecimiento constante
- Adultos: células diferenciadas`,Física:`# Ondas mecánicas (O.M.)
## Concepto
- Propagación de perturbaciones
- Transportan energía y cantidad de movimiento, no materia
- Las partículas solo oscilan
- Necesitan un medio material
## Tipos
- O.M. longitudinal: vibración de partículas paralela a la propagación (el sonido)
- O.M. transversal: vibración de partículas perpendicular a la propagación (superficie libre de un líquido)`,Química:`# Estequiometría
## Definición
- Rama de la Química: aspecto cuantitativo de todo proceso químico
- Relación de moles, masa y volumen
## Ley de conservación de la masa (Lavoisier)
- En toda reacción: Σ masa reactantes = Σ masa productos
- Ejemplo: O₂ + 2 H₂ → 2 H₂O (32 g + 4 g → 36 g)`};function w(e,t){let n=String(e||``).split(`
`).filter(Boolean).flatMap(e=>{let t=e.indexOf(`: `);return(t===-1?e:e.slice(t+2)).split(` | `).map(e=>e.trim()).filter(Boolean)});return{total:n.length,lista:n.map((e,n)=>`${n+1}. ${e}${e===t?`  ← TEMA A DESARROLLAR`:``}`).join(`
`)}}function T(e,t,n){return e.arquetipo===`practico`?`INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${n}).
2. Para CADA ${t}, busca su regla o forma básica.
3. Para CADA ${t}, busca ${e.rasgo}, pero solo los que de verdad distinguen un ${t} de otro.
4. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué reglas usan realmente: si preguntan solo la forma básica, no agregues condiciones que nadie pregunta.
5. Busca los ${n} con los que este tema suele confundirse.
Contrasta cada dato importante en al menos dos fuentes. Si no puedes confirmarlo, no lo escribas.`:e.arquetipo===`historico`?`INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${n}: causas, etapas, consecuencias).
2. Para CADA ${t}, busca su dato básico: qué ocurrió, cuándo y dónde.
3. Para CADA ${t}, busca personajes con nombre completo, causas y consecuencias, pero solo los datos que de verdad distinguen ese hecho de otros.
4. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué fechas o nombres preguntan realmente: si preguntan solo el hecho básico, no agregues detalles que nadie pregunta.
5. Busca los hechos o procesos con los que este tema suele confundirse.
Contrasta cada fecha, nombre o cifra en al menos dos fuentes. Si los historiadores discrepan o no puedes confirmar el dato, indícalo como aproximado o no lo escribas.`:`INVESTIGACIÓN (obligatoria, antes de escribir)
No respondas de memoria. Usa búsqueda web.
1. Busca primero la estructura general del tema (sus ${n} o características principales).
2. Para CADA ${t}, busca su definición básica y sus tipos o clasificaciones completas.
3. Para CADA tipo que encuentres, busca ${e.rasgo}, pero solo los que de verdad distinguen un tipo de otro.
4. Busca los casos, agentes, enfermedades, fenómenos o ejemplos concretos y aplicados de este tema con los que un examen suele evaluarlo. No te quedes solo en el esquema de clasificación abstracto: un tema con aplicaciones reales conocidas (una enfermedad representativa, un mecanismo con nombre propio, una vía o proceso concreto) debe cubrir esas aplicaciones, no solo la teoría general.
5. Busca preguntas de exámenes de admisión anteriores de la UNMSM sobre el tema (si no hay, de otras universidades peruanas). Fíjate qué preguntan realmente: si preguntan solo la definición básica, no agregues atributos que nadie pregunta; si preguntan sobre un caso o agente concreto del paso 4, ese caso debe quedar cubierto en el apunte.
6. Busca los conceptos que suelen confundirse con este tema.
Contrasta cada dato importante en al menos dos fuentes. Si no puedes confirmarlo, no lo escribas.`}function E(e,t){return`LÍMITE CON OTROS TEMAS DEL TEMARIO
El temario de abajo tiene un tema propio para cada cosa que ves numerada (${t} en total). Desarrolla ÚNICAMENTE el tema marcado con «← TEMA A DESARROLLAR». Si al investigarlo encuentras algo que en el temario tiene su propio número, nómbralo como máximo en una viñeta de conexión, sin desarrollarlo.${e.notaExtra?` ${e.notaExtra}`:``}`}function D(e,t,n){let r,i,a,o;return e.arquetipo===`historico`?(r=`Verifica que CADA ${t} tenga primero su hecho básico en una viñeta simple, antes de causas, consecuencias o personajes.`,i=`Verifica que no haya más de dos niveles de viñeta en total (${t} → causa/consecuencia/personaje). Si un ${t} tiene varios datos, únelos en una sola viñeta, nunca en viñetas propias por dato.`,a=`Verifica que cada dato que incluiste de verdad distingue este hecho de otro.`,o=`Verifica que no haya ${n} que en realidad sean parte de un proceso ya desarrollado.`):e.arquetipo===`practico`?(r=`Verifica que CADA ${t} tenga primero su regla o forma básica en una viñeta simple, antes de cualquier condición o atajo.`,i=`Verifica que no haya más de dos niveles de viñeta en total (${t} → condición/atajo). Si un ${t} tiene varios rasgos, únelos en una sola viñeta, nunca en viñetas propias por rasgo.`,a=`Verifica que cada condición o atajo que incluiste de verdad distingue un tipo de otro.`,o=`Verifica que no haya ${n} que en realidad sean variantes de otro ya desarrollado.`):(r=`Verifica que CADA ${t} tenga primero su definición básica en una viñeta simple, antes de cualquier tipo o atributo.`,i=`Verifica que no haya más de dos niveles de viñeta en total (${t} → tipo). Si un tipo tiene varios atributos, únelos en una sola viñeta de ese tipo, nunca en viñetas propias por atributo.`,a=`Verifica que cada atributo que incluiste de verdad distingue un tipo de otro.`,o=`Verifica que no haya ${n} que en realidad sean formas de otro ${t} ya desarrollado.`),`ANTES DE ENTREGAR (autorrevisión obligatoria)
- ${r}
- ${i}
- ${a}
- ${o}
- Verifica que no hayas desarrollado a fondo ningún tema que en el temario tenga su propio número.
- Quita cualquier número de referencia, nota al pie o lista de fuentes que tu búsqueda haya generado. El apunte no lleva ninguna marca de dónde salió la información.`}function O(e,t,n){let r,i;return e.arquetipo===`historico`?(r=`El hecho básico de cada ${t} siempre (qué, cuándo, dónde). Causas, consecuencias y personajes con nombre completo solo cuando el ${t} los tenga y un examen pueda preguntarlos. Procesos vecinos que aparecen como distractores.`,i=`Relatos narrativos extensos, curiosidades sin valor de examen, opiniones sobre los hechos, fechas que no puedas confirmar. No dupliques un ${t} como si fuera otro. No inventes un dato si no distingue nada. Ningún número de referencia ni lista de fuentes. Nada de otro tema del temario que tenga su propio número.`):e.arquetipo===`practico`?(r=`La regla o forma básica de cada ${t} siempre. Las condiciones de uso y atajos distintivos solo cuando el ${t} los tenga y un examen pueda preguntarlos. Casos límite y excepciones. ${n.charAt(0).toUpperCase()+n.slice(1)} vecinos que aparecen como distractores.`,i=`Procedimientos de resolución paso a paso, ejemplos resueltos con alternativas, enunciados de problemas completos, etimología, historia o curiosidades. No dupliques un ${t} como si fuera otro. No inventes una condición si no distingue nada. Ningún número de referencia ni lista de fuentes. Nada de otro tema del temario que tenga su propio número.`):(r=`La definición básica de cada ${t} siempre. Los tipos y sus atributos distintivos solo cuando el ${t} los tenga y un examen pueda preguntarlos. Estructura y función, etapas, excepciones. Casos, agentes o ejemplos concretos y aplicados cuando el tema tenga uno representativo conocido (una enfermedad, un mecanismo con nombre propio, un proceso real), no solo el esquema abstracto. Conceptos vecinos que aparecen como distractores.`,e.formulas&&(r+=` Cuando el tema tenga fórmulas de cálculo, inclúyelas con sus variables y unidades.`),i=`Etimología, historia, curiosidades, detalles universitarios que esas preguntas no piden, cómo resolver problemas ni ejemplos resueltos. No dupliques un ${t} como si fuera un tema aparte. No inventes un atributo si no distingue nada. Ningún número de referencia ni lista de fuentes. Nada de otro tema del temario que tenga su propio número.`),`QUÉ INCLUIR\n${r}\n\nQUÉ NO INCLUIR\n${i}`}function le({curso:e,tema:t,temarioCurso:n,paraJson:r=!1}){let i=x[e]||S,a=i.unidadSing||(i.arquetipo===`historico`?`aspecto`:`subtema`),o=i.unidadPlur||(i.arquetipo===`historico`?`aspectos`:`${a}s`),{total:s,lista:c}=w(n,t),ee=i.formulas?`\n${b}`:``,l=C[e],u=l?`EJEMPLO DE APUNTE REAL (de otro tema: solo ilustra el estilo y la brevedad; NO copies su contenido)\n${l}\n\n`:``;return`Actúa como profesor de ${e} preuniversitario e investigador. Prepara apuntes para copiar a mi cuaderno sobre el tema marcado en el temario de abajo, para el examen de admisión de la UNMSM (Área C).
No te doy apuntes: investiga tú solo. No muestres el proceso de investigación ni fuentes: nada de links, citas, notas ni marcadores como [1] o [cite]. No menciones la universidad, academias, profesores ni el examen dentro de los apuntes.${r?`
Este es el PASO 1 de 3: solo escribe los apuntes. En el siguiente mensaje te pediré convertirlos a JSON; no lo hagas todavía.`:``}
TEMARIO DE ${e.toUpperCase()} (referencia, no lo desarrolles completo — ${s} temas)
${c}
${T(i,a,o)}
${E(i,s)}
${D(i,a,o)}
${O(i,a,o)}
BREVEDAD (regla principal)
- Una idea por viñeta, en fragmentos cortos: máximo 12 palabras. Sin oraciones largas ni explicaciones.
- Máximo dos niveles de viñeta por ${a}.
- Cada dato aparece una sola vez en todo el apunte.
- Negrita solo en el término clave.
- Si hay duda entre incluir o quitar algo, quítalo.
${ee}
${u}FORMATO
- Un solo título, con el nombre del tema. No lo repitas.
- Subtítulos cortos, uno por ${a}. Primero su dato o definición básica en una viñeta, luego lo demás si corresponde.
- Tabla solo si comparas 3 o más cosas, y esa comparación no se repite en viñetas.
- Ordena de lo más importante a lo menos importante.
- Termina con el último dato del tema: sin tabla resumen, sin fuentes, sin notas, sin conclusión y sin preguntas finales.
- Sin introducción ni conclusión: solo los apuntes, en Markdown, listos para copiar.`}var k=[`Habilidad Lógico Matemático`,`Aritmética`,`Álgebra`,`Geometría`,`Trigonometría`],A=[`Biología`,`Física`,`Química`];function j(e){return k.includes(e)?ce:A.includes(e)?g:h}function ue({curso:e,tema:t}){return`CURSO: ${e}
TEMA: ${t}
PASO 2 de 3: convierte en el JSON de este prompt los apuntes que escribiste en tu mensaje anterior. Ese texto es el material recibido que debes cubrir completo.
Devuelve únicamente el JSON, siguiendo todas las reglas de abajo. Después te pediré el examen; no lo hagas todavía.
${j(e)}`}function M(e){return k.includes(e)?v:A.includes(e)?y:_}function de({curso:e,tema:t}){return`CURSO: ${e}
TEMA: ${t}
PASO 3 de 3: usa como entrada el JSON de teoría que generaste en tu mensaje anterior. Ese JSON es el que «recibes» en el prompt de abajo. Sigue todas las reglas de abajo, incluido el flujo de dos mensajes.
${M(e)}`}async function fe(e){try{if(navigator.clipboard&&window.isSecureContext)return await navigator.clipboard.writeText(e),!0}catch(e){console.error(`Error copiando con la API del portapapeles:`,e)}try{let t=document.createElement(`textarea`);t.value=e,t.setAttribute(`readonly`,``),t.style.position=`fixed`,t.style.opacity=`0`,document.body.appendChild(t),t.select();let n=document.execCommand(`copy`);return document.body.removeChild(t),n}catch(e){return console.error(`Error copiando con el respaldo:`,e),!1}}var N=n(),pe=[{id:`hoy`,label:`Hoy`},{id:`proximos`,label:`Próximos`},{id:`temario`,label:`Temario`}],P=[{id:`letras`,label:`Letras`,cursos:[`Habilidad Verbal`,`Lenguaje`,`Literatura`,`Historia Universal`,`Historia del Perú`,`Filosofía`]},{id:`ciencias`,label:`Ciencias`,cursos:[`Biología`,`Física`,`Química`,`Geografía`,`Educación Cívica`,`Psicología`]},{id:`matematica`,label:`Matemática`,cursos:[`Habilidad Lógico Matemático`,`Aritmética`,`Álgebra`,`Geometría`,`Trigonometría`,`Economía`]}],me=[1,2,3,4,5,6,7,8],F={"Habilidad Lógico Matemático":`R. Matemático`,"Habilidad Verbal":`R. Verbal`};function I(e){return F[e]||e}function L(e){return e.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).toLowerCase()}function R(){let t=e(),[n,i]=(0,p.useState)(`hoy`),[m,h]=(0,p.useState)(()=>te()),[ce,g]=(0,p.useState)(!1),[_,v]=(0,p.useState)(0),[y,b]=(0,p.useState)({isOpen:!1,curso:``,semana:null,tema:``}),[x,S]=(0,p.useState)(()=>ne()),[C,w]=(0,p.useState)({isOpen:!1,id:null,intervaloIdx:null,tema:``}),[T,E]=(0,p.useState)({isOpen:!1,id:null,phase:1}),[D,O]=(0,p.useState)(``),[k,A]=(0,p.useState)(``),[j,M]=(0,p.useState)(!1),[F,R]=(0,p.useState)(!1),[z,B]=(0,p.useState)(1),[V,H]=(0,p.useState)(``),[U,W]=(0,p.useState)(null),[he,G]=(0,p.useState)(!1),[ge,_e]=(0,p.useState)(``),[ve,K]=(0,p.useState)(``),q=(0,p.useRef)(null),J=(0,p.useRef)(null),Y=(0,p.useRef)(null),X=(0,p.useMemo)(()=>ie(_),[_,m]),ye=(0,p.useMemo)(()=>X.filter(e=>e.temas.length>0),[X]),{repasosHoy:be,proximos:xe}=(0,p.useMemo)(()=>o(m),[m]),Se=(0,p.useMemo)(()=>{let e={};return xe.forEach(t=>{e[t.fecha]||(e[t.fecha]=[]),e[t.fecha].push(t)}),e},[xe]),Ce=(0,p.useMemo)(()=>{if(!k)return[];let e=P.find(e=>e.id===k);return e?e.cursos:[]},[k]),we=(0,p.useMemo)(()=>D&&f[D]?.[`semana_${z}`]||[],[D,z]),Te=(0,p.useMemo)(()=>{if(!D)return 1;let e=0;for(let t=1;t<z;t++)e+=(f[D]?.[`semana_${t}`]||[]).length;return e+1},[D,z]);function Ee(e,t,n){let r=0;for(let n=1;n<t;n++)r+=(f[e]?.[`semana_${n}`]||[]).length;return r+n+1}let Z=(0,p.useMemo)(()=>{let e=L(V.trim());if(!e)return[];let t=[];for(let[n,r]of Object.entries(f))for(let[i,a]of Object.entries(r||{})){let r=Number(i.replace(`semana_`,``));for(let i=0;i<(a||[]).length;i++){let o=a[i];L(o).includes(e)&&t.push({curso:n,semana:r,numeroTema:Ee(n,r,i),tema:o})}}return t},[V]),Q=Z[0]||null,$=(0,p.useMemo)(()=>{let e=[];return ye.forEach(t=>{let n=t.curso,r=f[n]||{};t.temas.forEach(t=>{let i=null;for(let[e,a]of Object.entries(r)){let r=(a||[]).indexOf(t);if(r!==-1){let a=Number(e.replace(`semana_`,``));i={curso:n,semana:a,numeroTema:Ee(n,a,r),tema:t};break}}i&&!e.some(e=>e.curso===i.curso&&e.tema===i.tema)&&e.push(i)})}),e},[ye]),De=!D&&!V.trim(),Oe=(0,p.useMemo)(()=>U?[U]:V.trim()?Z:D?we.map((e,t)=>({curso:D,semana:z,numeroTema:Te+t,tema:e})):$,[U,V,Z,D,z,we,Te,$]),ke=D||Q?.curso||``,Ae=D?z:Q?.semana||1,je=!!D||!!Q;(0,p.useEffect)(()=>{function e(e){q.current&&!q.current.contains(e.target)&&M(!1),J.current&&!J.current.contains(e.target)&&R(!1),Y.current&&!Y.current.contains(e.target)&&G(!1),e.target.closest(`.repaso__temario-accion-wrapper`)||K(``)}return document.addEventListener(`mousedown`,e),()=>{document.removeEventListener(`mousedown`,e)}},[]);function Me(e){t(`/?q=${encodeURIComponent(e)}`)}function Ne(e,t,n){l(e,t),S(n=>{let r=d(e,t);return n.includes(r)?n:[...n,r]}),Me(n)}function Pe(e,t,n){x.includes(d(e,t))&&w({isOpen:!0,id:e,intervaloIdx:t,tema:n})}function Fe(){let{id:e,intervaloIdx:t}=C;h(ee(e,[t])),c(e,t),S(n=>n.filter(n=>n!==d(e,t))),w({isOpen:!1,id:null,intervaloIdx:null,tema:``})}function Ie(){w({isOpen:!1,id:null,intervaloIdx:null,tema:``})}function Le(e){E({isOpen:!0,id:e,phase:1})}function Re(){if(T.phase===1){E(e=>({...e,phase:2}));return}h(a(T.id)),E({isOpen:!1,id:null,phase:1})}function ze(){E({isOpen:!1,id:null,phase:1})}function Be(e){A(e),O(``),B(1),W(null),H(``),M(!0),R(!1)}function Ve(e){let t=P.find(t=>t.cursos.includes(e));O(e),A(t?.id||``),B(1),W(null),H(``),M(!1)}function He(){A(``),O(``),B(1),W(null),H(``),M(!0),R(!1)}function Ue(e){let t=Q?.curso,n=P.find(e=>e.cursos.includes(t));!D&&t&&(O(t),A(n?.id||``)),B(e),W(null),R(!1),H(``),G(!1)}function We(e){let t=P.find(t=>t.cursos.includes(e.curso));A(t?.id||``),O(e.curso),B(e.semana),W({curso:e.curso,semana:e.semana,numeroTema:e.numeroTema,tema:e.tema}),G(!1),M(!1),R(!1)}function Ge(e){e.key===`Enter`&&(e.preventDefault(),G(!1))}function Ke(){H(``),G(!1)}function qe(e){let t=V.trim();if(!t)return e;let n=L(t),r=[],i=0;for(;i<e.length;){let t=L(e.slice(i)).indexOf(n);if(t===-1){r.push((0,N.jsx)(`span`,{children:e.slice(i)},i));break}let a=i,o=0;for(;a<e.length&&o<t;)o+=L(e[a]).length,a++;a>i&&r.push((0,N.jsx)(`span`,{children:e.slice(i,a)},`${i}-antes`));let s=a,c=0;for(;s<e.length&&c<n.length;)c+=L(e[s]).length,s++;r.push((0,N.jsx)(`mark`,{className:`repaso__temario-search-highlight`,children:e.slice(a,s)},`${a}-${s}`)),i=s}return r}function Je(e,t){return X.some(n=>n.curso===e&&n.temas.includes(t))}function Ye(e,t,n){return m.some(r=>r.subject===e&&r.tema===n&&r.day===`Semana ${t}`)}function Xe(e,t,n){Ye(e,t,n)||b({isOpen:!0,curso:e,semana:t,tema:n})}function Ze(){b({isOpen:!1,curso:``,semana:null,tema:``})}function Qe(){if(!y.curso||!y.tema||!y.semana){Ze();return}re({subject:y.curso,tema:y.tema,day:`Semana ${y.semana}`}),h(te()),Ze()}function $e(e,t){let n=`${e} ${t} preuniversitario`;window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(n)}`,`_blank`)}function et(e){return Object.entries(f[e]||{}).map(([e,t])=>`Semana ${e.replace(`semana_`,``)}: ${(t||[]).join(` | `)}`).join(`
`)}async function tt(e,t,n){let r=e===1?le({curso:t,tema:n,temarioCurso:et(t),paraJson:!0}):e===3?de({curso:t,tema:n}):ue({curso:t,tema:n}),i=`${t}|${n}|${e}`;if(!await fe(r)){window.alert(`No se pudo copiar al portapapeles.`);return}_e(i),setTimeout(()=>{_e(e=>e===i?``:e)},2e3)}function nt(e,t){let n=le({curso:e,tema:t,temarioCurso:et(e)});window.open(`https://chatgpt.com/?q=${encodeURIComponent(n)}&hints=search`,`_blank`),fe(n)}function rt({curso:e,semana:t,numeroTema:n,tema:r},i=!0,a=!1){let o=Ye(e,t,r),s=!o&&a&&Je(e,r),c=`${e}|${t}|${r}`;return(0,N.jsxs)(`div`,{className:`repaso__temario-item ${o?`repaso__temario-item--done`:s?`repaso__temario-item--recomendado`:``}`,children:[(0,N.jsx)(`div`,{className:`repaso__temario-item-content`,children:(0,N.jsxs)(`button`,{type:`button`,className:`repaso__temario-item-nombre-button`,onClick:()=>Xe(e,t,r),disabled:o,children:[i&&(0,N.jsxs)(`span`,{className:`repaso__temario-item-numero`,children:[n,`)`]}),` `,r]})}),!o&&(0,N.jsxs)(`div`,{className:`repaso__temario-actions`,children:[(0,N.jsx)(`button`,{type:`button`,className:`repaso__temario-action`,onClick:()=>$e(e,r),children:`▶ YouTube`}),(0,N.jsxs)(`div`,{className:`repaso__temario-accion-wrapper`,children:[(0,N.jsxs)(`button`,{type:`button`,className:`repaso__temario-action`,onClick:()=>K(e=>e===c?``:c),children:[`🤖 Prompts`,(0,N.jsx)(`i`,{className:`fa-solid fa-chevron-down`})]}),ve===c&&(0,N.jsxs)(`div`,{className:`repaso__temario-accion-menu`,children:[(0,N.jsx)(`button`,{type:`button`,className:`repaso__temario-accion-menu-item`,onClick:()=>{nt(e,r),K(``)},children:`🤖 Investigar`}),(0,N.jsx)(`button`,{type:`button`,className:`repaso__temario-accion-menu-item`,onClick:()=>tt(2,e,r),children:ge===`${e}|${r}|2`?`✅ Copiado`:`📋 Copiar JSON`}),(0,N.jsx)(`button`,{type:`button`,className:`repaso__temario-accion-menu-item`,onClick:()=>tt(3,e,r),children:ge===`${e}|${r}|3`?`✅ Copiado`:`📄 Copiar Examen`})]})]})]})]},`${e}|${t}|${r}`)}return(0,N.jsx)(`main`,{className:`container__repaso`,children:(0,N.jsxs)(`div`,{className:`repaso`,children:[(0,N.jsx)(r,{section:`repaso`,onAbrirBuscador:()=>g(!0)}),(0,N.jsx)(`div`,{className:`repaso__tabs`,children:pe.map(e=>(0,N.jsx)(`button`,{className:`repaso__tab ${n===e.id?`repaso__tab--active`:``}`,onClick:()=>i(e.id),children:e.label},e.id))}),n===`hoy`&&(0,N.jsxs)(`section`,{className:`repaso__section`,children:[(0,N.jsx)(`div`,{className:`repaso__list`,children:be.map(({entrada:e,intervaloIdx:t,vencido:n})=>{let r=u(t),i=t+1;return(0,N.jsxs)(`div`,{className:`repaso__item ${r.box}`,children:[(0,N.jsxs)(`div`,{className:`repaso__item-body`,children:[(0,N.jsxs)(`div`,{className:`repaso__item-tags`,children:[(0,N.jsxs)(`span`,{className:`repaso__badge ${r.badge}`,children:[`Repaso `,i]}),e.day&&(0,N.jsx)(`span`,{className:`repaso__item-day`,children:e.day}),n&&(0,N.jsx)(`span`,{className:`repaso__item-overdue`,children:`Vencido`})]}),(0,N.jsx)(`h3`,{className:`repaso__item-subject`,children:e.subject}),e.tema&&(0,N.jsxs)(`p`,{className:`repaso__item-tema`,children:[`Tema: `,e.tema]}),(0,N.jsxs)(`p`,{className:`repaso__item-meta`,children:[`Repaso `,i,` de`,` `,s.length,` · `,`Intervalo`,` `,s[t],` día`,s[t]>1?`s`:``]}),(0,N.jsxs)(`button`,{onClick:()=>Ne(e.id,t,e.tema||e.subject),className:`repaso__item-link`,children:[(0,N.jsx)(`i`,{className:`bi bi-book`}),`Repasar`]})]}),(0,N.jsx)(`button`,{onClick:()=>Pe(e.id,t,e.tema||e.subject),className:`repaso__check`,"aria-label":`Marcar repaso como realizado`,title:x.includes(d(e.id,t))?`Marcar repaso como realizado`:`Primero dale a Repasar`,disabled:!x.includes(d(e.id,t)),children:(0,N.jsx)(`svg`,{viewBox:`0 0 24 24`,stroke:`currentColor`,fill:`none`,strokeWidth:`2.5`,width:`16`,height:`16`,children:(0,N.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,d:`m4.5 12.75 6 6 9-13.5`})})}),(0,N.jsx)(`button`,{onClick:()=>Le(e.id),className:`repaso__trash`,"aria-label":`Eliminar repaso`,title:`Eliminar repaso`,children:(0,N.jsx)(`i`,{className:`fa-solid fa-trash`})})]},e.id)})}),be.length===0&&(0,N.jsxs)(`div`,{className:`repaso__empty`,children:[(0,N.jsx)(`div`,{className:`repaso__empty-emoji`,children:`🎉`}),(0,N.jsx)(`p`,{className:`repaso__empty-title`,children:`No tienes repasos pendientes hoy`}),(0,N.jsx)(`p`,{className:`repaso__empty-sub`,children:`Vuelve mañana o completa más cursos en el cronograma`})]})]}),n===`proximos`&&(0,N.jsx)(`section`,{className:`repaso__section`,children:xe.length===0?(0,N.jsxs)(`div`,{className:`repaso__empty`,children:[(0,N.jsx)(`div`,{className:`repaso__empty-emoji`,children:`🎉`}),(0,N.jsx)(`p`,{className:`repaso__empty-title`,children:`No tienes repasos próximos`}),(0,N.jsx)(`p`,{className:`repaso__empty-sub`,children:`Cuando guardes temas, aquí verás cuándo te toca repasarlos`})]}):(0,N.jsx)(`div`,{className:`repaso__proximos-list`,children:Object.keys(Se).sort().map(e=>{let t=Se[e],n=oe(e),r=n===1?`Mañana`:`En ${n} días`;return(0,N.jsxs)(`div`,{className:`repaso__proximos-group`,children:[(0,N.jsxs)(`div`,{className:`repaso__proximos-group-header`,children:[(0,N.jsx)(`span`,{className:`repaso__proximos-fecha`,children:ae(e)}),(0,N.jsx)(`span`,{className:`repaso__proximos-etiqueta`,children:r})]}),t.map(({entrada:e,intervaloIdx:t})=>(0,N.jsxs)(`div`,{className:`repaso__proximos-row`,children:[(0,N.jsxs)(`div`,{className:`repaso__proximos-row-content`,children:[(0,N.jsx)(`span`,{className:`repaso__dot ${u(t).badge}`}),(0,N.jsxs)(`span`,{className:`repaso__proximos-subject`,children:[e.subject,e.tema&&(0,N.jsxs)(`span`,{className:`repaso__proximos-tema`,children:[` `,`— `,e.tema]})]})]}),(0,N.jsx)(`button`,{onClick:()=>Le(e.id),className:`repaso__proximos-trash`,"aria-label":`Eliminar repaso`,title:`Eliminar repaso`,children:(0,N.jsx)(`i`,{className:`fa-solid fa-trash`})})]},e.id))]},e)})})}),n===`temario`&&(0,N.jsxs)(`section`,{className:`repaso__section`,children:[(0,N.jsxs)(`div`,{className:`repaso__temario-toolbar`,children:[(0,N.jsxs)(`div`,{className:`repaso__categoria-wrapper`,ref:q,children:[(0,N.jsxs)(`button`,{type:`button`,className:`repaso__categoria-tab ${j?`repaso__categoria-tab--active`:``}`,onClick:()=>{M(e=>!e),R(!1)},children:[ke?I(ke):k?P.find(e=>e.id===k)?.label:`Curso`,(0,N.jsx)(`i`,{className:`fa-solid fa-chevron-down`})]}),j&&(0,N.jsx)(`div`,{className:`repaso__select`,children:(0,N.jsx)(`div`,{className:`repaso__select-menu`,children:k?(0,N.jsxs)(N.Fragment,{children:[(0,N.jsxs)(`button`,{type:`button`,className:`repaso__select-back`,onClick:He,children:[(0,N.jsx)(`i`,{className:`fa-solid fa-arrow-left`}),`Categorías`]}),Ce.map(e=>(0,N.jsx)(`button`,{type:`button`,className:`repaso__select-option ${D===e?`repaso__select-option--active`:``}`,onClick:()=>Ve(e),children:I(e)},e))]}):P.map(e=>(0,N.jsx)(`button`,{type:`button`,className:`repaso__select-option`,onClick:()=>Be(e.id),children:e.label},e.id))})})]}),(0,N.jsxs)(`div`,{className:`repaso__categoria-wrapper`,ref:J,children:[(0,N.jsxs)(`button`,{type:`button`,disabled:!je,className:`repaso__categoria-tab ${F?`repaso__categoria-tab--active`:``}`,onClick:()=>{if(je){if(!D&&Q){let e=P.find(e=>e.cursos.includes(Q.curso));O(Q.curso),A(e?.id||``),B(Q.semana),W({curso:Q.curso,semana:Q.semana,numeroTema:Q.numeroTema,tema:Q.tema})}R(e=>!e),M(!1)}},children:[`Semana `,Ae,(0,N.jsx)(`i`,{className:`fa-solid fa-chevron-down`})]}),F&&je&&(0,N.jsx)(`div`,{className:`repaso__select`,children:(0,N.jsx)(`div`,{className:`repaso__select-menu`,children:me.map(e=>(0,N.jsxs)(`button`,{type:`button`,className:`repaso__select-option ${Ae===e?`repaso__select-option--active`:``}`,onClick:()=>Ue(e),children:[`Semana `,e]},e))})})]}),(0,N.jsxs)(`div`,{className:`repaso__temario-search`,ref:Y,children:[(0,N.jsxs)(`div`,{className:`repaso__temario-search-input`,children:[(0,N.jsx)(`i`,{className:`fa-solid fa-magnifying-glass`}),(0,N.jsx)(`input`,{type:`text`,value:V,placeholder:`Buscar tema...`,onChange:e=>{H(e.target.value),W(null),G(!0)},onFocus:()=>{V.trim()&&G(!0)},onKeyDown:Ge,"aria-label":`Buscar tema en el temario`}),V&&(0,N.jsx)(`button`,{type:`button`,onClick:Ke,"aria-label":`Limpiar búsqueda`,title:`Limpiar búsqueda`,children:(0,N.jsx)(`i`,{className:`fa-solid fa-xmark`})})]}),he&&V.trim()&&(0,N.jsx)(`div`,{className:`repaso__temario-search-results`,children:Z.length>0?Z.slice(0,8).map(e=>(0,N.jsxs)(`button`,{type:`button`,className:`repaso__temario-search-result`,onClick:()=>We(e),children:[(0,N.jsx)(`span`,{className:`repaso__temario-search-result-tema`,children:qe(e.tema)}),(0,N.jsxs)(`span`,{className:`repaso__temario-search-result-meta`,children:[I(e.curso),` · `,`Semana `,e.semana,` · `,`Tema`,` `,String(e.numeroTema).padStart(2,`0`)]})]},`${e.curso}|${e.semana}|${e.tema}`)):(0,N.jsx)(`div`,{className:`repaso__temario-search-empty`,children:`No se encontró ningún tema.`})})]})]}),De&&(0,N.jsxs)(N.Fragment,{children:[(0,N.jsxs)(`div`,{className:`repaso__temario-recomendado-nav`,children:[_===1&&(0,N.jsxs)(`button`,{type:`button`,className:`repaso__temario-recomendado-nav-button`,onClick:()=>v(0),"aria-label":`Día anterior`,children:[(0,N.jsx)(`i`,{className:`bi bi-arrow-left`}),`Anterior`]}),_===0&&(0,N.jsxs)(`button`,{type:`button`,className:`repaso__temario-recomendado-nav-button`,onClick:()=>v(1),"aria-label":`Día siguiente`,children:[`Siguiente`,(0,N.jsx)(`i`,{className:`bi bi-arrow-right`})]})]}),(0,N.jsxs)(`div`,{className:`repaso__temario-list`,children:[(()=>{let e=$.reduce((e,t)=>(e[t.curso]||(e[t.curso]=[]),e[t.curso].push(t),e),{});return Object.entries(e).map(([e,t])=>(0,N.jsxs)(`div`,{className:`repaso__temario-grupo`,children:[(0,N.jsx)(`div`,{className:`repaso__temario-grupo-nombre`,children:I(e)}),(0,N.jsx)(`div`,{className:`repaso__temario-list`,children:t.map(e=>rt(e,!1,!1))})]},e))})(),$.length===0&&(0,N.jsx)(`p`,{className:`repaso__proximos-empty`,children:`No tienes temas pendientes para este día.`})]})]}),(D||V.trim())&&(0,N.jsxs)(`div`,{className:`repaso__temario-list`,children:[Oe.map(e=>rt(e,!0,!0)),Oe.length===0&&(0,N.jsx)(`p`,{className:`repaso__proximos-empty`,children:`No se encontró ningún tema.`})]})]}),(0,N.jsx)(se,{open:ce,onClose:()=>g(!1),onSelect:e=>{g(!1),Me(e.type===`curso`?e.nombre:e.tema)}}),T.isOpen&&(0,N.jsx)(`div`,{className:`delete-modal-overlay`,children:(0,N.jsxs)(`div`,{className:`delete-modal-content`,children:[(0,N.jsx)(`div`,{className:`delete-modal-icon`,children:(0,N.jsx)(`i`,{className:`fa-solid fa-triangle-exclamation`})}),(0,N.jsx)(`h3`,{className:`delete-modal-title`,children:`¿Eliminar repaso?`}),(0,N.jsx)(`p`,{className:`delete-modal-text`,children:T.phase===1?`Esta acción requiere confirmación. Selecciona Aceptar para continuar.`:`¡Atención! ¿Estás completamente seguro de borrarlo?`}),(0,N.jsxs)(`div`,{className:`delete-modal-buttons ${T.phase===1?`delete-modal-buttons--reverse`:``}`,children:[(0,N.jsx)(`button`,{onClick:Re,className:`btn-confirm ${T.phase===1?`btn-confirm--phase1`:`btn-confirm--phase2`}`,children:T.phase===1?`Aceptar`:`Sí, borrar`}),(0,N.jsx)(`button`,{onClick:ze,className:`btn-cancel`,children:`Cancelar`})]})]})}),y.isOpen&&(0,N.jsx)(`div`,{className:`repaso__confirm-toast`,children:(0,N.jsxs)(`div`,{className:`repaso__confirm-toast-content`,children:[(0,N.jsxs)(`div`,{className:`repaso__confirm-toast-info`,children:[(0,N.jsx)(`i`,{className:`fa-solid fa-calendar-check`}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`strong`,{children:`Guardar repaso`}),(0,N.jsx)(`span`,{children:y.tema})]})]}),(0,N.jsxs)(`div`,{className:`repaso__confirm-toast-actions`,children:[(0,N.jsx)(`button`,{type:`button`,className:`repaso__confirm-toast-cancel`,onClick:Ze,children:`Cancelar`}),(0,N.jsx)(`button`,{type:`button`,className:`repaso__confirm-toast-confirm`,onClick:Qe,children:`Aceptar`})]})]})}),C.isOpen&&(0,N.jsx)(`div`,{className:`repaso__confirm-toast`,children:(0,N.jsxs)(`div`,{className:`repaso__confirm-toast-content`,children:[(0,N.jsxs)(`div`,{className:`repaso__confirm-toast-info`,children:[(0,N.jsx)(`i`,{className:`fa-solid fa-calendar-check`}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`strong`,{children:`¿Seguro que quieres guardar?`}),(0,N.jsx)(`span`,{children:C.tema})]})]}),(0,N.jsxs)(`div`,{className:`repaso__confirm-toast-actions`,children:[(0,N.jsx)(`button`,{type:`button`,className:`repaso__confirm-toast-cancel`,onClick:Ie,children:`Cancelar`}),(0,N.jsx)(`button`,{type:`button`,className:`repaso__confirm-toast-confirm`,onClick:Fe,children:`Sí, guardar`})]})]})})]})})}export{R as default};