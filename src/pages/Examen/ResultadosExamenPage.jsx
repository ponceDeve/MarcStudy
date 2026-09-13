import { useEffect, useRef, useState } from "react";

import LatexText from "../../components/LatexText";

import PreguntaSimulacro from "./PreguntaSimulacro";

const ICONO_CURSO = {
  RVE: "bi-chat-left-text",
  RMA: "bi-calculator",
  ARI: "bi-123",
  GEM: "bi-bounding-box",
  ALG: "bi-asterisk",
  TRI: "bi-triangle",
  LEN: "bi-fonts",
  LIT: "bi-book",
  PSI: "bi-people",
  CIV: "bi-bank",
  HPE: "bi-flag",
  HIS: "bi-globe-americas",
  GEO: "bi-map",
  ECO: "bi-currency-dollar",
  FIL: "bi-lightbulb",
  FIS: "bi-magnet",
  QUI: "bi-droplet",
  BIO: "bi-flower1",
};

const ICONO_ESTADO = {
  correcta: <i className="fas fa-check-circle" style={{ color: "var(--success)" }} />,
  incorrecta: <i className="fas fa-times-circle" style={{ color: "var(--danger)" }} />,
  blanco: <i className="fas fa-minus-circle" style={{ color: "var(--ink-faint)" }} />,
};

const TEXTO_ESTADO = {
  correcta: "Correcta",
  incorrecta: "Incorrecta",
  blanco: "Sin responder",
};

const MENSAJES_POR_CURSO = {
  RVE: [
    ["Causa, ni el menú del chifa entiendes. Bica fija.", "Lees y parece que estuvieras descifrando un huaco.", "Ese nivel de lectura no te salva ni en el sustitutorio.", "Hasta el Turnitin tiene más comprensión que tú."],
    ["Mucho parafraseo bamba, cero análisis, qué palta.", "Tu comprensión está más perdida que cachimbo en su primer día.", "El autor se retuerce en su tumba con tu resumen.", "Lees y respondes por puro champazo, mano."],
    ["Pasaste raspando, con la justa y encomendándote a Sarita Colonia.", "Entendiste la mitad, la otra te metiste un floro mareador.", "Avanzas, pero pareces combi en hora punta: a puros frenazos.", "Casi casi, pero todavía te falta calle y horas de biblioteca."],
    ["Ya estás dejando de ser un simple mortal. Buen floro.", "Buen floro, pero con sustento. Así aguanta tu marco teórico.", "Lees bien, ya no das pena en los controles de lectura.", "Ya pareces estudiante de verdad, estás pa' ser asistente del profe."],
    ["Qué abuso, interpretas mejor que Vargas Llosa en sus buenos tiempos.", "Crack, ya saca tu tesis de una vez y deja de humillarnos.", "Ni Borges te hace sudar frío en el parcial.", "Nivel pro, seguro eres el chancón que le pasa las fijas al salón."]
  ],

  RMA: [
    ["Tus números están más cruzados que rutas del Chosicano.", "La bica está asegurada con esa lógica de mercado central.", "Ni contando con los dedos la haces, causa, qué roche.", "Tu razonamiento es un mito urbano, nunca nadie lo vio."],
    ["Tus pasos lógicos son saltos mortales, te vas a romper el cuello.", "Metes fórmulas por meter, pareces chamán haciendo amarres.", "Ni Pitágoras con ayahuasca te entiende el procedimiento.", "Tus números hacen huelga cada vez que agarras el lápiz."],
    ["Salió la respuesta, pero tu procedimiento parece arte abstracto.", "Aprobaste por un milagro, agradece al profe de práctica.", "Le metiste champa y ligó, pero te falta orden, compare.", "Estás a medio camino entre jalar y pasar raspando."],
    ["Ya piensas como ingeniero, se nota que dejaste el Dota.", "Tus pasos tienen sentido, estás asegurando el parcial.", "La lógica ya no te abandona, bien jugado, causa.", "Tus números ya cuadran sin tener que forzar la respuesta."],
    ["Eres un bravo, seguro ya estás enseñando en la pre.", "Ni Euclides te corrige, tienes nivel de decano.", "Tus desarrollos son arte puro, saca tu doctorado de una vez.", "La lógica te fluye natural, ya estás para beca en el extranjero."]
  ],

  ARI: [
    ["Ni las tablas del 1, mano. Regresa a primaria, sin roche.", "Sumas y restas te derrotan más rápido que fin de quincena.", "La aritmética te trae de hijo, asúmelo.", "Tus fracciones están más divididas que el Congreso."],
    ["Multiplicas como si jugaras a la tómbola, puro azar.", "Tus divisiones dejan más residuo que playa en Año Nuevo.", "Ni con la científica del celular llegas al resultado.", "Las proporciones te hacen bullying desde el colegio."],
    ["Ya cuadra algo, pero eres más lento que trámite del Estado.", "Tus operaciones están chuecas, pero llegas a la meta.", "Te salvas del susti, pero no te confíes, causa.", "Más o menos, le metes punche pero te falta ritmo."],
    ["Tus cuentas ya cuadran, pareces cajero en quincena.", "La aritmética ya no te asusta, estás agarrando cancha.", "Ya sacas porcentajes al ojo, bien ahí.", "Sumas y restas con el estilo de un bravo."],
    ["Crack, hasta raíces sacas mentalmente, qué abuso.", "Eres la pesadilla de los parciales, pura nota alta.", "Tus cuentas son tan perfectas que pareces auditor de la SUNAT.", "La aritmética te rinde pleitesía, causa."]
  ],

  GEM: [
    ["Ni un triángulo dibujas bien, parece un nacho aplastado.", "Tus trazos tienen menos pulso que combi en trocha.", "Tus figuras geométricas son puro garabato de nido.", "Eres el enemigo público de la regla y el compás."],
    ["Confundes radio con diámetro, qué tal palta.", "Tus cálculos de área son puro invento, tas volando.", "El plano cartesiano te marea más que tres vasos de pisco.", "Tus ángulos están más cerrados que tus oportunidades de pasar."],
    ["Ya calculas algo, pero tus gráficos siguen dando pena.", "Tus perímetros cuadran, de puro milagro nomás.", "Avanzas, pero con más curvas que la bajada de Armendáriz.", "Pasas el curso, pero te falta precisión, compare."],
    ["Tus figuras ya tienen forma, seguro usaste transportador.", "El espacio ya no te marea, te estás volviendo trome.", "Tus proyecciones tienen sentido, aseguras el promedio.", "Tus áreas cuadran como piezas de Tetris."],
    ["Dibujas tan bien que ya pareces estudiante de Arquitectura.", "Ni Pitágoras te corrige los catetos, monstruo.", "Tus sólidos geométricos parecen en 3D, qué nivel.", "La geometría plana se quedó chica para ti."]
  ],

  ALG: [
    ["Ni la 'X' de tu ex puedes despejar, mano.", "El álgebra te tiene pisado, acéptalo y ve a la bica.", "Tus ecuaciones parecen lista del mercado.", "Si las variables cobraran, ya estarías quebrado."],
    ["Agrupas términos como si estuvieras armando un tono: puro desorden.", "Tus polinomios dan más risa que los cómicos ambulantes.", "Ley de signos, causa... ¡ley de signos! Qué abuso.", "Tus matrices están más enredadas que cable de luz en el Centro."],
    ["Ya despejas, pero a paso de tortuga con artrosis.", "Llegas al resultado, pero tu hoja parece campo de batalla.", "Te salvaste por un pelito, pero no te me duermas.", "Factorizas a medias, dale una revisada a tu Baldor."],
    ["Tus sistemas de ecuaciones ya no colapsan, bien jugado.", "El álgebra ya no te hace sudar frío en la pizarra.", "Tus incógnitas se rinden ante ti, puro talento.", "Tus productos notables ya son pan comido."],
    ["Resuelves tan rápido que pareces calculadora humana.", "A tu lado, Ruffini era un simple aficionado.", "Tus inecuaciones son perfectas, nivel NASA.", "El álgebra te hace los mandados, crack total."]
  ],

  TRI: [
    ["Ni el seno de tu flaca conoces, causa. Cero en trigo.", "Tus ángulos de elevación te llevan directo al sótano de las notas.", "Confundes hipotenusa con cateto, pide tu retiro de curso ya.", "Identidades trigonométricas que parecen jeroglíficos para ti."],
    ["Metes tangente donde va coseno, qué tal ensalada rusa.", "Tus reducciones al primer cuadrante se van al quinto.", "Ni con la chanchita del salón apruebas esta.", "Tus razones trigonométricas no tienen ninguna razón de ser."],
    ["Ya usas el SOH-CAH-TOA, pero te sigues tropezando.", "Te sale la respuesta, pero el procedimiento es un sancochado.", "Le metes fórmula a la mala y champa, pero sirve.", "Más o menos, pero si te ponen un problema tranca, vuelas."],
    ["Tus identidades ya cuadran sin tener que inventar pasos.", "La trigonometría dejó de ser tu cuco, bien ahí.", "Tus ángulos ya te hacen caso, estás filito.", "Resuelves los triángulos como todo un topógrafo."],
    ["Crack, calculas los radianes al ojo y sin pestañear.", "Ni Hiparco te aguanta un mano a mano en la pizarra.", "Dominas el círculo trigonométrico como si fuera tu barrio.", "Ya estás para dar cátedra, monstruo de las matemáticas."]
  ],

  LEN: [
    ["Ni las tildes respetas, tu ortografía da cataratas.", "Escribes peor que cobrador de combi dictando la ruta.", "Tus oraciones no tienen pies ni cabeza, qué tal palta.", "Si la RAE lee tus mensajes, te mandan a prisión preventiva."],
    ["Confundes 'ay', 'ahí' y 'hay'. Mereces la trica automática.", "Tus reglas gramaticales son un invento tuyo, ¿no?", "Ni el autocorrector te puede salvar de esa redacción.", "Tu sintaxis parece traducida de Google Translate en 2010."],
    ["Se te entiende, pero metes unas comas más falsas que billete de 30.", "Tus frases son medio chuecas, pero pasan piola.", "Sobrevives en redacción, pero te falta leer más, causa.", "Tienes la idea, pero te enredas como auricular en el bolsillo."],
    ["Buena redacción, ya pareces de Letras, ah.", "Tus tildes diacríticas están precisas, mis respetos.", "Tu floro está bien estructurado, da gusto leerte.", "Ya conectas oraciones sin sonar como Tarzán."],
    ["Escribes tan bien que ya deberías estar publicando tu libro.", "Ni Martha Hildebrandt te encontraría una falta, maestro.", "Tu prosa tiene un nivel que humilla a los de comunicaciones.", "El lenguaje es tu juguete, eres el señor de las letras."]
  ],

  LIT: [
    ["Ni el resumen de Rincón del Vago te salva de esta.", "Crees que 'Cien años de soledad' es un documental, tas mal.", "Tus lecturas son puros memes, la literatura te queda grande.", "Eres el enemigo número uno de la poesía contemporánea."],
    ["Confundes al autor con el protagonista, qué sano eres.", "Tus interpretaciones del texto parecen delirio de fiebre.", "Tu análisis literario tiene la profundidad de un charco.", "Las figuras literarias te pasan por encima como aplanadora."],
    ["Lees, pero te quedas jato en el segundo capítulo.", "Le atinas al tema principal, de puro champazo.", "Avanzas con la lectura, pero los simbolismos te marean.", "Tienes la idea, pero te falta ese toque bohemio para entenderlo."],
    ["Tus análisis ya tienen peso, buen ensayo te mandaste.", "Las metáforas ya no te engañan, estás fino con el texto.", "Ya captas la ironía del autor, bien ahí, causa.", "Desmenuzas el libro como si fueras crítico de El Comercio."],
    ["Lees con una profundidad que daría envidia a Mario Vargas Llosa.", "Tus ensayos son una joya, ya estás para Premio Cervantes.", "Entiendes a Vallejo mejor que él mismo, eres un fuera de serie.", "La literatura es tu cancha, crack total de las humanidades."]
  ],

  PSI: [
    ["Tus traumas no te dejan entender el curso. Bica de frente.", "Crees que la psicología es leer las cartas, palta total.", "Tus conceptos de la mente humana son puro mito de tiktoker.", "A ti ni Freud te saca los complejos que tienes con el estudio."],
    ["Confundes condicionamiento clásico con el menú del día.", "Tus diagnósticos al ojo son un peligro para la sociedad.", "Ni con el DSM-5 en la mano le atinas a una, causa.", "El profe de psicología te usa de caso clínico de lo perdido que estás."],
    ["Ya entiendes alguito, pero tu análisis es bien telón.", "Identificas el trastorno, pero te confundes en la terapia.", "Pasas el parcial, pero yo no me dejaría psicoanalizar por ti.", "Le metes floro psicológico, pero se nota que te falta lectura."],
    ["Tu marco teórico ya tiene base sólida, no es puro cuento.", "Ya entiendes a Pavlov sin tener que babear en el intento.", "Tus análisis de caso son precisos, aseguras buena nota.", "El inconsciente ya no es un misterio para ti, bien bajado."],
    ["Analizas la psique humana como un monstruo de la facultad.", "Ni Jung se mandaba unas teorías tan bravas como las tuyas.", "Tus diagnósticos son perfectos, ya pon tu consultorio.", "Eres un maestro de la conducta, tienes la mente clara."]
  ],

  CIV: [
    ["Ni sabes quién es el presidente, causa. Estás en la luna.", "Tus derechos constitucionales son los que te inventas en la combi.", "Vives en anarquía total, la cívica te entra por una oreja y sale por la otra.", "Si dependiera de ti, seguiríamos en la época del virreinato."],
    ["Confundes deber con derecho, típico vivo de la cuadra.", "Tus normas de convivencia son 'el que pestañea pierde'.", "No sabes ni qué hace el Congreso, pero bien que te quejas.", "Tu conocimiento de las leyes es puro floro de abogado bamba."],
    ["Ya te sabes la Constitución, pero la de los años 90.", "Entiendes las normas, pero te falta calle cívica.", "Pasas raspando, al menos ya sabes qué es la ONPE.", "Tienes noción, pero si te agarran en un debate, te hacen papilla."],
    ["Hablas de ciudadanía con propiedad, ya no das vergüenza.", "Tus derechos ya los defiendes con base legal, bien ahí.", "Conoces los poderes del Estado sin tartamudear en la expo.", "Tus argumentos cívicos tienen peso, apruebas sobrado."],
    ["Crack, te sabes la Constitución de memoria al derecho y al revés.", "Ni el Tribunal Constitucional te gana una discusión.", "Tienes alma de jurista, deberías meterte a la política para arreglar esto.", "Eres un ciudadano modelo, el país necesita más bravos como tú."]
  ],

  HPE: [
    ["Crees que Bolognesi saltó del Morro. Tas hasta el perno, causa.", "La historia del Perú te duele más que el gol de Gareca en repechaje.", "Para ti, los incas montaban dinosaurios. Retírate del curso.", "Tu memoria histórica es más frágil que puente de la Solidaridad."],
    ["Confundes a Grau con San Martín. Qué falta de respeto a la patria.", "Tus resúmenes de la guerra del Pacífico son puro chisme de barrio.", "No sabes ni en qué año fue la independencia, palta monumental.", "Te hablan de la República Aristocrática y piensas en discotecas."],
    ["Sabes alguito, pero ordenas las épocas peor que rompecabezas de 1000 piezas.", "Te acuerdas de los héroes, pero te olvidas de por qué pelearon.", "Sobrevives al curso de historia, pero con puro planchazo antes del examen.", "Pasas piola, pero tu conocimiento es bien superficial, mano."],
    ["Ya conectas las eras, tu línea de tiempo tiene lógica.", "Hablas de la Guerra con Chile con base y sin resentimiento, bien ahí.", "Ya no patinas con los presidentes del siglo XX, trome.", "Te manejas bien en historia, no caes en el floro barato."],
    ["Narras el pasado como si fueras la reencarnación de Jorge Basadre.", "Tus ensayos históricos tienen nivel de tesis de San Marcos.", "Conoces la historia del Perú tan a fondo que hasta duele.", "Eres un orgullo nacional, la historia te aplaude de pie."]
  ],

  HIS: [
    ["Crees que los romanos pelearon en la Segunda Guerra Mundial. Triste.", "La historia universal te queda más grande que terno prestado.", "No sabes ni dónde queda Mesopotamia, y eso que está en el mapa.", "Si viajas en el tiempo, te extinguen por sano."],
    ["Confundes la Edad Media con la prehistoria, un desastre total.", "Tus líneas de tiempo parecen electrocardiogramas de un infartado.", "Te hablan de la Revolución Francesa y piensas en pan baguete.", "El profe corrige tu examen y le da depresión histórica."],
    ["Entiendes las épocas, pero cruzas los datos como loco.", "Al menos sabes quién ganó la Guerra Fría, te salvas de la bica.", "Avanzas en el curso, pero tu memoria retiene solo los chismes de los reyes.", "Más o menos, pero si te preguntan fechas exactas, te palteas feo."],
    ["Tu visión del mundo ya tiene orden cronológico, nada mal.", "Entiendes las causas y consecuencias sin meter chamullo.", "Los imperios antiguos ya no te son un misterio, estás fino.", "Tienes buena memoria histórica, aseguras un buen promedio."],
    ["Analizas la historia como si fueras un académico de Oxford.", "Ni Hobsbawm te aguanta un debate sobre el siglo XX.", "Entiendes el contexto global a la perfección, eres un bravo.", "Dominas las eras, eres el guardián del tiempo en el salón."]
  ],

  GEO: [
    ["Te pierdes hasta con el Google Maps en tu propio barrio.", "Tus conocimientos de geografía dan más pena que río Rímac en verano.", "Crees que Europa es un país, tu ignorancia es continental.", "No ubicas ni el norte, menos vas a ubicar las cordilleras."],
    ["Confundes latitud con altitud. Te vas de frente a la trica.", "Pones ríos en medio del desierto en tus mapas mudos, qué sano.", "Las placas tectónicas se mueven menos que tú en clase.", "Para ti el meridiano de Greenwich es una marca de relojes."],
    ["Ya ubicas los continentes, pero tus capitales son puro invento.", "Entiendes de climas, pero el relieve te sigue dando problemas.", "No jalas, pero si te mandan a explorar, no regresas vivo.", "Al menos sabes leer una brújula, te defiendes a medias."],
    ["Tus mapas ya tienen sentido, estás ubicándote bien en el mundo.", "La geomorfología dejó de ser un dolor de cabeza para ti.", "Conoces los husos horarios sin tener que contar con los dedos.", "Tienes buena ubicación espacial, apruebas con solidez."],
    ["Eres un crack, Antonio Raimondi te pediría consejos.", "Conoces las coordenadas geográficas de memoria, monstruo.", "Dominas la geografía como si hubieras viajado por todo el planeta.", "Tus conocimientos espaciales son de nivel de explorador de National Geographic."]
  ],

  ECO: [
    ["Crees que la inflación es cuando inflas un globo. Cero total.", "Tus finanzas personales son el reflejo de lo perdido que estás en Economía.", "Si tú manejaras el Banco Central, seríamos Venezuela en dos días.", "El PBI de tu conocimiento es negativo, causa. Bica fija."],
    ["Confundes microeconomía con ahorrar en el micro. Paltaaza.", "Tus curvas de oferta y demanda parecen montaña rusa de Play Land Park.", "Hablas de libre mercado pero quieres todo gratis, incoherente total.", "Tus proyecciones económicas tienen menos futuro que billete de Monopolio."],
    ["Entiendes lo básico, pero si te hablan de elasticidad, patinas duro.", "Pasas raspando, seguro eres de los que compra caro y vende barato.", "Ya sabes qué es el tipo de cambio, pero te mareas con los impuestos.", "Sobrevives al curso, pero no te confiaría ni la chanchita de la promo."],
    ["Tus gráficos ya cuadran y el mercado te empieza a dar la razón.", "Entiendes las políticas fiscales sin aburrirte, ya eres un trome.", "Calculas el costo de oportunidad como un buen negociante.", "Tu análisis macroeconómico está bien sustentado, aseguras nota."],
    ["Analizas el mercado mejor que el Ministro de Economía, crack.", "Ni Adam Smith ni Keynes te podrían debatir en la pizarra.", "Eres el lobo de Wall Street de la facultad, puras notas perfectas.", "La economía te fluye por las venas, ya estás para asesor financiero."]
  ],

  FIL: [
    ["Tu mayor duda filosófica es si la combi va vacía. Cero profundidad.", "Para ti, Sócrates es solo un nombre de perro. Das pena académica.", "Tus reflexiones tienen la profundidad de un plato tendido.", "Si Descartes te viera, diría: 'No piensas, luego no existes'."],
    ["Confundes a Platón con un plato grande. Retírate del salón, por favor.", "Metes un floro pseudofilosófico que no te lo compras ni tú mismo.", "Tus ensayos sobre la moral son puro copia y pega del rincón del vago.", "El nihilismo no es excusa para sacar cero en todas las prácticas, causa."],
    ["Ya te cuestionas las cosas, pero te quedas atrapado en el limbo.", "Entiendes los mitos, pero las ideas complejas te fríen el cerebro.", "Pasas el curso metiendo labia, pero te falta leer a los clásicos.", "Eres aprendiz de filósofo, pero todavía te gana el sueño leyendo a Kant."],
    ["Tus argumentos ya tienen peso, tu silogismo está bien armado.", "La dialéctica ya no te humilla, sabes debatir con base.", "Entiendes a Nietzsche sin volverte loco en el intento, bien ahí.", "Tus ensayos filosóficos invitan a pensar, aseguras buen promedio."],
    ["Crack total, desarmas argumentos falaces como si nada.", "Aristóteles estaría orgulloso de tenerte en el Liceo, monstruo.", "Tu nivel de abstracción es brutal, ya deberías estar dando conferencias.", "La filosofía no es tu curso, es tu estilo de vida. Nivel Dios."]
  ],

  FIS: [
    ["Contigo la manzana de Newton nunca cayó, se quedó flotando por bruto.", "La física te revuelca peor que ola de La Herradura en invierno.", "Tus diagramas de cuerpo libre parecen garabatos de nido.", "Crees que la inercia es solo tu estado natural los domingos. Bica."],
    ["Confundes masa con peso y velocidad con aceleración. Tas frito.", "Tus cálculos de fricción patinan más que llanta lisa en lluvia.", "Metes fórmulas a la champa a ver si liga. Eso no es ciencia, mano.", "Tus resultados de cinemática te mandan los autos al espacio exterior."],
    ["Ya te sale la respuesta, pero tus unidades están todas mezcladas.", "Resuelves los problemas clásicos, pero ponle una variante y vuelas.", "Pasas física, pero con fe en el factor de corrección del profe.", "Llegas a la solución a tropezones, te falta dominar la teoría."],
    ["Tus vectores ya tienen dirección y sentido, vas por buen camino.", "Las leyes de Newton te obedecen, calculas tensiones como un capo.", "La termodinámica ya no te hace sudar, tienes el curso controlado.", "Despejas las ecuaciones de física con elegancia, apruebas sobrado."],
    ["Monstruo, resuelves los problemas de la UNI mirándolos nomás.", "Einstein te pediría ayuda con sus teorías si estuviera vivo.", "Tus cálculos son de un nivel cuántico, eres el orgullo de ciencias.", "La física te hace los mandados, estás a otro nivel, genio total."]
  ],

  QUI: [
    ["No sabes ni la fórmula del agua, causa. Estás más perdido que cuy en tómbola.", "La química te hace una reacción explosiva en el cerebro. Cero absoluto.", "Tu entendimiento de la tabla periódica es puro cuento de hadas.", "Si entras al laboratorio, seguro lo incendias por error."],
    ["Confundes enlace covalente con iónico, jalas por sano.", "Tus balances de ecuaciones dan números negativos. ¿Cómo haces eso, mano?", "Metes los reactivos como si estuvieras cocinando sopa, un desastre.", "Tu mol de conocimiento equivale a cero. Despídete del curso."],
    ["Haces el balanceo al tanteo, pero te demoras media hora.", "Conoces los elementos, pero nombrar compuestos te traba la lengua.", "Te salvas en la teoría, pero en laboratorio eres un peligro constante.", "Pasas química con las justas, tu estequiometría es bien precaria."],
    ["Tus reacciones ya cuadran al milímetro, estás afinando el lápiz.", "La química orgánica ya no te da pesadillas, dibujas bien los anillos.", "Conoces las valencias de memoria y aplicas bien las leyes.", "Ya pareces Walter White, pero para los estudios. Bien jugado."],
    ["Crack de los matraces, mezclas como si fueras el mismo Lavoisier.", "Ni Mendeleiev te gana armando estructuras químicas, monstruo.", "Tus titulaciones son perfectas, nivel de ingeniero químico graduado.", "La química se inclina ante ti. Tienes el 20 asegurado en el final."]
  ],

  BIO: [
    ["Crees que la mitocondria es una enfermedad. Triste tu caso, mano.", "La biología te humilla, seguro piensas que las plantas no respiran.", "No sabes ni dónde tienes el hígado. Bica asegurada en el ciclo.", "Eres la prueba viva de que la evolución a veces se detiene."],
    ["Confundes mitosis con meiosis y virus con bacteria. Palta de la buena.", "Tus cadenas de ADN parecen fideos enredados, cero conocimiento.", "Si de ti dependiera la clasificación taxonómica, todo sería un perro.", "Tus exposiciones sobre los ecosistemas dan sueño y pena a la vez."],
    ["Entiendes alguito de la célula, pero te olvidas los organelos.", "Sabes lo básico del cuerpo humano, pero en genética te cruzas mal.", "Pasas raspando, seguro chapaste las fijas de los ciclos pasados.", "Haces tus disecciones a la mala, te falta delicadeza científica."],
    ["Tus conocimientos de genética ya tienen sentido, cuadros de Punnett finos.", "Entiendes el ciclo de Krebs sin que te dé un derrame cerebral.", "La anatomía ya no te asusta, estás agarrando el ritmo de ciencias.", "Tu base biológica está fuerte, estás listo para cursos más pesados."],
    ["Crack, analizas los tejidos mejor que un microscopio electrónico.", "Darwin se levantaría a aplaudirte, eres una bestia en biología.", "Conoces las rutas metabólicas como las calles de tu barrio.", "Nivel Dios biológico. Te mereces tu bata blanca y tu premio Nobel ya."]
  ]
};

function obtenerMensajeSegunCurso(curso, porcentaje, usadosPorCurso) {
  const mensajesCurso = MENSAJES_POR_CURSO[curso];

  if (!mensajesCurso) return "";

  let nivel = 0;

  if (porcentaje > 80) nivel = 4;
  else if (porcentaje > 60) nivel = 3;
  else if (porcentaje > 40) nivel = 2;
  else if (porcentaje > 20) nivel = 1;

  const mensajes = mensajesCurso[nivel];

  if (!mensajes?.length) return "";

  if (!usadosPorCurso[curso]) usadosPorCurso[curso] = [];

  const usados = usadosPorCurso[curso];

  if (usados.length >= mensajes.length) usados.length = 0;

  const disponibles = mensajes
    .map((_, indice) => indice)
    .filter((indice) => !usados.includes(indice));

  const indiceElegido =
    disponibles[Math.floor(Math.random() * disponibles.length)];

  usados.push(indiceElegido);

  return mensajes[indiceElegido];
}

function PreguntaResultado({ item, numero, abierta, onToggle }) {
  const { pregunta, estado, puntos, respuesta } = item;

  return (
    <li
      className={`resultados-examen__pregunta is-${estado} ${abierta ? "is-abierta" : ""
        }`}
    >
      <button
        type="button"
        className="resultados-examen__pregunta-header"
        onClick={onToggle}
      >
        {ICONO_ESTADO[estado]}

        <span className="resultados-examen__pregunta-texto">
          {abierta ? pregunta.tema || `Pregunta ${numero}` : `Pregunta ${numero}`}
        </span>

        <span className="resultados-examen__pregunta-estado">
          {TEXTO_ESTADO[estado]}
        </span>

        <span className="resultados-examen__pregunta-puntos">
          {puntos > 0 ? `+${puntos}` : puntos}
        </span>

        <i
          className={`fas fa-chevron-${abierta ? "up" : "down"}`}
        />
      </button>

      {abierta && (
        <div className="resultados-examen__explicacion">
          <div className="question-card resultados-examen__detalle-pregunta">
            <div className="question-card__inner">
              <PreguntaSimulacro
                pregunta={pregunta}
                respuesta={respuesta}
                onCambiar={() => { }}
                modoResultado
              />
            </div>
          </div>

          {pregunta.explicacion && (
            <p className="resultados-examen__explicacion-texto">
              <LatexText>{pregunta.explicacion}</LatexText>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function SelectorCurso({ grupos, cursoSeleccionado, onSeleccionar }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const selectorRef = useRef(null);

  const grupoActual = grupos.find(
    (grupo) => grupo.curso === cursoSeleccionado
  );

  const gruposFiltrados = grupos
    .filter((grupo) =>
      grupo.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      if (a.curso === cursoSeleccionado) return -1;
      if (b.curso === cursoSeleccionado) return 1;
      return 0;
    });

  useEffect(() => {
    function manejarClickFuera(event) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        cerrar();
      }
    }

    if (abierto) {
      document.addEventListener("mousedown", manejarClickFuera);
    }

    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
    };
  }, [abierto]);

  function abrir() {
    setBusqueda("");
    setAbierto(true);
  }

  function cerrar() {
    setBusqueda("");
    setAbierto(false);
  }

  function seleccionar(grupo) {
    onSeleccionar(grupo.curso);
    cerrar();
  }

  return (
    <div
      ref={selectorRef}
      className={`selector-busqueda ${abierto ? "is-abierto" : ""
        }`}
    >
      {!abierto ? (
        <button
          type="button"
          className="selector-busqueda__control"
          onClick={abrir}
          aria-expanded={false}
          aria-haspopup="listbox"
        >
          <i
            className={`bi ${ICONO_CURSO[grupoActual?.curso] ||
              "bi-journal-bookmark"
              }`}
          />

          <span>
            {grupoActual?.nombre || "Seleccionar curso"}
          </span>

          <i className="fas fa-chevron-down" />
        </button>
      ) : (
        <>
          <div className="selector-busqueda__busqueda">
            <i className="fas fa-search" />

            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  cerrar();
                }
              }}
              placeholder="Buscar curso..."
              autoFocus
              aria-label="Buscar curso"
            />

            {busqueda && (
              <button
                type="button"
                className="selector-busqueda__limpiar"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          <div className="selector-busqueda__menu">
            <div
              className="selector-busqueda__opciones"
              role="listbox"
            >
              {gruposFiltrados.length > 0 ? (
                gruposFiltrados.map((grupo) => (
                  <button
                    type="button"
                    key={grupo.curso}
                    className={`selector-busqueda__opcion ${grupo.curso === cursoSeleccionado
                      ? "is-seleccionado"
                      : ""
                      }`}
                    onClick={() => seleccionar(grupo)}
                    role="option"
                    aria-selected={
                      grupo.curso === cursoSeleccionado
                    }
                  >
                    <i
                      className={`bi ${ICONO_CURSO[grupo.curso] ||
                        "bi-journal-bookmark"
                        }`}
                    />

                    <span>{grupo.nombre}</span>

                    {grupo.curso === cursoSeleccionado && (
                      <i className="fas fa-check" />
                    )}
                  </button>
                ))
              ) : (
                <div className="selector-busqueda__vacio">
                  No se encontró ningún curso
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResultadosExamenPage({
  resultados,
  area,
  nombreArea,
  onSalir
}) {
  const { puntajeTotal, grupos } = resultados;

  const [preguntaAbiertaId, setPreguntaAbiertaId] = useState(null);

  const [cursoSeleccionado, setCursoSeleccionado] = useState(
    grupos[0]?.curso ?? null
  );

  const usadosPorCursoRef = useRef({});
  const mensajesPorCursoRef = useRef({});

  function alternarPregunta(id) {
    setPreguntaAbiertaId((actual) =>
      actual === id ? null : id
    );
  }

  const totalPreguntas = grupos.reduce(
    (acc, grupo) => acc + grupo.items.length,
    0
  );

  const totalCorrectas = grupos.reduce(
    (acc, grupo) =>
      acc +
      grupo.items.filter(
        (item) => item.estado === "correcta"
      ).length,
    0
  );

  const grupoSeleccionado = grupos.find(
    (grupo) => grupo.curso === cursoSeleccionado
  );

  const puntajeCurso = grupoSeleccionado
    ? grupoSeleccionado.items.reduce(
      (total, item) => total + item.puntos,
      0
    )
    : 0;

  function obtenerMensajeDelCurso(grupo) {
    if (!grupo) return "";

    if (mensajesPorCursoRef.current[grupo.curso]) {
      return mensajesPorCursoRef.current[grupo.curso];
    }

    const porcentaje = grupo.items.length
      ? (grupo.items.filter(
        (item) => item.estado === "correcta"
      ).length /
        grupo.items.length) *
      100
      : 0;

    const mensaje = obtenerMensajeSegunCurso(
      grupo.curso,
      porcentaje,
      usadosPorCursoRef.current
    );

    mensajesPorCursoRef.current[grupo.curso] = mensaje;

    return mensaje;
  }

  return (
    <div className="resultados-examen container">
      <div className="resultados-examen__resumen">
        <h1 className="resultados-examen__puntaje">
          {puntajeTotal.toFixed(2)}
        </h1>

        <p className="resultados-examen__subtitulo">
          Área {area} · {nombreArea} · {totalCorrectas}/
          {totalPreguntas} correctas
        </p>
      </div>

      {grupoSeleccionado && (
        <section
          className="resultados-examen__bloque"
          key={grupoSeleccionado.curso}
        >
          <div className="resultados-examen__mensaje-principal">
            {obtenerMensajeDelCurso(grupoSeleccionado)}
          </div>

          <SelectorCurso
            grupos={grupos}
            cursoSeleccionado={cursoSeleccionado}
            onSeleccionar={setCursoSeleccionado}
          />

          <h2 className="resultados-examen__bloque-titulo">
            <i
              className={`bi ${ICONO_CURSO[grupoSeleccionado.curso] ||
                "bi-journal-bookmark"
                }`}
            />

            <span className="resultados-examen__bloque-nombre">
              {grupoSeleccionado.nombre}
            </span>

            <span className="resultados-examen__bloque-puntaje">
              {puntajeCurso.toFixed(2)} pts
            </span>
          </h2>

          <ul className="resultados-examen__lista">
            {grupoSeleccionado.items.map((item, index) => (
              <PreguntaResultado
                key={item.pregunta.id}
                item={item}
                numero={index + 1}
                abierta={
                  preguntaAbiertaId === item.pregunta.id
                }
                onToggle={() =>
                  alternarPregunta(item.pregunta.id)
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}