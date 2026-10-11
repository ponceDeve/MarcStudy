# -*- coding: utf-8 -*-
"""
Regenera public/temas/ing/ (ing-01..ing-98.json) a partir de scripts/ingles_original/.
Después corre `python3 actualizar_manifest.py` para que el manifest se actualice.
Uso:  python3 scripts/reestructurar_ingles.py
- Lee SIEMPRE los originales (scripts/ingles_original/), así que se puede
  correr las veces que quieras sin acumular cambios.
- Niveles no listados en NIVELES_NUEVOS se copian tal cual.
- Vocabulario: sesiones de 3 palabras con ejercicios mezclados, sesión de
  texto mixto (español + inglés), repaso con palabras de niveles anteriores
  y evaluación en orden aleatorio.
- Nivel 1 (TO BE): 39 sesiones -> 10, con opciones am/is/are y texto mixto.
Marcas en los textos:
  <<en|es>>          palabra a practicar: se pregunta como hueco (pista = es)
  <<en|es|alt|alt>>  igual, con respuestas alternativas válidas
  [[en|es]]          palabra en inglés que se muestra tocable (ya vista)
"""
import collections
import json
import random
import re
import shutil
from pathlib import Path
RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ / "scripts" / "ingles_original"
DEST = RAIZ / "public" / "temas" / "ing"
# --------------------------------------------------------------------------
# TEXTOS MIXTOS (uno por nivel de vocabulario)
# --------------------------------------------------------------------------
TEXTOS_VOCAB = {
    3: (
        "Es de mañana y Ana llega a la escuela. Saluda a su profesora: "
        "«<<Good morning|Buenos días>>.» La profesora responde: «<<Hello|Hola>>, Ana.» "
        "En el pasillo, Ana choca con Luis y dice: «<<Sorry|Perdón>>.» "
        "Luego le pide: «[[Excuse me|Disculpe]], ¿me ayudas? <<Please|Por favor>>.» "
        "Luis le muestra el camino y Ana dice: «<<Thanks|Gracias>>.» "
        "Al final del día se despide: «<<Goodbye|Adiós>>.» Ana [[is happy|está feliz]]."
    ),
    4: (
        "Luis cuenta a los estudiantes de su clase: «<<One|Uno>>, [[two|dos]], "
        "<<three|tres>>, [[four|cuatro]], [[five|cinco]], <<six|seis>>, [[seven|siete]], "
        "<<eight|ocho>>, <<nine|nueve>>, [[ten|diez]].» "
        "Hay [[ten|diez]] estudiantes y <<zero|cero>> ausentes. Luis [[is happy|está feliz]]."
    ),
    5: (
        "Ana tiene una <<week|semana>> muy ocupada. El <<Monday|lunes>> tiene inglés, "
        "el [[Wednesday|miércoles]] tiene música y el <<Friday|viernes>> tiene examen. "
        "En el <<weekend|fin de semana>> descansa. <<Today|Hoy>> es [[Saturday|sábado]] "
        "y <<tomorrow|mañana>> es [[Sunday|domingo]]. Ana [[is tired|está cansada]] "
        "pero [[is happy|está feliz]]."
    ),
    7: (
        "En la clase de Ana, cada estudiante viene de un <<country|país>> diferente. "
        "Luis viene de <<Mexico|México>>, Sofía viene de <<Spain|España>>, "
        "Marc viene de <<France|Francia>> y Kenji viene de <<Japan|Japón>>. "
        "Ana quiere viajar algún día a <<Canada|Canadá>> y a [[Italy|Italia]]. "
        "Todos [[are here|están aquí]] para aprender inglés."
    ),
    8: (
        "Ana presenta a sus compañeros. [[Luis is|Luis es]] <<Mexican|mexicano>>. "
        "[[Sofía is|Sofía es]] <<Spanish|española>>. [[Marc is|Marc es]] <<French|francés>>. "
        "[[Kenji is|Kenji es]] <<Japanese|japonés>>. El profesor [[is|es]] "
        "<<American|estadounidense>> y su esposa [[is|es]] <<British|británica>>. "
        "Ana [[is|es]] la única que [[is not|no es]] de otro país: [[she is|ella es]] "
        "de aquí."
    ),
    10: (
        "Ana cumple <<thirteen|trece>> años. Invita a <<twenty|veinte>> amigos, pero "
        "llegan solo <<fifteen|quince>>. Su abuela tiene <<eighty|ochenta>> años y su "
        "abuelo tiene <<ninety|noventa>>. El pastel cuesta <<fifty|cincuenta>> pesos, y "
        "Ana dice que quiere vivir hasta los [[one hundred|cien]] años."
    ),
    11: (
        "Ana entra al <<classroom|salón de clases>> y dice [[good morning|buenos días]]. "
        "Se sienta en una <<chair|silla>> junto a la [[window|ventana]]. Saca de su "
        "<<backpack|mochila>> un <<notebook|cuaderno>>, un <<pen|bolígrafo>> y un "
        "<<book|libro>>. [[She is happy|Ella está feliz]] porque [[Luis is here|Luis está aquí]]."
    ),
}
# --------------------------------------------------------------------------
# NIVEL 1 (TO BE): grupos de sesiones originales y texto de cada grupo
# --------------------------------------------------------------------------
GRUPOS_N1 = [
    ("I am", ["I", "am", "I am"],
     "Ana se presenta en su clase nueva. Dice: «<<I|Yo>> <<am|soy>> Ana. "
     "Hoy conozco a todos.»"),
    ("You are", ["you", "are", "you are"],
     "Ana mira a una chica y le pregunta: «<<You|Tú>> <<are|eres>> Sofía, ¿verdad?» "
     "Sofía sonríe y dice que sí."),
    ("He, she, it, is", ["he", "she", "it", "is", "he is", "she is", "it is"],
     "Ana habla de su familia. «Mira a mi hermano: <<he|él>> [[is|es]] Luis. "
     "Mira a mi mamá: <<she|ella>> <<is|es>> Rosa. Y este es mi perro: "
     "<<it|él (animal o cosa)>> [[is|es]] Toby.»"),
    ("We, they", ["we", "we are", "they", "they are"],
     "Ana y Sofía son amigas. Ana dice: «<<We|Nosotras>> [[are|somos]] amigas.» "
     "Luis y Rosa son los papás de Ana. Ana dice: «<<They|Ellos>> [[are|son]] mis papás.»"),
    ("Am, is o are + palabras", ["am, is o are", "happy", "tired", "here"],
     "Es sábado. Ana dice: «[[I am|Yo estoy]] <<happy|feliz>>.» Luis dice: "
     "«[[I am|Yo estoy]] <<tired|cansado>>, pero mis amigos [[are|están]] <<here|aquí>>.»"),
    ("A + profesiones", ["a", "student", "teacher", "doctor"],
     "En la escuela: «[[She is|Ella es]] <<a|una>> <<teacher|profesora>>. "
     "[[He is|Él es]] [[a|un]] <<student|estudiante>>. [[I am|Yo soy]] [[a|una]] "
     "<<doctor|doctora>>.»"),
    ("Negativo", ["not", "am not", "is not", "are not"],
     "Luis corrige a Ana: «[[I|Yo]] <<am not|no soy>> maestro. [[She|Ella]] "
     "<<is not|no es|isn't>> doctora. [[They|Ellos]] <<are not|no son|aren't>> estudiantes.»"),
    ("Preguntas y respuestas", ["Is...?", "Are...?", "Am I...?", "Yes, ...", "No, ..."],
     "Luis pregunta: «<<Is|¿Es>> ella doctora?» Ana responde: «<<Yes|Sí>>, "
     "[[she is|ella lo es]].» Luego Luis pregunta: «<<Are|¿Son>> ustedes estudiantes?» "
     "Ana responde: «<<No|No>>, [[we are not|no lo somos]].»"),
    ("Formas cortas", ["I'm", "he's, she's, it's", "you're, we're, they're", "isn't, aren't"],
     "Ana habla rápido y usa formas cortas. Dice: «<<I'm|Yo soy>> Ana. "
     "<<She's|Ella es>> Sofía y <<they're|ellos son>> mis amigos. Luis "
     "<<isn't|no es>> mi hermano.»"),
]
# --------------------------------------------------------------------------
# FRASES CON CONTEXTO
#   {}  = hueco de la palabra (su significado se toma de la lección)
#   [[en|es]] = palabra ya vista en inglés, tocable
# Cada palabra tiene 2 frases: la 1.ª se usa para elegir y escuchar,
# la 2.ª para escribir.
# --------------------------------------------------------------------------
FRASES = {
    3: {
        "hello": ["Al llegar, Ana dice: «{}, me llamo Ana.»", "Sonríe y saluda a todos con un «{}»."],
        "hi": ["Con su mejor amigo, Ana dice: «{}, Luis.»", "Entre amigos se saluda de manera informal: «{}»."],
        "goodbye": ["Ana sale de la escuela y dice: «{}, profesora.»", "Al terminar la clase, Luis dice: «{}, Ana.»"],
        "bye": ["Ana se despide de su amigo: «{}, Luis.»", "Luis se va rápido y grita: «{}, Ana.»"],
        "good morning": ["A las 7 de la mañana, Ana dice: «{}, mamá.»", "Es de mañana. El profesor dice: «{}, clase.»"],
        "good afternoon": ["A las 3 de la tarde, Ana dice: «{}, profesor.»", "Es de tarde. Luis entra a la tienda y dice: «{}.»"],
        "good evening": ["Ana llega a un restaurante por la noche y dice: «{}.»", "Al llegar a casa de noche, Luis dice: «{}, papá.»"],
        "good night": ["Antes de dormir, Ana dice: «{}, mamá.»", "Luis se va a la cama y dice: «{}.»"],
        "please": ["Ana quiere agua y dice: «Agua, {}.»", "Luis pide ayuda con cortesía: «Ayúdame, {}.»"],
        "thanks": ["Luis le da un libro a Ana y ella dice: «{}.»", "Sofía ayuda a Ana y ella dice: «{}, Sofía.»"],
        "sorry": ["Ana pisa a Luis por accidente y dice: «{}.»", "Luis llega tarde a clase y dice: «{}, profesora.»"],
        "excuse me": ["Ana quiere pasar entre la gente y dice: «{}.»", "Luis llama al mesero: «{}, ¿me trae la cuenta?»"],
    },
    4: {
        "zero": ["El equipo de Luis tiene 0 goles. Es decir, {} goles.", "Una casilla vacía vale 0, o sea {}."],
        "one": ["Ana tiene 1 gato: {} gato.", "El primer número para contar es el 1: {}."],
        "two": ["Luis tiene 2 manos: {} manos.", "Ana tiene 2 ojos: {} ojos."],
        "three": ["Un triángulo tiene 3 lados: {} lados.", "Hay 3 niños en el parque: {} niños."],
        "four": ["Una mesa tiene 4 patas: {} patas.", "Un año tiene 4 estaciones: {} estaciones."],
        "five": ["Una mano tiene 5 dedos: {} dedos.", "Luis compra 5 manzanas: {} manzanas."],
        "six": ["Un dado tiene 6 caras: {} caras.", "Ana tiene 6 lápices: {} lápices."],
        "seven": ["Una semana tiene 7 días: {} días.", "El arcoíris tiene 7 colores: {} colores."],
        "eight": ["Una araña tiene 8 patas: {} patas.", "Ana llega a las 8 en punto: a las {}."],
        "nine": ["Luis tiene 9 años: {} años.", "Hay 9 jugadores en la cancha: {} jugadores."],
        "ten": ["Ana tiene 10 dedos en las manos: {} dedos.", "Luis saca 10 en el examen: {}."],
    },
    5: {
        "Monday": ["Ana empieza sus clases el primer día de la semana: el {}.", "Después del domingo viene el {}."],
        "Tuesday": ["Después del lunes viene el {}.", "Luis juega fútbol todos los {}."],
        "Wednesday": ["Después del martes viene el {}.", "El {} está a la mitad de la semana."],
        "Thursday": ["Después del miércoles viene el {}.", "Ana tiene música los {}."],
        "Friday": ["Después del jueves viene el {}.", "El {} es el último día de clases."],
        "Saturday": ["Después del viernes viene el {}.", "Luis no va a la escuela el {}."],
        "Sunday": ["Después del sábado viene el {}.", "La familia de Ana come junta el {}."],
        "week": ["Una {} tiene siete días.", "Ana tiene clase de inglés dos veces por {}."],
        "weekend": ["El sábado y el domingo forman el {}.", "Luis descansa el {} y no va a la escuela."],
        "day": ["Un {} tiene 24 horas.", "Cada {} Ana estudia inglés."],
        "today": ["{} es mi cumpleaños, no ayer ni mañana.", "Ana dice: «{} tengo examen, pero ayer no.»"],
        "tomorrow": ["Hoy es viernes. {} es sábado.", "Ana dice: «Hoy estudio y {} descanso.»"],
    },
    7: {
        "country": ["Perú, México y España son cada uno un {}.", "Ana pregunta: «¿De qué {} eres?»"],
        "Mexico": ["Luis come tacos porque es de {}.", "La capital es Ciudad de México, en {}."],
        "Spain": ["Sofía baila flamenco porque es de {}.", "Madrid es la capital de {}."],
        "France": ["Marc vive en París, en {}.", "La torre Eiffel está en {}."],
        "Germany": ["Berlín es la capital de {}.", "Hans es de Berlín, es decir, de {}."],
        "Italy": ["La pizza viene de {}.", "Roma es la capital de {}."],
        "China": ["La Gran Muralla está en {}.", "Beijing es la capital de {}."],
        "Japan": ["Tokio es la capital de {}.", "Kenji come sushi porque es de {}."],
        "Brazil": ["Brasilia es la capital de {}.", "En {} se baila samba."],
        "Canada": ["Ottawa es la capital de {}.", "Al norte de Estados Unidos está {}."],
        "England": ["Londres es la capital de {}.", "El Big Ben está en {}."],
        "the United States": ["Washington D. C. es la capital de {}.", "Nueva York está en {}."],
    },
    8: {
        "Mexican": ["Luis vive en México, es {}.", "Los tacos son comida {}."],
        "Spanish": ["Sofía es de España, es {}.", "La paella es comida {}."],
        "French": ["Marc es de Francia, es {}.", "El croissant es {}."],
        "German": ["Hans es de Alemania, es {}.", "La cerveza de Múnich es {}."],
        "Italian": ["Gina es de Italia, es {}.", "La pizza es comida {}."],
        "Chinese": ["Li es de China, es {}.", "El idioma que se habla en Beijing es {}."],
        "Japanese": ["Kenji es de Japón, es {}.", "El sushi es comida {}."],
        "Brazilian": ["Pedro es de Brasil, es {}.", "El samba es música {}."],
        "Canadian": ["Emma es de Canadá, es {}.", "El jarabe de maple es {}."],
        "English": ["Tom es de Inglaterra, es {}.", "El idioma que aprende Ana es {}."],
        "American": ["Bill es de Estados Unidos, es {}.", "La hamburguesa es comida {}."],
        "British": ["Kate es del Reino Unido, es {}.", "El té con leche es una costumbre {}."],
    },
    10: {
        "eleven": ["Un equipo de fútbol tiene 11 jugadores: {} jugadores.", "Luis tiene 11 años: {} años."],
        "twelve": ["Un año tiene 12 meses: {} meses.", "Una docena tiene 12 huevos: {} huevos."],
        "thirteen": ["Ana cumple 13 años: {} años.", "Hay 13 sillas en el salón: {} sillas."],
        "fifteen": ["Una fiesta de quince años celebra los 15: {} años.", "La clase dura 15 minutos: {} minutos."],
        "eighteen": ["Al cumplir 18 años, Luis es adulto: {} años.", "Hay 18 estudiantes: {} estudiantes."],
        "twenty": ["Ana tiene 20 amigos: {} amigos.", "Un billete de 20 pesos: {} pesos."],
        "thirty": ["Un mes tiene 30 días: {} días.", "Luis espera 30 minutos: {} minutos."],
        "fifty": ["Medio siglo son 50 años: {} años.", "El pastel cuesta 50 pesos: {} pesos."],
        "sixty": ["Una hora tiene 60 minutos: {} minutos.", "Un minuto tiene 60 segundos: {} segundos."],
        "eighty": ["La abuela de Ana tiene 80 años: {} años.", "El autobús va a 80 kilómetros por hora: {}."],
        "ninety": ["El abuelo de Luis tiene 90 años: {} años.", "El examen vale 90 puntos: {} puntos."],
        "one hundred": ["Un siglo tiene 100 años: {} años.", "Ana saca 100 en el examen: {}."],
    },
    11: {
        "book": ["Ana lee una historia en su {}.", "Luis abre su {} de inglés."],
        "pen": ["Luis escribe su nombre con un {}.", "Ana firma con un {} azul."],
        "pencil": ["Ana dibuja con un {} y luego lo borra.", "Luis saca punta a su {}."],
        "desk": ["Ana se sienta en su {} en la clase.", "Luis guarda sus libros en su {}."],
        "chair": ["Ana se sienta en una {}.", "Falta una {} para Luis en el salón."],
        "board": ["El profesor escribe en el {}.", "Ana borra el {} al final de la clase."],
        "notebook": ["Ana toma apuntes en su {}.", "Luis compró un {} nuevo con hojas rayadas."],
        "window": ["Ana abre la {} porque hace calor.", "Por la {} se ve el patio."],
        "door": ["Luis cierra la {} al salir.", "El profesor entra por la {}."],
        "dictionary": ["Ana busca una palabra en el {}.", "Un {} explica el significado de las palabras."],
        "backpack": ["Ana lleva sus libros en su {}.", "Luis deja su {} junto a la silla."],
        "classroom": ["Ana estudia inglés en el {}.", "El profesor entra al {}."],
    },
}
# Si es True, cada nivel cierra con una sesión de texto largo (repite palabras ya preguntadas)
USAR_TEXTOS = False
# Respuestas alternativas válidas
ALT = {"the United States": ["United States", "the US", "the USA"]}
# Nivel 1: frases por grupo. <<en|es|alt...>> marca el hueco.
FRASES_N1 = [
    ["Ana se presenta: «<<I|Yo>> [[am|soy]] Ana.»",
     "Luis se presenta: «<<I|Yo>> [[am|soy]] Luis.»",
     "Sofía dice su nombre: «<<I|Yo>> [[am|soy]] Sofía.»",
     "Ana repite: «[[I|Yo]] <<am|soy>> Ana.»",
     "Luis repite: «[[I|Yo]] <<am|soy>> Luis.»",
     "Sofía repite: «[[I|Yo]] <<am|soy>> Sofía.»"],
    ["Ana le habla a Luis: «<<You|Tú>> [[are|eres]] Luis, ¿verdad?»",
     "Ana le dice a Sofía: «<<You|Tú>> [[are|eres]] Sofía.»",
     "Luis le dice a Ana: «<<You|Tú>> [[are|eres]] mi amiga.»",
     "El profesor le dice a Luis: «[[You|Tú]] <<are|eres>> el primero.»",
     "El profesor le dice a Sofía: «[[You|Tú]] <<are|eres>> la segunda.»",
     "Ana le dice a Luis: «[[You|Tú]] <<are|eres>> mi amigo.»"],
    ["Ana señala a su hermano: «<<He|Él>> [[is|es]] Luis.»",
     "Ana señala a su mamá: «<<She|Ella>> [[is|es]] Rosa.»",
     "Ana señala a su perro: «<<It|Él (animal)>> [[is|es]] Toby.»",
     "Luis señala a su papá: «<<He|Él>> [[is|es]] Carlos.»",
     "Ana dice de su hermano: «[[He|Él]] <<is|es>> Luis.»",
     "Ana dice de su mamá: «[[She|Ella]] <<is|es>> Rosa.»",
     "Ana dice de su perro: «[[It|Él (animal)]] <<is|es>> Toby.»",
     "Luis dice de su tía: «[[She|Ella]] <<is|es>> Marta.»"],
    ["Ana y Sofía son amigas. Ana dice: «<<We|Nosotras>> [[are|somos]] amigas.»",
     "Luis y Rosa son los papás de Ana. Ana dice: «<<They|Ellos>> [[are|son]] mis papás.»",
     "Luis y Ana son hermanos. Ellos dicen: «<<We|Nosotros>> [[are|somos]] hermanos.»",
     "Sofía habla de Luis y Ana: «<<They|Ellos>> [[are|son]] hermanos.»",
     "Ana y Sofía dicen: «[[We|Nosotras]] <<are|somos>> amigas.»",
     "Ana habla de sus papás: «[[They|Ellos]] <<are|son>> mis papás.»"],
    ["Es sábado. Ana dice: «[[I am|Yo estoy]] <<happy|feliz>>.»",
     "Luis dice: «[[I am|Yo estoy]] <<tired|cansado>>.»",
     "Los amigos ya llegaron. Ana dice: «[[They are|Ellos están]] <<here|aquí>>.»",
     "Ana dice de su mamá: «[[She is|Ella está]] <<happy|feliz>>.»",
     "Luis dice: «[[We are|Nosotros estamos]] <<tired|cansados>>.»",
     "Sofía dice de Luis: «[[He is|Él está]] <<here|aquí>>.»",
     "Es hora de dormir. Ana dice: «[[I|Yo]] <<am|estoy>> [[tired|cansada]].»",
     "Luis está feliz. Ana dice: «[[He|Él]] <<is|está>> [[happy|feliz]].»",
     "Ana y Sofía están aquí: «[[We|Nosotras]] <<are|estamos>> [[here|aquí]].»"],
    ["Ana habla de su profesora: «[[She is|Ella es]] <<a|una>> [[teacher|profesora]].»",
     "Luis va a la escuela: «[[He is|Él es]] <<a|un>> [[student|estudiante]].»",
     "Rosa trabaja en un hospital: «[[She is|Ella es]] <<a|una>> [[doctor|doctora]].»",
     "Ana estudia en la escuela: «[[I am|Yo soy]] [[a|una]] <<student|estudiante>>.»",
     "Carlos enseña en la escuela: «[[He is|Él es]] [[a|un]] <<teacher|profesor>>.»",
     "Marta cura enfermos: «[[She is|Ella es]] [[a|una]] <<doctor|doctora>>.»"],
    ["Luis no es profesor: «[[He|Él]] <<is not|no es|isn't>> [[a teacher|profesor]].»",
     "Ana no es doctora: «[[I|Yo]] <<am not|no soy>> [[a doctor|doctora]].»",
     "Ana y Sofía no están cansadas: «[[We|Nosotras]] <<are not|no estamos|aren't>> [[tired|cansadas]].»",
     "Rosa no está aquí: «[[She|Ella]] <<is not|no está|isn't>> [[here|aquí]].»",
     "Luis dice: «[[I|Yo]] <<am not|no estoy>> [[happy|feliz]].»",
     "Los niños no están aquí: «[[They|Ellos]] <<are not|no están|aren't>> [[here|aquí]].»"],
    ["Luis pregunta por Rosa: «<<Is|¿Es>> [[she a doctor|ella doctora]]?»",
     "Ana le responde: «<<Yes|Sí>>, [[she is|ella lo es]].»",
     "Luis pregunta por Sofía y Ana: «<<Are|¿Son>> [[they students|ellas estudiantes]]?»",
     "Ana responde: «<<No|No>>, [[they are not|no lo son]].»",
     "Ana pregunta: «<<Am|¿Estoy>> [[I late|yo tarde]]?»",
     "Luis responde: «<<Yes|Sí>>, [[you are|lo estás]].»",
     "Sofía pregunta: «<<Are|¿Estás>> [[you tired|tú cansada]]?»",
     "Ana responde: «<<No|No>>, [[I am not|no lo estoy]].»"],
    ["Ana habla rápido: «<<I'm|Yo soy>> Ana.»",
     "Ana presenta a Sofía: «<<She's|Ella es>> Sofía.»",
     "Ana presenta a sus papás: «<<They're|Ellos son>> mis papás.»",
     "Ana habla de Luis: «<<He's|Él es>> mi hermano.»",
     "Luis dice de sí mismo: «<<I'm|Yo estoy>> [[tired|cansado]].»",
     "Ana y Sofía dicen: «<<We're|Nosotras estamos>> [[here|aquí]].»",
     "Luis le dice a Ana: «<<You're|Tú eres>> mi amiga.»",
     "Ana dice de Luis: «[[He|Él]] <<isn't|no es|is not>> [[a teacher|profesor]].»",
     "Ana dice de los niños: «[[They|Ellos]] <<aren't|no están|are not>> [[here|aquí]].»"],
]
# Grupos de opciones para elegir (nivel 1)
POOLS_N1 = [
    ["I", "you", "he", "she", "it", "we", "they"],
    ["am", "is", "are"],
    ["am not", "is not", "are not"],
    ["Is", "Are", "Am"],
    ["Yes", "No"],
    ["I'm", "you're", "he's", "she's", "it's", "we're", "they're"],
    ["isn't", "aren't"],
    ["happy", "tired", "here"],
    ["a", "student", "teacher", "doctor"],
]
FRASES.update({
    16: {
        "phone": ["Ana llama a su mamá con su {}.", "Luis recibe un mensaje en su {}."],
        "key": ["Luis abre la puerta con la {}.", "Ana perdió su {} y no puede entrar."],
        "watch": ["Luis mira la hora en su {}.", "Ana lleva un {} en la muñeca."],
        "bag": ["Ana guarda su almuerzo en la {}.", "Luis lleva una {} de compras."],
        "umbrella": ["Llueve, así que Ana abre su {}.", "Luis olvidó su {} y se mojó."],
        "camera": ["Luis toma fotos con su {}.", "Ana graba un video con su {}."],
        "sunglasses": ["Hace mucho sol, así que Luis se pone sus {}.", "Ana protege sus ojos con {}."],
        "headphones": ["Ana escucha música con sus {}.", "Luis usa {} para no oír el ruido."],
        "laptop": ["Ana hace su tarea en la {}.", "Luis abre su {} para escribir."],
        "wallet": ["Luis guarda su dinero en la {}.", "Ana perdió su {} con las tarjetas."],
        "charger": ["La batería está baja, Ana busca su {}.", "Luis conecta el {} al teléfono."],
        "lamp": ["Ana enciende la {} para leer.", "La {} de la mesa da luz."],
    },
    21: {
        "man": ["Carlos es un {} alto.", "Un {} espera el autobús."],
        "woman": ["Rosa es una {} amable.", "Una {} vende frutas en el mercado."],
        "boy": ["Luis tiene diez años, es un {}.", "Un {} juega fútbol en el parque."],
        "girl": ["Ana tiene diez años, es una {}.", "Una {} lee un libro."],
        "child": ["Un niño o una niña es un {}.", "Ana es una {} de diez años."],
        "baby": ["El {} de Rosa tiene tres meses.", "Un {} llora cuando tiene hambre."],
        "friend": ["Luis es mi mejor {}.", "Ana juega con su {} en el parque."],
        "adult": ["Una persona de 30 años es un {}.", "Mi papá es un {}, no un niño."],
        "person": ["Cada {} tiene un nombre.", "Ana es una {} muy amable."],
        "people": ["Hay muchas {} en la plaza.", "Mucha {} ve el partido."],
        "neighbor": ["El señor Pérez vive al lado, es mi {}.", "Mi {} me saluda cada mañana."],
        "stranger": ["No conozco a ese hombre, es un {}.", "Ana no habla con un {} en la calle."],
    },
    22: {
        "mother": ["Rosa es la {} de Ana.", "Mi {} cocina muy bien."],
        "father": ["Carlos es el {} de Ana.", "Mi {} trabaja en un hospital."],
        "sister": ["Sofía es hija de mis papás; es mi {}.", "Mi {} menor se llama Sofía."],
        "brother": ["Luis es hijo de mis papás; es mi {}.", "Mi {} juega fútbol."],
        "son": ["Luis es el {} de Rosa y Carlos.", "Rosa tiene un {} y una hija."],
        "daughter": ["Ana es la {} de Rosa y Carlos.", "Carlos tiene una {} llamada Ana."],
        "grandmother": ["La mamá de mi mamá es mi {}.", "Mi {} me cuenta cuentos."],
        "grandfather": ["El papá de mi papá es mi {}.", "Mi {} lee el periódico."],
        "parents": ["Mi mamá y mi papá son mis {}.", "Los {} de Ana trabajan."],
        "uncle": ["El hermano de mi papá es mi {}.", "Mi {} Pedro viene a cenar."],
        "aunt": ["La hermana de mi mamá es mi {}.", "Mi {} Marta tiene un perro."],
        "cousin": ["El hijo de mi tío es mi {}.", "Mi {} juega conmigo los domingos."],
    },
    23: {
        "red": ["Una manzana madura suele ser {}.", "El semáforo dice alto con la luz {}."],
        "blue": ["El cielo despejado es {}.", "El mar se ve {}."],
        "green": ["El pasto es {}.", "Una lechuga es {}."],
        "yellow": ["El sol se pinta de color {}.", "Un plátano maduro es {}."],
        "black": ["La noche sin luna es {}.", "El café sin leche es {}."],
        "white": ["La nieve es {}.", "La leche es {}."],
        "brown": ["La tierra mojada es de color {}.", "El chocolate es {}."],
        "orange": ["La naranja tiene color {}.", "Las zanahorias son {}."],
        "pink": ["El algodón de azúcar suele ser {}.", "Ana usa un vestido {}."],
        "gray": ["Las nubes de tormenta son {}.", "Un elefante es {}."],
        "purple": ["Las uvas moradas son de color {}.", "Mezclar azul y rojo da {}."],
        "gold": ["El oro brilla con color {}.", "La medalla del primer lugar es {}."],
    },
    24: {
        "big": ["Un elefante es muy {}.", "La casa de Ana es {}: tiene muchos cuartos."],
        "small": ["Un ratón es muy {}.", "Ana tiene un cuarto {}."],
        "new": ["Luis estrena un teléfono {}.", "Ana compró un libro {} ayer."],
        "old": ["El abuelo tiene un coche {}.", "Ese libro tiene cien años, es muy {}."],
        "good": ["Ana saca 10 en el examen, es una nota {}.", "Luis es un {} amigo."],
        "bad": ["Sacar 2 en el examen es {}.", "Tener fiebre es {}."],
        "young": ["Un bebé es muy {}.", "Luis es {}: solo tiene diez años."],
        "tall": ["Carlos mide dos metros, es {}.", "Una jirafa es muy {}."],
        "short": ["Ana mide poco, es {}.", "Este camino es {}: solo son dos calles."],
        "fast": ["Un tren de alta velocidad es {}.", "Luis corre muy {}."],
        "slow": ["Una tortuga es {}.", "El abuelo camina {}."],
        "beautiful": ["Ese vestido es muy {}.", "La playa al atardecer es {}."],
    },
    26: {
        "sad": ["Luis perdió su juguete y está {}.", "Ana llora porque está {}."],
        "angry": ["Rompieron su libro y Ana está {}.", "Luis grita porque está {}."],
        "afraid": ["Ana ve una araña grande y está {}.", "El niño está {} de la oscuridad."],
        "hungry": ["No desayunó y ahora está {}.", "Luis quiere pizza porque está {}."],
        "thirsty": ["Corrió mucho y ahora está {}.", "Ana quiere agua porque está {}."],
        "bored": ["No hay nada que hacer y Luis está {}.", "La película es larga y Ana está {}."],
        "excited": ["Mañana es su cumpleaños y Ana está {}.", "Luis viaja mañana y está {}."],
        "nervous": ["Hoy es el examen y Ana está {}.", "Luis habla frente a la clase y está {}."],
        "worried": ["Su mamá no llega y Ana está {}.", "Luis está {} por la nota del examen."],
        "surprised": ["Todos gritan «¡sorpresa!» y Ana está {}.", "Luis abre el regalo y está {}."],
        "proud": ["Ana sacó 10 y su mamá está {}.", "Luis ganó la carrera y está {}."],
        "sick": ["Tiene fiebre y tos, está {}.", "Ana no va a la escuela porque está {}."],
    },
    27: {
        "bread": ["Ana come {} con mantequilla.", "El panadero hornea {} cada mañana."],
        "rice": ["En Perú se come mucho {} con pollo.", "El sushi lleva {}."],
        "egg": ["La gallina pone un {}.", "Luis desayuna un {} frito."],
        "cheese": ["Una pizza lleva {} derretido.", "El ratón quiere {}."],
        "meat": ["Un asado lleva mucha {}.", "El león come {}."],
        "fruit": ["Una manzana es una {}.", "Ana come {} de postre."],
        "apple": ["Ana come una {} roja.", "Una {} al día es sana."],
        "banana": ["El mono come un {}.", "Luis pela un {} amarillo."],
        "potato": ["Las papas fritas se hacen con {}.", "Ana pela una {} para el puré."],
        "tomato": ["La salsa roja se hace con {}.", "Luis corta un {} para la ensalada."],
        "salad": ["Ana come una {} de lechuga.", "La {} lleva tomate y pepino."],
        "soup": ["Cuando hace frío, Luis toma una {} caliente.", "La {} se toma con cuchara."],
    },
    28: {
        "water": ["Cuando tiene sed, Ana toma un vaso de {}.", "Los peces viven en el {}."],
        "milk": ["El bebé toma {} de su mamá.", "Luis desayuna cereal con {}."],
        "juice": ["Ana exprime naranjas para hacer {}.", "Luis toma un vaso de {} de manzana."],
        "coffee": ["El papá de Ana toma {} por la mañana.", "El {} negro tiene cafeína."],
        "tea": ["En Inglaterra se toma {} con leche.", "Ana toma {} caliente cuando está enferma."],
        "soda": ["El {} tiene burbujas y mucha azúcar.", "Luis pide un {} con la pizza."],
        "beer": ["Los adultos pueden tomar {} en una fiesta.", "La {} se hace con cebada."],
        "wine": ["El {} se hace con uvas.", "En la boda los adultos brindan con {}."],
        "lemonade": ["La {} se hace con limones y azúcar.", "En verano Ana toma {} fría."],
        "cocoa": ["En invierno Luis toma {} caliente.", "La {} se hace con leche y chocolate."],
        "smoothie": ["Ana mezcla fruta en la licuadora para hacer un {}.", "Luis toma un {} de fresa."],
        "drink": ["Agua, jugo y café son cada uno una {}.", "El mesero pregunta: «¿Quiere una {}?»"],
    },
    29: {
        "grape": ["El vino se hace con {}.", "Ana come una {} verde."],
        "strawberry": ["La {} es roja y tiene semillas pequeñas.", "Luis come pastel de {}."],
        "lemon": ["El {} es amarillo y muy ácido.", "Ana exprime un {} en el té."],
        "pear": ["La {} tiene forma de campana.", "Luis come una {} jugosa."],
        "watermelon": ["La {} es verde por fuera y roja por dentro.", "En verano Ana come {} fría."],
        "carrot": ["Los conejos comen {}.", "La {} es naranja."],
        "onion": ["Cortar {} hace llorar.", "La sopa lleva {}."],
        "lettuce": ["La ensalada lleva {} verde.", "La hamburguesa tiene {} y tomate."],
        "cucumber": ["El {} es verde y fresco.", "Ana corta un {} para la ensalada."],
        "corn": ["Las palomitas se hacen con {}.", "Las tortillas se hacen con {}."],
        "pepper": ["El {} rojo puede ser dulce o picante.", "La pizza lleva {}."],
        "mushroom": ["El {} crece en el bosque húmedo.", "Ana come pizza con {}."],
    },
    32: {
        "eat": ["Todos los días [[I|yo]] {} pan en el desayuno.", "[[We|Nosotros]] {} juntos en la cena."],
        "drink": ["Cuando tengo sed, [[I|yo]] {} agua.", "[[They|Ellos]] {} jugo en el desayuno."],
        "work": ["[[I|Yo]] {} en un hospital.", "[[They|Ellos]] {} en una fábrica."],
        "live": ["[[I|Yo]] {} en una casa grande.", "[[We|Nosotros]] {} en México."],
        "study": ["[[I|Yo]] {} inglés todas las noches.", "[[They|Ellos]] {} en la biblioteca."],
        "play": ["[[We|Nosotros]] {} fútbol los sábados.", "[[I|Yo]] {} con mi perro en el parque."],
        "read": ["[[I|Yo]] {} un libro antes de dormir.", "[[They|Ellos]] {} el periódico."],
        "speak": ["[[I|Yo]] {} inglés y español.", "[[We|Nosotros]] {} con la profesora."],
        "watch": ["[[We|Nosotros]] {} una película.", "[[I|Yo]] {} la televisión por la noche."],
        "cook": ["[[I|Yo]] {} la cena para mi familia.", "[[They|Ellos]] {} arroz con pollo."],
        "like": ["[[I|Yo]] {} el chocolate.", "[[We|Nosotros]] {} la música."],
        "want": ["[[I|Yo]] {} un vaso de agua.", "[[They|Ellos]] {} una pizza."],
    },
})
TEXTOS_VOCAB.update({
    16: (
        "Ana sale de casa. Toma su <<phone|teléfono>>, su <<wallet|cartera>> y su "
        "<<key|llave>>. Como llueve, también lleva su <<umbrella|paraguas>>. En la mochila "
        "guarda su <<laptop|laptop>> y sus <<headphones|audífonos>>. Antes de salir, apaga la "
        "[[lamp|lámpara]]. [[She is|Ella está]] [[happy|feliz]]."
    ),
    21: (
        "En el parque hay mucha <<people|gente>>. Un <<man|hombre>> pasea con su "
        "<<baby|bebé>>. Una <<woman|mujer>> habla con una <<girl|niña>> y un [[boy|niño]]. "
        "Ana ve a su <<friend|amigo>> Luis y [[he is|él está]] [[here|aquí]]. Un "
        "<<stranger|desconocido>> pregunta la hora y Ana le contesta con amabilidad."
    ),
    22: (
        "La familia de Ana es grande. Su <<mother|madre>> se llama Rosa y su "
        "<<father|padre>> se llama Carlos. Ana tiene un <<brother|hermano>>, Luis, y una "
        "<<sister|hermana>>, Sofía. Su <<grandmother|abuela>> vive cerca. Los domingos "
        "viene su [[uncle|tío]] Pedro con su <<cousin|primo>> Tomás. [[They are|Ellos están]] "
        "[[happy|felices]]."
    ),
    23: (
        "Ana pinta un dibujo. El cielo es <<blue|azul>>, el pasto es <<green|verde>> y el "
        "sol es <<yellow|amarillo>>. Dibuja una casa <<red|roja>> con una puerta "
        "<<brown|café>> y un gato <<black|negro>>. [[She is|Ella está]] [[happy|feliz]]."
    ),
    24: (
        "Ana visita a su abuelo. Su casa es <<big|grande>> y <<old|vieja>>. Su coche es "
        "<<new|nuevo>> pero <<slow|lento>>. El abuelo ya no es <<young|joven>>, pero "
        "[[he is|él está]] [[happy|feliz]]. El jardín es <<beautiful|bonito>> y el perro es "
        "<<small|pequeño>>."
    ),
    26: (
        "Hoy es el examen de inglés. Ana está <<nervous|nerviosa>> y Luis está "
        "<<worried|preocupado>>. Después del examen, Ana está <<excited|emocionada>> y su "
        "mamá está <<proud|orgullosa>>. Luis no desayunó y ahora está <<hungry|con hambre>>, "
        "y Sofía, que corrió mucho, está <<thirsty|con sed>>."
    ),
    27: (
        "Es el almuerzo. Ana come una <<soup|sopa>> caliente y una <<salad|ensalada>> con "
        "[[tomato|tomate]]. Luis come <<rice|arroz>> con <<meat|carne>> y <<bread|pan>>. De "
        "postre hay [[fruit|fruta]]: una <<apple|manzana>> y un [[banana|plátano]]. "
        "[[They are|Ellos están]] [[happy|felices]]."
    ),
    28: (
        "En la cafetería, Ana pide un <<juice|jugo>>. Luis pide <<milk|leche>> y un "
        "<<smoothie|licuado>>. Su papá toma <<coffee|café>> y su mamá toma <<tea|té>>. "
        "Sofía tiene sed y pide <<water|agua>>. Ahora todos tienen una [[drink|bebida]]."
    ),
    29: (
        "En el mercado, Ana compra una <<watermelon|sandía>>, un <<lemon|limón>> y una "
        "[[pear|pera]]. Luis compra una <<carrot|zanahoria>>, una <<onion|cebolla>> y una "
        "<<lettuce|lechuga>>. Para la pizza también compran un <<mushroom|champiñón>> y "
        "[[pepper|pimiento]]."
    ),
    32: (
        "Ana dice: «Todos los días [[I|yo]] <<study|estudiar>> inglés, [[I|yo]] "
        "<<read|leer>> un libro y [[I|yo]] <<eat|comer>> fruta.» Luis dice: «[[I|Yo]] "
        "<<play|jugar>> fútbol, [[I|yo]] <<watch|ver>> televisión y [[I|yo]] "
        "<<cook|cocinar>> con mi mamá.»"
    ),
})
FRASES.update({
    38: {
        "nurse": ["Rosa cuida a los enfermos en el hospital: [[she is|ella es]] {}.", "La {} le pone una inyección al paciente."],
        "engineer": ["Carlos diseña puentes y edificios: [[he is|él es]] {}.", "El {} construye un puente nuevo."],
        "lawyer": ["Marta defiende a las personas en un juicio: [[she is|ella es]] {}.", "El {} habla con el juez."],
        "driver": ["Pedro maneja un autobús todos los días: [[he is|él es]] {}.", "El {} espera en el semáforo."],
        "cook": ["Luis prepara la comida en un restaurante: [[he is|él es]] {}.", "El {} corta cebolla y prepara la sopa."],
        "farmer": ["Don Juan siembra maíz en el campo: [[he is|él es]] {}.", "El {} ordeña a las vacas."],
        "artist": ["Sofía pinta cuadros: [[she is|ella es]] {}.", "El {} dibuja un retrato."],
        "police officer": ["Carlos ayuda a la gente y persigue a los ladrones: [[he is|él es]] {}.", "El {} dirige el tráfico."],
        "waiter": ["Luis lleva la comida a las mesas: [[he is|él es]] {}.", "El {} trae la cuenta."],
        "singer": ["Ana canta en un concierto: [[she is|ella es]] {}.", "La {} canta en el escenario."],
        "dentist": ["Marta revisa los dientes: [[she is|ella es]] {}.", "El {} limpia los dientes de Ana."],
        "pilot": ["Carlos maneja un avión: [[he is|él es]] {}.", "El {} anuncia: «Vamos a despegar.»"],
    },
    39: {
        "job": ["Luis busca un nuevo {} porque quiere ganar dinero.", "Ser doctora es un {} difícil."],
        "work": ["Ana sale del {} a las cinco.", "Hay mucho {} hoy y no puedo salir."],
        "boss": ["El {} da órdenes en la oficina.", "Luis habla con su {} sobre su sueldo."],
        "worker": ["Cada {} de la fábrica usa un casco.", "Un {} llega temprano a la obra."],
        "company": ["Ana trabaja en una {} grande de tecnología.", "La {} tiene cien empleados."],
        "meeting": ["A las diez hay una {} con el jefe.", "La {} dura una hora."],
        "email": ["Luis escribe un {} a su jefe.", "Ana lee un {} nuevo en su computadora."],
        "schedule": ["Mi {} de trabajo es de nueve a cinco.", "Ana revisa su {} para ver sus clases."],
        "colleague": ["Sofía trabaja conmigo en la oficina: es mi {}.", "Luis almuerza con un {}."],
        "interview": ["Ana está nerviosa por su {} de trabajo.", "En la {} le preguntan por su experiencia."],
        "project": ["El equipo termina un {} importante.", "Luis presenta su {} al jefe."],
        "factory": ["Miles de coches se hacen en una {}.", "El trabajador llega temprano a la {}."],
    },
    40: {
        "hour": ["Un día tiene veinticuatro {}.", "La película dura una {} y media."],
        "minute": ["Una hora tiene sesenta {}.", "El autobús llega en cinco {}."],
        "second": ["Un minuto tiene sesenta {}.", "Espera un {}, ya voy."],
        "clock": ["El {} de la pared marca las tres.", "Ana mira el {} para no llegar tarde."],
        "night": ["La luna sale de {}.", "Ana duerme por la {}."],
        "morning": ["Luis desayuna por la {}.", "El sol sale en la {}."],
        "afternoon": ["Ana come a las dos de la {}.", "Después del almuerzo viene la {}."],
        "evening": ["Al final del día, cuando baja el sol, es el {}.", "Luis cena por la {} en casa."],
        "o'clock": ["Son las [[three|tres]] {}.", "La clase empieza a las [[eight|ocho]] {}."],
        "noon": ["A las doce del día es el {}.", "Luis almuerza al {}."],
        "midnight": ["A las doce de la noche es la {}.", "Cenicienta debe volver a casa a la {}."],
        "early": ["Ana se levanta {} para no llegar tarde.", "Luis llega {} a la escuela, antes que todos."],
    },
    41: {
        "January": ["El año nuevo empieza en {}.", "En {} hace frío en el norte."],
        "February": ["El mes más corto del año es {}.", "El 14 de {} es el día de San Valentín."],
        "March": ["En {} comienza la primavera en el norte.", "El tercer mes del año es {}."],
        "April": ["Después de marzo viene {}.", "El cuarto mes del año es {}."],
        "May": ["El 10 de {} es el día de las madres en México.", "El mes de las flores es {}."],
        "June": ["En {} empieza el verano en el norte.", "Después de mayo viene {}."],
        "July": ["El 4 de {} es la fiesta nacional de Estados Unidos.", "En {} hay vacaciones de verano."],
        "August": ["Después de julio viene {}.", "El octavo mes del año es {}."],
        "September": ["El 15 de {} celebran los mexicanos su independencia.", "Después de agosto viene {}."],
        "October": ["El 31 de {} es Halloween.", "Después de septiembre viene {}."],
        "November": ["El 2 de {} es el Día de Muertos en México.", "Después de octubre viene {}."],
        "December": ["El 25 de {} es Navidad.", "El último mes del año es {}."],
    },
    44: {
        "wake up": ["Suena la alarma a las seis y [[I|yo]] {}.", "Cada mañana [[I|yo]] {} con el sonido del despertador."],
        "get up": ["Después de despertarme, [[I|yo]] {} de la cama.", "Ya son las siete, [[I|yo]] {} y salgo de la cama."],
        "take a shower": ["Antes de salir, [[I|yo]] {} con agua caliente.", "Después de correr, [[I|yo]] {}."],
        "brush my teeth": ["Después de comer, [[I|yo]] {}.", "Antes de dormir, [[I|yo]] {} con pasta dental."],
        "have breakfast": ["Por la mañana, [[I|yo]] {} con pan y jugo.", "Antes de ir a la escuela, [[I|yo]] {}."],
        "go to work": ["A las ocho, [[I|yo]] {} en autobús.", "Los lunes [[I|yo]] {} temprano."],
        "have lunch": ["Al mediodía, [[I|yo]] {} con mis colegas.", "A las dos de la tarde, [[I|yo]] {} arroz con pollo."],
        "go home": ["A las cinco termino de trabajar y [[I|yo]] {}.", "Cuando termina el día, [[I|yo]] {} en autobús."],
        "cook dinner": ["Por la noche, [[I|yo]] {} para mi familia.", "Cuando llego a casa, [[I|yo]] {}."],
        "watch TV": ["Después de cenar, [[I|yo]] {} un rato.", "Los domingos [[I|yo]] {} con mi familia."],
        "go to bed": ["Cuando tengo sueño, [[I|yo]] {}.", "A las diez de la noche [[I|yo]] {}."],
        "sleep": ["Cuando estoy en la cama, [[I|yo]] {} ocho horas.", "Todas las noches [[I|yo]] {} profundamente."],
    },
    47: {
        "head": ["El sombrero se pone en la {}.", "Ana se golpeó la {} con la puerta."],
        "hand": ["Luis saluda con la {}.", "Ana se lava la {} antes de comer."],
        "arm": ["Luis levanta el {} para pedir la palabra.", "Entre la mano y el hombro está el {}."],
        "leg": ["Luis se lastimó la {} jugando fútbol.", "Los zapatos van en el pie, no en la {}."],
        "foot": ["Ana se pone un zapato en cada {}.", "Luis se pisó el {}."],
        "eye": ["Ana ve con el {}.", "Ana cierra un {} para guiñar."],
        "ear": ["Luis usa audífonos en la {}.", "Ana escucha con la {}."],
        "nose": ["Ana huele las flores con la {}.", "Luis se suena la {} porque tiene gripe."],
        "mouth": ["Ana come con la {}.", "Luis abre la {} en el dentista."],
        "hair": ["Ana se peina el {} largo.", "El peluquero le corta el {} a Luis."],
        "face": ["Luis se lava la {} en la mañana.", "Ana sonríe y se le ilumina la {}."],
        "back": ["Luis lleva la mochila en la {}.", "Ana se acuesta boca arriba sobre su {}."],
    },
    48: {
        "shirt": ["Luis se pone una {} blanca.", "La {} tiene botones y cuello."],
        "pants": ["Ana usa unos {} azules.", "Luis se pone los {} y un cinturón."],
        "dress": ["Ana se pone un {} para la fiesta.", "La novia lleva un {} blanco."],
        "shoes": ["Luis se pone los {} para caminar.", "Ana limpia sus {} negros."],
        "hat": ["Luis se pone un {} para el sol.", "El vaquero lleva un {} grande."],
        "jacket": ["Hace fresco, así que Ana se pone una {}.", "Luis cuelga su {} en el perchero."],
        "skirt": ["Sofía usa una {} roja.", "La {} llega hasta las rodillas."],
        "socks": ["Luis se pone {} antes de los zapatos.", "Ana tiene {} blancos."],
        "coat": ["En invierno hace mucho frío y Ana usa un {} largo.", "Luis guarda su {} en el armario."],
        "shorts": ["En verano Luis usa {}.", "Ana juega tenis con {} y una camiseta."],
        "tie": ["El jefe lleva una {} con su traje.", "Luis se anuda la {}."],
        "belt": ["Luis usa un {} para sostener los pantalones.", "El {} es de cuero."],
    },
    49: {
        "house": ["Ana vive en una {} con jardín.", "La familia compró una {} nueva."],
        "door": ["Luis toca la {} antes de entrar.", "Ana cierra la {} con llave."],
        "window": ["Ana abre la {} para que entre aire.", "El pájaro golpea la {}."],
        "roof": ["La lluvia cae sobre el {}.", "Un gato camina en el {} de la casa."],
        "wall": ["Ana cuelga un cuadro en la {}.", "Luis pinta la {} de blanco."],
        "floor": ["El agua se cayó al {} y Luis lo limpia.", "Ana barre el {} de la sala."],
        "stairs": ["Para subir al segundo piso, Luis usa las {}.", "Ana baja las {} corriendo."],
        "garden": ["Ana riega las flores del {}.", "Luis juega con el perro en el {}."],
        "garage": ["Carlos guarda el coche en el {}.", "La bicicleta está en el {}."],
        "key": ["Luis abre la puerta con la {}.", "Ana perdió la {} de su casa."],
        "address": ["Escribe tu {} en el sobre: calle y número.", "El taxista pregunta: «¿Cuál es su {}?»"],
        "apartment": ["Luis vive en un {} en el quinto piso.", "Ana renta un {} pequeño en la ciudad."],
    },
    50: {
        "kitchen": ["Ana cocina en la {}.", "La estufa y el refrigerador están en la {}."],
        "bedroom": ["Luis duerme en su {}.", "En el {} hay una cama y un clóset."],
        "bathroom": ["Ana se baña en el {}.", "Luis se cepilla los dientes en el {}."],
        "living room": ["La familia ve televisión en la {}.", "El sofá está en la {}."],
        "dining room": ["Comen todos juntos en el {}.", "La mesa grande está en el {}."],
        "room": ["Ana ordena su {} del segundo piso.", "Cada {} de la casa tiene una puerta."],
        "basement": ["Luis guarda las cajas viejas en el {}.", "El {} está debajo de la casa."],
        "attic": ["El {} está justo debajo del techo.", "Ana guarda sus juguetes viejos en el {}."],
        "hallway": ["Luis camina por el {} hasta su cuarto.", "El {} conecta las habitaciones."],
        "balcony": ["Ana toma café en el {} y ve la calle.", "Las flores están en el {}."],
        "office": ["Carlos trabaja en la {} de su casa.", "La computadora está en la {}."],
        "laundry room": ["Ana lava la ropa en el {}.", "La lavadora está en el {}."],
    },
    51: {
        "sofa": ["La familia se sienta en el {} a ver la tele.", "El gato duerme en el {}."],
        "shelf": ["Los libros están en el {}.", "Ana pone un jarrón en el {}."],
        "closet": ["Luis guarda su ropa en el {}.", "Ana cuelga los vestidos en el {}."],
        "mirror": ["Ana se peina frente al {}.", "En el {} Luis se ve la cara."],
        "carpet": ["Un niño gatea sobre la {} suave.", "La {} cubre el piso de la sala."],
        "curtain": ["Ana cierra la {} para que no entre el sol.", "La {} de la ventana es azul."],
        "fridge": ["La leche está en el {}.", "Luis guarda la comida fría en el {}."],
        "stove": ["Ana pone la sopa en la {}.", "Luis apaga la {} para no quemar la comida."],
        "sink": ["Luis lava los platos en el {}.", "Ana se lava las manos en el {}."],
        "table": ["Todos comen en la {}.", "Ana pone los platos sobre la {}."],
        "bed": ["Luis se acuesta en la {} para dormir.", "Ana tiende la {} por la mañana."],
        "TV": ["Luis ve una película en la {}.", "Ana apaga la {} y se va a dormir."],
    },
})
TEXTOS_VOCAB.update({
    38: (
        "Ana conoce a los vecinos de su barrio. Rosa [[is a|es una]] <<nurse|enfermera>>. "
        "Carlos [[is a|es un]] <<pilot|piloto>>. Pedro [[is a|es un]] <<driver|conductor>> "
        "de autobús. Sofía [[is an|es una]] <<artist|artista>>. Marta [[is a|es una]] "
        "<<dentist|dentista>> y Juan [[is a|es un]] <<farmer|agricultor>>. Ana [[is a|es una]] "
        "[[student|estudiante]]."
    ),
    39: (
        "Luis tiene un nuevo <<job|empleo>> en una <<company|empresa>> grande. Su "
        "<<boss|jefe>> es amable y su [[colleague|colega]] Sofía lo ayuda. Hoy hay una "
        "<<meeting|reunión>> a las diez. Luis lee un <<email|correo electrónico>> y revisa su "
        "<<schedule|horario>>. [[He is|Él está]] [[excited|emocionado]]."
    ),
    40: (
        "Ana se levanta <<early|temprano>> por la <<morning|mañana>>. Mira el "
        "<<clock|reloj>>: son las [[seven|siete]] <<o'clock|en punto>>. Tiene una "
        "<<hour|hora>> para llegar a la escuela. Al <<noon|mediodía>> almuerza y por la "
        "[[evening|atardecer]] hace la tarea. A la [[midnight|medianoche]] ya duerme."
    ),
    41: (
        "Ana cumple años en <<June|junio>>. Su mamá cumple en <<March|marzo>> y su papá en "
        "<<October|octubre>>. Luis viaja en <<July|julio>> y en <<December|diciembre>> "
        "celebran la Navidad. El año empieza en <<January|enero>>. [[She is|Ella está]] "
        "[[excited|emocionada]]."
    ),
    44: (
        "Esta es mi rutina. [[I|Yo]] <<wake up|despertarse>> a las seis y [[I|yo]] "
        "<<get up|levantarse>> enseguida. Luego [[I|yo]] <<take a shower|bañarse>> y [[I|yo]] "
        "<<have breakfast|desayunar>>. A las ocho [[I|yo]] <<go to work|ir al trabajo>>. Por "
        "la noche [[I|yo]] <<cook dinner|preparar la cena>> y [[I|yo]] [[go to bed|me voy a la "
        "cama]] temprano."
    ),
    47: (
        "Luis va al doctor. Le duele la <<head|cabeza>> y la <<back|espalda>>. El doctor le "
        "revisa la <<mouth|boca>>, la <<nose|nariz>> y la [[ear|oreja]]. También le mira un "
        "[[eye|ojo]]. Luis mueve el <<arm|brazo>> y la [[leg|pierna]]. Al final, se lava la "
        "<<hand|mano>>."
    ),
    48: (
        "Hoy hace frío. Ana se pone una <<shirt|camisa>>, una <<skirt|falda>>, "
        "<<socks|calcetines>> y <<shoes|zapatos>>. Encima lleva un <<coat|abrigo>>. Luis se "
        "pone [[pants|pantalones]], una <<jacket|chaqueta>> y un <<hat|sombrero>>. "
        "[[They are|Ellos están]] [[happy|felices]]."
    ),
    49: (
        "La familia de Ana vive en una <<house|casa>> con un <<garden|jardín>> y un "
        "<<garage|garaje>>. Para entrar, Ana abre la <<door|puerta>> con la [[key|llave]]. "
        "Adentro hay unas <<stairs|escaleras>> y una [[window|ventana]] grande. Luis, en "
        "cambio, vive en un <<apartment|departamento>>. Su [[address|dirección]] es calle "
        "Sol 5."
    ),
    50: (
        "Esta es la casa de Ana. En la <<kitchen|cocina>> su mamá prepara la comida. En el "
        "<<dining room|comedor>> comen todos juntos. Después ven la tele en la "
        "<<living room|sala>>. Ana duerme en su <<bedroom|dormitorio>> y se baña en el "
        "<<bathroom|baño>>. Por la tarde toma jugo en el <<balcony|balcón>>."
    ),
    51: (
        "Ana decora su nuevo cuarto. Pone la <<bed|cama>> junto a la ventana y una "
        "<<curtain|cortina>> azul. Sobre la <<carpet|alfombra>> pone un <<shelf|estante>> "
        "con libros. Cuelga la ropa en el <<closet|clóset>> y se mira en el "
        "<<mirror|espejo>>. En la sala, la familia ve la [[TV|televisión]] en el [[sofa|sofá]]."
    ),
})
FRASES.update({
    55: {
        "dog": ["El {} ladra cuando llega el cartero.", "Luis pasea a su {} por el parque."],
        "cat": ["El {} maúlla y duerme en el sofá.", "Ana acaricia a su {}."],
        "bird": ["El {} canta en el árbol.", "Un {} vuela sobre la casa."],
        "fish": ["El {} nada en la pecera.", "Luis pesca un {} en el río."],
        "horse": ["El vaquero monta un {} en el rancho.", "El {} corre por el campo."],
        "cow": ["La {} da leche.", "En la granja, la {} come pasto."],
        "pig": ["El {} vive en la granja y come maíz.", "Del {} se obtiene el tocino."],
        "sheep": ["La {} da lana.", "El pastor cuida a la {}."],
        "chicken": ["La {} pone huevos.", "En el corral hay una {} y un gallo."],
        "rabbit": ["El {} come zanahorias.", "Un {} salta por el jardín."],
        "mouse": ["El gato persigue al {}.", "El {} quiere el queso."],
        "lion": ["El {} es el rey de la selva.", "En el zoológico, el {} ruge."],
    },
    56: {
        "park": ["Luis juega fútbol en el {}.", "Los niños se columpian en el {}."],
        "store": ["Ana compra pan en la {}.", "La {} abre a las nueve."],
        "restaurant": ["La familia cena en un {}.", "El mesero trabaja en el {}."],
        "hospital": ["El doctor trabaja en el {}.", "Luis va al {} porque tiene fiebre."],
        "church": ["Los domingos, Rosa va a la {}.", "La {} tiene campanas."],
        "market": ["Ana compra frutas en el {}.", "En el {} hay muchos puestos."],
        "library": ["Luis pide un libro en la {}.", "En la {} hay que guardar silencio."],
        "hotel": ["Los turistas duermen en un {}.", "El {} tiene cien habitaciones."],
        "beach": ["En verano vamos a la {} a nadar.", "Ana camina por la arena de la {}."],
        "museum": ["La clase visita un {} de arte.", "En el {} hay pinturas antiguas."],
        "airport": ["Los aviones despegan en el {}.", "Luis llega al {} dos horas antes."],
        "theater": ["Ana ve una obra en el {}.", "El {} tiene un escenario grande."],
    },
    57: {
        "city": ["Ciudad de México es una {} muy grande.", "Ana vive en la {}, no en el campo."],
        "street": ["Luis cruza la {} con cuidado.", "Mi casa está en esta {}."],
        "road": ["El coche viaja por la {} entre dos ciudades.", "La {} pasa por las montañas."],
        "bridge": ["El coche cruza el {} sobre el río.", "Un {} une las dos orillas."],
        "building": ["Luis vive en un {} de diez pisos.", "Ese es el {} más alto de la ciudad."],
        "corner": ["Nos vemos en la {} de la calle.", "El semáforo está en la {}."],
        "traffic": ["Hay mucho {} a las ocho de la mañana.", "Luis llega tarde por el {}."],
        "square": ["La gente se reúne en la {} del pueblo.", "En la {} hay una fuente."],
        "sidewalk": ["Los peatones caminan por la {}.", "Ana espera en la {} a su mamá."],
        "traffic light": ["Si el {} está en rojo, el coche se detiene.", "Luis espera el verde en el {}."],
        "neighborhood": ["Todos mis vecinos viven en mi {}.", "Ana conoce cada calle de su {}."],
        "town": ["Mi abuelo vive en un {} pequeño.", "En el {} todos se conocen."],
    },
    58: {
        "turn left": ["Para llegar al banco, tienes que {} en la esquina.", "El taxista dice: «Ahora vamos a {}.»"],
        "turn right": ["En el semáforo, tienes que {} para llegar a la plaza.", "El mapa dice que debemos {} en la calle Sol."],
        "go straight": ["Para llegar al parque, debes {} por dos calles.", "El taxista dice: «Hay que {}, no gires.»"],
        "stop": ["El semáforo está en rojo: ¡{}!", "El policía levanta la mano y dice: «{}.»"],
        "near": ["La escuela está {} de mi casa: a dos calles.", "El banco queda {}; llego en un minuto."],
        "far": ["El aeropuerto está {} de aquí: a una hora.", "Vivo {} de mi trabajo."],
        "across": ["La tienda está {} de la calle.", "El parque está {} de la avenida desde mi casa."],
        "opposite": ["El banco está {} de la escuela.", "Mi casa queda {} del parque."],
        "corner": ["El café está en la {}.", "Gira en la {} de la calle."],
        "map": ["Luis busca la calle en el {}.", "Ana abre el {} en su teléfono."],
        "behind": ["El jardín está {} de la casa.", "El gato se esconde {} del sofá."],
        "in front of": ["El coche está {} de la casa.", "Ana espera {} de la escuela."],
    },
    59: {
        "car": ["Carlos maneja su {} al trabajo.", "El {} necesita gasolina."],
        "bus": ["Ana toma el {} para ir a la escuela.", "El {} se detiene en cada parada."],
        "train": ["El {} viaja sobre rieles.", "Luis viaja en {} a otra ciudad."],
        "plane": ["El {} despega del aeropuerto.", "Ana viaja en {} a otro país."],
        "bicycle": ["Luis va a la escuela en {}.", "Ana pedalea su {} por el parque."],
        "motorcycle": ["Carlos usa un casco en su {}.", "La {} hace mucho ruido."],
        "taxi": ["Luis pide un {} para ir al aeropuerto.", "El {} es amarillo."],
        "boat": ["El {} navega por el río.", "Los turistas pasean en {} por el lago."],
        "truck": ["El {} lleva la carga a la fábrica.", "Un {} grande bloquea la calle."],
        "subway": ["En la ciudad, Ana viaja en {} bajo tierra.", "El {} llega cada cinco minutos."],
        "ticket": ["Luis compra un {} para el tren.", "Ana muestra su {} al entrar."],
        "station": ["El tren llega a la {}.", "Luis espera en la {} del autobús."],
    },
    63: {
        "reading": ["A Ana le gusta {}: siempre lleva un libro.", "Luis pasa la tarde {} novelas."],
        "painting": ["A Sofía le gusta {} cuadros con óleo.", "Su hobby favorito es {}."],
        "dancing": ["A Ana le gusta {} salsa los sábados.", "Luis toma clases de {}."],
        "singing": ["A Luis le gusta {} en la ducha.", "Sofía practica {} en el coro."],
        "cooking": ["A Ana le gusta {}: hoy prepara pasta.", "Su hobby es {} platos nuevos."],
        "gardening": ["Al abuelo le gusta {}: cuida sus rosas.", "Los domingos hace {} en su jardín."],
        "drawing": ["A Luis le gusta {} con lápiz.", "Ana practica {} retratos."],
        "fishing": ["A mi papá le gusta {} en el lago.", "Va de {} con su caña."],
        "shopping": ["A Ana le gusta {} en el centro comercial.", "Los sábados va de {} con su mamá."],
        "traveling": ["A Luis le gusta {} a otros países.", "Su hobby favorito es {}."],
        "writing": ["A Sofía le gusta {} cuentos.", "Pasa las tardes {} en su diario."],
        "walking": ["A mi abuelo le gusta {} por el parque.", "Después de cenar, sale a {} un rato."],
    },
    64: {
        "soccer": ["Luis juega {} con sus amigos.", "En el {} se usa una pelota y dos porterías."],
        "basketball": ["En el {} se encesta en un aro.", "Ana juega {} en la escuela."],
        "tennis": ["Ana golpea la pelota con una raqueta: juega {}.", "En el {} hay una red en el centro."],
        "baseball": ["En el {} se batea con un bate.", "Luis juega {} con guante."],
        "volleyball": ["En el {} se pasa la pelota sobre una red.", "Ana juega {} en la playa."],
        "golf": ["En el {} se mete la bola en un hoyo.", "Carlos juega {} con palos."],
        "swimming": ["La {} se practica en la alberca.", "Ana entrena {} tres veces a la semana."],
        "running": ["Luis hace {} por el parque.", "La {} mejora tu resistencia."],
        "cycling": ["El {} es andar en bicicleta.", "Luis participa en una carrera de {}."],
        "boxing": ["En el {} se usan guantes.", "El {} se practica en un ring."],
        "team": ["Once jugadores forman un {}.", "Luis juega en el mismo {} que Ana."],
        "player": ["Cada {} de fútbol lleva un número.", "Un buen {} entrena todos los días."],
    },
    67: {
        "run": ["[[I|Yo]] {} rápido para alcanzar el autobús.", "[[They|Ellos]] {} en el parque."],
        "walk": ["[[I|Yo]] {} a la escuela cada día.", "[[We|Nosotros]] {} despacio por la playa."],
        "jump": ["[[I|Yo]] {} la cuerda en el recreo.", "[[They|Ellos]] {} en la cama elástica."],
        "swim": ["[[I|Yo]] {} en la alberca.", "[[We|Nosotros]] {} en el mar."],
        "sit": ["Cuando estoy cansado, [[I|yo]] {} en el sofá.", "[[We|Nosotros]] {} a la mesa para comer."],
        "stand": ["Cuando entra la profesora, [[we|nosotros]] {}.", "[[I|Yo]] {} para ver mejor."],
        "open": ["[[I|Yo]] {} la puerta para salir.", "[[They|Ellos]] {} la tienda a las nueve."],
        "close": ["Cuando salgo, [[I|yo]] {} la ventana.", "[[They|Ellos]] {} la tienda a las ocho."],
        "carry": ["[[I|Yo]] {} la mochila en la espalda.", "[[They|Ellos]] {} las cajas al camión."],
        "push": ["[[I|Yo]] {} la puerta para abrirla.", "[[We|Nosotros]] {} el coche."],
        "pull": ["[[I|Yo]] {} la puerta hacia mí.", "[[They|Ellos]] {} la cuerda con fuerza."],
        "throw": ["[[I|Yo]] {} la pelota a mi perro.", "[[They|Ellos]] {} las piedras al lago."],
    },
    68: {
        "money": ["Luis ahorra {} para comprar una bicicleta.", "Sin {} no puedes comprar nada."],
        "dollar": ["Un {} vale cien centavos.", "Ana paga con un billete de un {}."],
        "coin": ["Luis deja una {} en la fuente.", "Una {} es de metal y redonda."],
        "cash": ["Ana paga en {}, no con tarjeta.", "Luis lleva {} en su cartera."],
        "bill": ["Ana recibe un {} de veinte dólares.", "Un {} es de papel."],
        "card": ["Luis paga con su {} de crédito.", "Ana pasa la {} por la terminal."],
        "price": ["El {} de la camisa es veinte dólares.", "Luis pregunta el {} de un helado."],
        "bank": ["Ana ahorra su dinero en el {}.", "Carlos trabaja en un {}."],
        "cent": ["Un {} es la centésima parte de un dólar.", "Luis encuentra un {} en la calle."],
        "change": ["Luis paga con un billete grande y recibe el {}.", "Ana no tiene {} para el autobús."],
        "purse": ["Rosa guarda sus llaves en su {}.", "Ana lleva su {} colgada del hombro."],
        "salary": ["Cada mes Carlos recibe su {}.", "Ana pide un mejor {} en su trabajo."],
    },
    69: {
        "cheap": ["Este pan cuesta un dólar: es {}.", "Luis busca zapatos {}, no caros."],
        "expensive": ["Un coche nuevo es muy {}.", "Este reloj cuesta mil dólares: es {}."],
        "sale": ["En esta tienda todo está en {} hoy.", "Ana compra el vestido en {}."],
        "size": ["Ana pide una {} más grande de zapatos.", "¿Qué {} de camisa usas?"],
        "receipt": ["Luis guarda el {} por si quiere devolver el pantalón.", "La cajera da el {} después de pagar."],
        "customer": ["El {} pregunta el precio.", "Todo {} espera su turno en la fila."],
        "cashier": ["El {} cobra las compras.", "Ana paga a la {} en la caja."],
        "discount": ["La tienda ofrece un {} de veinte por ciento.", "Con el {} pago menos."],
        "basket": ["Ana pone las frutas en la {}.", "Luis lleva la {} llena de pan."],
        "pay": ["Ana va a {} en la caja.", "[[I|Yo]] {} con tarjeta."],
        "buy": ["[[I|Yo]] {} pan en la panadería.", "Luis quiere {} un juego."],
        "sell": ["La tienda va a {} ropa.", "[[They|Ellos]] {} frutas en el mercado."],
    },
    70: {
        "menu": ["El mesero trae el {}.", "Ana lee el {} para elegir su comida."],
        "order": ["Luis hace su {} al mesero.", "El {} de Ana es una sopa."],
        "plate": ["El mesero pone un {} frente a Luis.", "Ana come pasta del {}."],
        "glass": ["Ana bebe agua de un {}.", "El {} se cayó y se rompió."],
        "fork": ["Luis come la ensalada con un {}.", "El {} va a la izquierda del plato."],
        "knife": ["Ana corta la carne con un {}.", "El {} corta el pan."],
        "spoon": ["Luis toma la sopa con una {}.", "Ana mezcla el café con una {}."],
        "napkin": ["Ana se limpia la boca con una {}.", "La {} está al lado del plato."],
        "dessert": ["De {}, Luis pide pastel.", "El helado es un {} frío."],
        "tip": ["Ana deja una {} para el mesero.", "Luis paga la cuenta y da una {}."],
        "breakfast": ["El {} es la primera comida del día.", "Luis toma un {} de huevos."],
        "dinner": ["La {} es la última comida del día.", "La familia se reúne para la {}."],
    },
    72: {
        "health": ["Comer bien es bueno para la {}.", "Ana cuida su {} con ejercicio."],
        "medicine": ["El doctor receta una {}.", "Luis toma la {} después de comer."],
        "pain": ["Tengo {} en la pierna.", "Ana siente un {} fuerte."],
        "headache": ["Luis tiene {} y no puede estudiar.", "Ana toma una pastilla porque tiene {}."],
        "fever": ["Con 39 grados, Luis tiene {}.", "El termómetro marca {}."],
        "cough": ["Ana tiene {} y se tapa la boca.", "La {} no lo deja dormir."],
        "flu": ["Luis tiene {}: fiebre y mocos.", "En invierno hay mucha {}."],
        "pharmacy": ["Ana compra la medicina en la {}.", "La {} está abierta toda la noche."],
        "appointment": ["Luis tiene una {} con el doctor a las diez.", "Ana pide una {} para el dentista."],
        "allergy": ["Luis tiene {} al polen.", "Ana no come nueces por su {}."],
        "stomachache": ["Luis comió mucho y tiene {}.", "Ana no desayunó por su {}."],
        "sore throat": ["Ana no puede tragar: tiene {}.", "Luis toma té con miel por su {}."],
    },
    74: {
        "internet": ["Luis se conecta a {} para ver videos.", "Sin {} no puedo mandar el correo."],
        "website": ["Ana visita un {} de noticias.", "El {} de la escuela tiene los horarios."],
        "app": ["Ana descarga una {} en su teléfono.", "Luis usa una {} para hablar con su mamá."],
        "password": ["Ana escribe su {} para entrar a su cuenta.", "Luis olvidó su {}."],
        "screen": ["La {} del teléfono se rompió.", "Ana mira la {} de la computadora."],
        "keyboard": ["Luis escribe con el {}.", "El {} tiene letras y números."],
        "file": ["Ana guarda el {} en su computadora.", "Luis envía un {} a su jefe."],
        "message": ["Ana recibe un {} de su amiga.", "Luis escribe un {} rápido."],
        "video": ["Ana graba un {} de su perro.", "Luis ve un {} en internet."],
        "photo": ["Luis toma una {} del paisaje.", "Ana pone una {} de su familia."],
        "battery": ["El teléfono se apaga porque no tiene {}.", "Ana carga la {} de su teléfono."],
        "wifi": ["En la cafetería hay {} gratis.", "Luis pide la contraseña del {}."],
    },
    75: {
        "tree": ["El pájaro hace su nido en el {}.", "Luis planta un {} en el jardín."],
        "flower": ["Ana huele una {} roja.", "La abeja visita cada {}."],
        "river": ["El {} corre hacia el mar.", "Luis pesca en el {}."],
        "mountain": ["Ana sube a la {} más alta.", "En la {} hace mucho frío."],
        "forest": ["El {} tiene muchos árboles.", "Luis camina por el {}."],
        "lake": ["Los patos nadan en el {}.", "Ana pasea en bote por el {}."],
        "sea": ["Luis nada en el {}.", "El {} es salado."],
        "sun": ["El {} sale por la mañana.", "Ana se pone protector por el {}."],
        "moon": ["La {} brilla de noche.", "Luis mira la {} llena."],
        "star": ["Ana mira una {} en el cielo.", "Cada {} brilla en la noche."],
        "grass": ["El perro corre sobre el {}.", "Luis corta el {} del jardín."],
        "rock": ["Luis se sienta sobre una {}.", "La {} es dura."],
    },
    76: {
        "rain": ["Ana usa paraguas por la {}.", "Después de la {} sale el arcoíris."],
        "snow": ["Los niños hacen un muñeco de {}.", "En invierno cae {}."],
        "wind": ["El {} mueve las hojas.", "Con mucho {}, el sombrero vuela."],
        "cloud": ["Una {} tapa el sol.", "La {} es blanca y está en el cielo."],
        "storm": ["Hay una {} con truenos.", "Todos se quedan en casa por la {}."],
        "fog": ["Con la {} no se ve el camino.", "Luis maneja despacio por la {}."],
        "sunny": ["Hoy está {}: no hay nubes.", "En un día {} vamos a la playa."],
        "cloudy": ["Hay muchas nubes; está {}.", "El cielo está {} y gris."],
        "windy": ["Está {} y se vuela mi sombrero.", "En un día {} es buen momento para volar papalotes."],
        "hot": ["En verano hace mucho calor: está {}.", "El café está {}."],
        "cold": ["En invierno hace {}.", "Ana toma agua {}."],
        "warm": ["Hoy no hace calor ni frío: está {}.", "Ana toma un baño {}."],
    },
    77: {
        "spring": ["En {} florecen las flores.", "La {} viene después del invierno."],
        "summer": ["En {} hace calor y hay vacaciones.", "Vamos a la playa en {}."],
        "fall": ["En {} las hojas caen de los árboles.", "El {} viene después del verano."],
        "winter": ["En {} hace frío y cae nieve.", "El {} viene después del otoño."],
        "birthday": ["Ana sopla las velas en su {}.", "Mi {} es en junio."],
        "holiday": ["El Día de la Independencia es un {}.", "Hoy es {} y no hay escuela."],
        "party": ["Ana invita a sus amigos a una {}.", "La {} tiene música y pastel."],
        "gift": ["Luis abre su {} de cumpleaños.", "Ana envuelve un {} para su mamá."],
        "Christmas": ["El 25 de diciembre es {}.", "En {} ponemos un árbol con luces."],
        "New Year": ["El 1 de enero celebramos el {}.", "A medianoche del 31 de diciembre empieza el {}."],
        "wedding": ["Los novios se casan en una {}.", "Ana usa un vestido elegante en la {}."],
        "festival": ["El pueblo celebra un {} de música.", "Luis va al {} con sus amigos."],
    },
    84: {
        "went": ["Ayer Ana {} al mercado.", "Luis {} a la escuela en autobús."],
        "ate": ["Anoche Luis {} pizza.", "Ana {} una manzana en el recreo."],
        "saw": ["Ayer Ana {} una película.", "Luis {} a su amigo en el parque."],
        "had": ["Ana {} un examen ayer.", "Luis {} mucha hambre después de correr."],
        "did": ["Luis {} su tarea anoche.", "Ana {} ejercicio por la mañana."],
        "got": ["Ana {} un buen regalo ayer.", "Luis {} una nota alta en el examen."],
        "came": ["Ayer Luis {} a mi casa.", "Ana {} temprano a la escuela."],
        "took": ["Ana {} el autobús esta mañana.", "Luis {} una foto del paisaje."],
        "made": ["Ana {} un pastel ayer.", "Luis {} su cama esta mañana."],
        "said": ["Luis {} «hola» al entrar.", "Ana {} la verdad."],
        "gave": ["Luis le {} un regalo a Ana.", "Ana le {} agua al perro."],
        "bought": ["Ayer Ana {} un vestido.", "Luis {} pan en la panadería."],
    },
    88: {
        "passport": ["Para viajar a otro país necesitas un {}.", "Ana muestra su {} en el aeropuerto."],
        "suitcase": ["Luis empaca su ropa en la {}.", "Ana arrastra su {} por el pasillo."],
        "reservation": ["Tenemos una {} en el hotel.", "Luis hizo una {} para cenar."],
        "flight": ["El {} a Madrid sale a las diez.", "Ana perdió su {} por el tráfico."],
        "tourist": ["Un {} visita los museos.", "El {} toma fotos de la plaza."],
        "luggage": ["El {} pasa por la banda.", "Luis recoge su {} en el aeropuerto."],
        "guide": ["La {} explica la historia del castillo.", "El turista sigue a la {}."],
        "trip": ["Ana planea un {} a la playa.", "Luis regresa de su {} a París."],
        "receptionist": ["La {} entrega la llave del cuarto.", "Ana pregunta al {} por el desayuno."],
        "customs": ["En la {} revisan las maletas.", "Ana pasa la {} con su pasaporte."],
        "visa": ["Algunos países piden una {} para entrar.", "Luis tramita su {} en la embajada."],
        "souvenir": ["Ana compra un {} de la ciudad.", "Luis trae un {} para su mamá."],
    },
    94: {
        "history": ["Ana estudia la {} de su país.", "La {} cuenta lo que pasó hace mucho."],
        "kingdom": ["El rey gobierna el {}.", "Un {} tiene un rey o una reina."],
        "war": ["La {} deja muchos daños.", "Los países pelearon una {}."],
        "king": ["El {} usa una corona.", "El {} manda en el reino."],
        "queen": ["La {} vive en el castillo.", "La {} es la esposa del rey."],
        "castle": ["El rey vive en un {} con murallas.", "Los turistas visitan el {}."],
        "battle": ["Los soldados pelean una {}.", "La {} termina al atardecer."],
        "empire": ["El {} romano fue muy grande.", "Un {} gobierna muchos territorios."],
        "soldier": ["El {} defiende su país.", "Cada {} lleva un uniforme."],
        "century": ["Un {} tiene cien años.", "Ese castillo tiene más de un {} de antigüedad."],
        "leader": ["El {} guía a su pueblo.", "Un buen {} escucha a la gente."],
        "event": ["La boda es un {} importante.", "Ese {} cambió la historia."],
    },
    95: {
        "civilization": ["Egipto fue una gran {}.", "Una {} tiene escritura y ciudades."],
        "ancient": ["Las pirámides son construcciones {}.", "Ana estudia el mundo {}."],
        "Egypt": ["Las pirámides famosas están en {}.", "El río Nilo pasa por {}."],
        "Greece": ["Los juegos olímpicos nacieron en {}.", "Atenas es la capital de {}."],
        "Rome": ["El Coliseo está en {}.", "{} fue capital de un gran imperio."],
        "Maya": ["La civilización {} vivió en México y Guatemala.", "El calendario {} es famoso."],
        "Aztec": ["La civilización {} construyó Tenochtitlan.", "El imperio {} tenía su capital en un lago."],
        "Inca": ["La civilización {} vivió en los Andes.", "Machu Picchu fue construida por la cultura {}."],
        "pyramid": ["Una {} tiene cuatro caras triangulares.", "Los faraones fueron enterrados en una {}."],
        "temple": ["Los sacerdotes rezaban en el {}.", "El {} estaba dedicado a un dios."],
        "god": ["Los antiguos adoraban a un {}.", "Ra era un {} egipcio."],
        "pharaoh": ["El {} gobernaba Egipto.", "Tutankamón fue un {} joven."],
    },
    96: {
        "archaeology": ["La {} estudia el pasado con restos antiguos.", "Ana estudia {} en la universidad."],
        "archaeologist": ["El {} excava ruinas con un pincel.", "La {} encontró una vasija."],
        "tomb": ["El faraón fue enterrado en una {}.", "La {} guardaba muchos tesoros."],
        "ruins": ["Los turistas visitan las {} mayas.", "Las {} muestran cómo vivían."],
        "artifact": ["Un {} es un objeto hecho por humanos.", "El museo guarda un {} de oro."],
        "excavation": ["La {} descubrió una ciudad enterrada.", "Durante la {} usan palas y pinceles."],
        "bone": ["El perro roe un {}.", "El arqueólogo encontró un {} antiguo."],
        "pottery": ["La {} es de barro cocido.", "Esa {} tiene dibujos antiguos."],
        "treasure": ["Los piratas buscan un {}.", "En la tumba había un {} de oro."],
        "discovery": ["El {} de la tumba fue una sorpresa.", "Ese {} cambió lo que sabíamos."],
        "site": ["El {} arqueológico está abierto al público.", "Ana visita el {} de las pirámides."],
        "layer": ["Cada {} de tierra guarda una época.", "Debajo de esta {} hay más ruinas."],
    },
    97: {
        "mummy": ["Una {} es un cuerpo preservado.", "En el museo hay una {} egipcia."],
        "sarcophagus": ["La momia descansa en un {}.", "El {} de piedra pesa mucho."],
        "coffin": ["Colocaron el cuerpo en un {} de madera.", "El {} estaba cerrado."],
        "skeleton": ["Del cuerpo solo quedó el {}.", "Un {} tiene muchos huesos."],
        "burial": ["El {} del faraón fue una gran ceremonia.", "En el lugar del {} encontraron joyas."],
        "body": ["La momia conserva el {} por siglos.", "El {} humano tiene cabeza, brazos y piernas."],
        "ritual": ["El sacerdote hizo un {} sagrado.", "Ese {} honraba a los dioses."],
        "dry": ["El desierto es muy {}.", "La momia quedó {} y sin agua."],
        "desert": ["Egipto tiene un gran {}.", "En el {} hay mucha arena y poca agua."],
        "sand": ["El camello camina sobre la {}.", "La {} del desierto es caliente."],
        "gold": ["El faraón tenía una máscara de {}.", "El {} es un metal amarillo."],
        "mask": ["Tutankamón tenía una {} de oro.", "Ana se pone una {} en la fiesta."],
    },
})
# ======================= ESCENAS (lote 1) =======================
FRASES_N1 = [
    ["Un pirata levanta su sombrero y ruge: «<<I|Yo>> [[am|soy]] el capitán Barbarroja.»",
     "Llegas a una fiesta disfrazado de dinosaurio y anuncias: «<<I|Yo>> [[am|soy]] Rex.»",
     "Un robot se presenta en la feria de ciencias: «<<I|Yo>> [[am|soy]] Beto, el robot.»",
     "El mago saca un conejo del sombrero y dice: «[[I|Yo]] <<am|soy>> el Gran Max.»",
     "La astronauta habla por radio: «[[I|Yo]] <<am|soy>> la comandante Vega.»",
     "La reina de los piratas mira su mapa: «[[I|Yo]] <<am|soy>> la dueña de este tesoro.»"],
    ["El detective señala al mayordomo y dice: «<<You|Tú>> [[are|eres]] el culpable.»",
     "Una niña le susurra a su robot: «<<You|Tú>> [[are|eres]] mi mejor amigo.»",
     "El hada mira al príncipe convertido en rana: «<<You|Tú>> [[are|eres]] un príncipe.»",
     "El entrenador le dice al nuevo jugador: «[[You|Tú]] <<are|eres>> el más rápido del equipo.»",
     "La abuela sonríe al ver tu dibujo: «[[You|Tú]] <<are|eres>> un artista.»",
     "El capitán habla con su tripulación: «[[You|Tú]] <<are|eres>> valiente.»"],
    ["Hablas de un superhéroe: «<<He|Él>> [[is|es]] muy fuerte.»",
     "Le cuentas a tu amigo del nuevo profesor: «<<He|Él>> [[is|es]] muy divertido.»",
     "Sales emocionado de un concierto: «<<She|Ella>> [[is|es]] increíble.»",
     "Le presumes a tu amigo: «<<She|Ella>> [[is|es]] la mejor cocinera.»",
     "Miras a tu tortuga cruzar la sala: «<<It|Él (animal)>> [[is|es]] muy lenta.»",
     "Señalas el dragón de tu libro: «<<It|Él (animal)>> [[is|es]] gigante.»",
     "Sales del cine y opinas: «[[He|Él]] <<is|es>> malísimo.»",
     "Cuentas un cuento de invierno: «[[She|Ella]] <<is|es>> muy fría.»"],
    ["Tú y tu mejor amigo ganan el concurso de baile y gritan: «<<We|Nosotros>> [[are|somos]] los campeones.»",
     "Señalas a dos astronautas en el cohete: «<<They|Ellos>> [[are|son]] héroes.»",
     "Tu hermana y tú ven un eclipse: «<<We|Nosotros>> [[are|somos]] muy afortunados.»",
     "Miras a los bailarines en el escenario: «<<They|Ellos>> [[are|son]] increíbles.»"],
    ["Acabas de ganar un premio y gritas: «[[I am|Yo estoy]] <<happy|feliz>>.»",
     "Terminas un maratón y dices jadeando: «[[I am|Yo estoy]] <<tired|cansado>>.»",
     "Llamas a tu amigo que busca la fiesta: «[[We are|Nosotros estamos]] <<here|aquí>>.»",
     "Es su cumpleaños y todos cantan: «[[She is|Ella está]] <<happy|feliz>>.»",
     "Después de tres exámenes seguidos: «[[They are|Ellos están]] <<tired|cansados>>.»",
     "Tu perro perdido aparece en la puerta: «[[It is|Él está]] <<here|aquí>>.»",
     "Cruzas la meta y suspiras: «[[I|Yo]] <<am|estoy>> [[tired|cansado]].»",
     "Tu equipo ganó la final: «[[We|Nosotros]] <<are|estamos>> [[happy|felices]].»",
     "Miras al cocinero sonriendo: «[[He|Él]] <<is|está>> [[happy|feliz]].»"],
    ["Señalas a tu nueva maestra de ciencias: «[[She is|Ella es]] <<a|una>> [[teacher|profesora]].»",
     "Presentas a tu primo en la escuela: «[[He is|Él es]] <<a|un>> [[student|estudiante]].»",
     "Tu tía trabaja en una clínica: «[[She is|Ella es]] <<a|una>> [[doctor|doctora]].»",
     "Llevas tu mochila el primer día de clases: «[[I am|Yo soy]] [[a|un]] <<student|estudiante>>.»",
     "Tu hermano menor va a la primaria: «[[He is|Él es]] [[a|un]] <<student|estudiante>>.»",
     "Escribes en el pizarrón con una tiza: «[[I am|Yo soy]] [[a|un]] <<teacher|profesor>>.»",
     "Tu tío da clases de música: «[[He is|Él es]] [[a|un]] <<teacher|profesor>>.»",
     "Usas bata blanca y estetoscopio: «[[I am|Yo soy]] [[a|una]] <<doctor|doctora>>.»",
     "Tu tía atiende en un hospital: «[[She is|Ella es]] [[a|una]] <<doctor|doctora>>.»"],
    ["Dices que el monstruo del armario no existe: «[[It|Él (animal)]] <<is not|no es|isn't>> real.»",
     "Te piden que cantes en la fiesta y respondes: «[[I|Yo]] <<am not|no soy>> cantante.»",
     "Miras a los gemelos que no se parecen: «[[They|Ellos]] <<are not|no son|aren't>> iguales.»",
     "Tu amiga rechaza el pastel: «[[She|Ella]] <<is not|no está|isn't>> [[tired|cansada]].»",
     "Te invitan a nadar pero no quieres: «[[I|Yo]] <<am not|no estoy>> [[happy|feliz]].»",
     "El tren sale y ellos no suben: «[[They|Ellos]] <<are not|no están|aren't>> [[here|aquí]].»"],
    ["Preguntas por tu amiga: «<<Is|¿Está>> [[she here|ella aquí]]?»",
     "Preguntas por el profesor nuevo: «<<Is|¿Es>> [[he a teacher|él profesor]]?»",
     "Responden desde la puerta: «<<Yes|Sí>>, [[she is|ella lo está]].»",
     "Tu amigo confirma: «<<Yes|Sí>>, [[he is|él lo es]].»",
     "Preguntas al equipo antes de empezar: «<<Are|¿Están>> [[you ready|ustedes listos]]?»",
     "Preguntas por tus vecinos: «<<Are|¿Están>> [[they tired|ellos cansados]]?»",
     "Los niños contestan a coro: «<<No|No>>, [[we are not|no lo estamos]].»",
     "Tu mamá pregunta si el pastel es de chocolate: «<<No|No>>, [[it is not|no lo es]].»",
     "Dudas en la puerta: «<<Am|¿Estoy>> [[I late|yo tarde]]?»",
     "Te miras en el espejo: «<<Am|¿Soy>> [[I tired|yo cansado]]?»"],
    ["Te presentas rápido a los nuevos vecinos: «<<I'm|Yo soy>> tu vecino nuevo.»",
     "Presentas a tu hermana: «<<She's|Ella es>> mi hermana menor.»",
     "Señalas a tus padres en la foto: «<<They're|Ellos son>> mis padres.»",
     "Hablas de tu hermano: «<<He's|Él es>> el más alto.»",
     "Dices tras la carrera: «<<I'm|Yo estoy>> [[tired|cansado]].»",
     "Tú y tu amigo llegan tarde a la fiesta: «<<We're|Nosotros estamos>> [[here|aquí]].»",
     "Le dices a tu amigo después de ganar: «<<You're|Tú eres>> un campeón.»",
     "Niegas lo que dijo tu hermano: «[[He|Él]] <<isn't|no es|is not>> [[a doctor|doctor]].»",
     "Miras el asiento vacío: «[[They|Ellos]] <<aren't|no están|are not>> [[here|aquí]].»"],
]
FRASES.update({
    3: {
        "hello": ["Tu abuela contesta la videollamada con rulos en el pelo y tú gritas: «¡{}, abuela!»", "El astronauta pisa la Luna y saluda a la cámara: «{} a todos en la Tierra.»"],
        "hi": ["Te cruzas en el pasillo con tu mejor amigo y le dices, como siempre: «{}.»", "Un niño le hace señas a otro en el parque: «¡{}! ¿Juegas conmigo?»"],
        "goodbye": ["El astronauta cierra la escotilla, mira la Tierra y susurra: «{}, casa.»", "La princesa se sube al tren y le dice al reino: «{} para siempre.»"],
        "bye": ["Sales corriendo porque llegas tarde y le gritas a tu hermano: «¡{}!»", "Terminas la llamada con tu amigo: «Nos vemos mañana, ¡{}!»"],
        "good morning": ["Suena el gallo y saludas al sol: «{}, mundo.»", "El panadero abre a las cinco y saluda a los primeros clientes: «{}.»"],
        "good afternoon": ["Entras a la biblioteca a las tres y saludas a la bibliotecaria: «{}.»", "Un taxista recoge a un pasajero después del almuerzo: «{}, ¿a dónde vamos?»"],
        "good evening": ["Llegas a un restaurante elegante a las ocho de la noche y dices: «{}.»", "El presentador del noticiero empieza su programa: «{}, estas son las noticias.»"],
        "good night": ["Apagas la luz y le dices a tu peluche: «{}.»", "El abuelo cierra el cuento y le dice a su nieta: «{}, que sueñes bonito.»"],
        "please": ["Quieres el último taco y le dices a tu hermano: «Pásamelo, {}.»", "Al pedir un helado de chocolate, sonríes y dices: «Uno de chocolate, {}.»"],
        "thanks": ["La vecina te regala un pastel enorme sin avisar y tú dices: «{}.»", "El mesero te trae la cuenta y le dices: «{}.»"],
        "sorry": ["Tu perro se comió la tarea y le dices a la maestra: «{}… es una historia larga.»", "Pisas sin querer el pie de alguien en el autobús: «{}.»"],
        "excuse me": ["Quieres pasar entre la gente del concierto y dices: «{}.»", "Levantas la mano para llamar al mesero: «{}, ¿me trae agua?»"],
    },
    4: {
        "zero": ["Tu celular marca 0 % de batería: tienes {} por ciento.", "En el marcador final del partido nadie anotó: 0 goles, o sea {}."],
        "one": ["Un unicornio tiene 1 cuerno: {} cuerno.", "En el plato queda 1 sola galleta: {} galleta."],
        "two": ["Una bicicleta tiene 2 ruedas: {} ruedas.", "Tienes 2 ojos para ver: {} ojos."],
        "three": ["Un trébol común tiene 3 hojas: {} hojas.", "Los cuentos hablan de 3 cerditos: {} cerditos."],
        "four": ["Un perro tiene 4 patas: {} patas.", "Un trébol raro de la suerte tiene 4 hojas: {} hojas."],
        "five": ["Chocas los 5 dedos de la mano con tu amigo: {} dedos.", "Una estrella de mar tiene 5 brazos: {} brazos."],
        "six": ["Un dado tiene 6 caras: {} caras.", "Una caja chica de huevos trae 6 huevos: {} huevos."],
        "seven": ["La semana tiene 7 días: {} días.", "El arcoíris tiene 7 colores: {} colores."],
        "eight": ["Un pulpo tiene 8 brazos: {} brazos.", "Una araña tiene 8 patas: {} patas."],
        "nine": ["Dicen que un gato tiene 9 vidas: {} vidas.", "Un equipo de béisbol tiene 9 jugadores en el campo: {} jugadores."],
        "ten": ["Cuentas tus 10 dedos de las manos: {} dedos.", "Sacas 10 en el examen y gritas de felicidad: ¡{}!"],
    },
    5: {
        "Monday": ["Suena la alarma tras el fin de semana y todos gimen: es {}.", "Es el primer día de la semana escolar, el que nadie quiere: {}."],
        "Tuesday": ["Después del lunes llega el segundo día de la semana: {}.", "Si el lunes fue ayer, hoy es {}."],
        "Wednesday": ["A mitad de la semana, el día del medio se llama {}.", "Si el lunes y el martes ya pasaron, hoy es {}."],
        "Thursday": ["Después del miércoles y antes del viernes está {}.", "Falta solo un día para el viernes: hoy es {}."],
        "Friday": ["El día antes del fin de semana, todos lo esperan: {}.", "Es el último día de clases de la semana: {}."],
        "Saturday": ["Te levantas tarde, no hay escuela ni trabajo: es {}.", "Después del viernes, el primer día del fin de semana: {}."],
        "Sunday": ["El último día de la semana, tu familia come junta: {}.", "Después del sábado y antes del lunes está {}."],
        "week": ["Siete días seguidos forman una {}.", "Estudias inglés tres veces por {}."],
        "weekend": ["El sábado y el domingo juntos son el {}.", "Por fin llega el {} y puedes dormir hasta tarde."],
        "day": ["Desde que sale el sol hasta que vuelve a salir pasa un {}.", "Hoy es un gran {}: ¡cumples años!"],
        "today": ["No es ayer ni es mañana: es {}.", "«{} es el gran día», dice el novio al despertar."],
        "tomorrow": ["Hoy es viernes; el sábado será {}.", "El examen no es hoy: es {}, el día después de hoy."],
    },
    7: {
        "country": ["México, Japón y Canadá son cada uno un {} diferente.", "Un {} tiene su propia bandera y su propio himno."],
        "Mexico": ["Cuando comes tacos al pastor, estás probando comida de {}.", "La pirámide de Chichén Itzá está en {}."],
        "Spain": ["Bailas flamenco en Sevilla, en {}.", "La paella nació en Valencia, en {}."],
        "France": ["Subes a la Torre Eiffel en París, {}.", "Comes un croissant en una cafetería de {}."],
        "Germany": ["Berlín es la capital de {}.", "El Muro de Berlín estuvo en {}."],
        "Italy": ["Comes una pizza auténtica en Nápoles, en {}.", "El Coliseo está en Roma, {}."],
        "China": ["La Gran Muralla se extiende por {}.", "Los pandas viven en las montañas de {}."],
        "Japan": ["Ves pasar un tren bala cerca del monte Fuji, en {}.", "Comes sushi en Tokio, la capital de {}."],
        "Brazil": ["Bailas samba en el carnaval de Río, en {}.", "El río Amazonas cruza gran parte de {}."],
        "Canada": ["Ves un oso y un bosque de arces al norte de Estados Unidos, en {}.", "Su capital es Ottawa, en {}."],
        "England": ["Escuchas el Big Ben en Londres, {}.", "Tomas té con leche a las cinco, como en {}."],
        "the United States": ["Miras la Estatua de la Libertad en Nueva York, en {}.", "Washington D. C. es la capital de {}."],
    },
    8: {
        "Mexican": ["Un mariachi con sombrero es un músico {}.", "Un taco al pastor es comida {}."],
        "Spanish": ["La paella y el flamenco son tradiciones {}.", "Un torero de Madrid es un torero {}."],
        "French": ["Un croissant recién horneado es un pan {}.", "Un pintor de París es un pintor {}."],
        "German": ["Una salchicha con chucrut es comida {}.", "Un coche que viene de Múnich es un coche {}."],
        "Italian": ["La pizza napolitana es comida {}.", "Un gondolero de Venecia es un gondolero {}."],
        "Chinese": ["Un dragón de papel en el Año Nuevo es una tradición {}.", "Los palillos para comer son un invento {}."],
        "Japanese": ["El sushi es comida {}.", "Un samurái de hace siglos era un guerrero {}."],
        "Brazilian": ["El samba del carnaval es música {}.", "Un futbolista de Río es un jugador {}."],
        "Canadian": ["El jarabe de maple es un producto {}.", "Un leñador de las montañas de Vancouver es un leñador {}."],
        "English": ["El idioma de Shakespeare es el {}.", "Un habitante de Inglaterra es {}."],
        "American": ["Una hamburguesa con papas en un partido de béisbol es comida {}.", "Un vaquero de Texas es un vaquero {}."],
        "British": ["El té con leche a las cinco es una costumbre {}.", "Los autobuses rojos de dos pisos son un símbolo {}."],
    },
    10: {
        "eleven": ["Un equipo de fútbol en la cancha tiene 11 jugadores: {} jugadores.", "Tu hermana cumple 11 años: {} años."],
        "twelve": ["Una docena de donas son 12 donas: {} donas.", "El reloj marca las 12 en punto: las {}."],
        "thirteen": ["Un adolescente acaba de cumplir 13 años: {} años.", "El viernes 13 da mala suerte: viernes {}."],
        "fifteen": ["Una quinceañera celebra sus 15 años: {} años.", "El partido tiene 15 minutos de tiempo extra: {} minutos."],
        "eighteen": ["Al cumplir 18 años ya eres mayor de edad: {} años.", "En un campo de golf hay 18 hoyos: {} hoyos."],
        "twenty": ["Tienes 20 dedos entre manos y pies: {} dedos.", "Un billete de 20 pesos: {} pesos."],
        "thirty": ["Septiembre tiene 30 días: {} días.", "Esperas 30 minutos al médico: {} minutos."],
        "fifty": ["Estados Unidos tiene 50 estrellas en su bandera: {} estrellas.", "Medio siglo son 50 años: {} años."],
        "sixty": ["Una hora tiene 60 minutos: {} minutos.", "Un minuto tiene 60 segundos: {} segundos."],
        "eighty": ["Tu bisabuela cumple 80 años: {} años.", "La autopista limita la velocidad a 80 kilómetros por hora: {}."],
        "ninety": ["Un ángulo recto mide 90 grados: {} grados.", "El examen vale 90 puntos: {} puntos."],
        "one hundred": ["Un siglo tiene 100 años: {} años.", "Sacas 100 en el examen y saltas de alegría: ¡{}!"],
    },
    11: {
        "book": ["Te pierdes en un mundo de dragones sin salir del sofá, leyendo un {}.", "Abres el {} de inglés en la página uno."],
        "pen": ["Firmas un contrato importante con un {} azul.", "Se te acabó la tinta del {} en pleno examen."],
        "pencil": ["Te equivocas al dibujar y usas la goma del {}.", "Sacas punta a tu {} antes del examen."],
        "desk": ["Guardas tus cuadernos dentro de tu {}.", "Te duermes con la cabeza sobre el {}."],
        "chair": ["Te sientas en una {} y se rompe una pata.", "Falta una {} para el último que llega."],
        "board": ["El profesor escribe la fecha en el {} con un plumón.", "Te pasan al {} a resolver un problema."],
        "notebook": ["Dibujas monstruos en los márgenes de tu {}.", "Anotas la tarea en tu {} para no olvidarla."],
        "window": ["Miras llover por la {} durante la clase.", "Un pájaro golpea la {} del salón."],
        "door": ["El director abre la {} y todos se callan.", "Cierras la {} de un portazo por error."],
        "dictionary": ["No sabes qué significa una palabra y la buscas en el {}.", "Un {} explica el significado de miles de palabras."],
        "backpack": ["Llevas tu almuerzo y tus libros en la {}.", "Olvidaste tu {} en el autobús."],
        "classroom": ["Entras al {} y ya está sonando el timbre.", "Todos se sientan en el {} cuando llega el profesor."],
    },
    16: {
        "phone": ["Se te cae el {} al piso y contienes la respiración.", "Tu {} vibra con un mensaje en plena clase."],
        "key": ["Buscas la {} de tu casa en todos los bolsillos.", "Giras la {} y la puerta por fin se abre."],
        "watch": ["Miras tu {} y te das cuenta de que llegas tarde.", "El abuelo te regala su viejo {} de pulsera."],
        "bag": ["Llenas la {} de pan y fruta en el mercado.", "Una {} de plástico se vuela con el viento."],
        "umbrella": ["Empieza a llover y abres tu {} amarillo.", "El viento voltea tu {} al revés."],
        "camera": ["Tomas una foto del atardecer con tu {}.", "La {} graba tu baile sin que te des cuenta."],
        "sunglasses": ["En la playa te pones tus {} para el sol.", "Un famoso sale del hotel con {} enormes para que no lo reconozcan."],
        "headphones": ["Te pones los {} y el mundo desaparece.", "Un cable enredado en los {} te hace perder la paciencia."],
        "laptop": ["Escribes tu tarea en la {} hasta tarde.", "La {} se calienta demasiado sobre tus piernas."],
        "wallet": ["Pagas en la tienda y te das cuenta de que olvidaste la {}.", "Una {} de cuero guarda tus tarjetas y billetes."],
        "charger": ["Tu celular está en 1 % y buscas el {} desesperado.", "Enchufas el {} y por fin la batería sube."],
        "lamp": ["Enciendes la {} de tu escritorio para leer.", "Frotas una {} vieja y sale un genio."],
    },
    21: {
        "man": ["Un {} con bigote espera el autobús leyendo el periódico.", "El {} del disfraz de pirata se tropieza en la fiesta."],
        "woman": ["Una {} con sombrero vende flores en la esquina.", "La {} astronauta saluda desde el cohete."],
        "boy": ["Un {} con una gorra pasea a su perro.", "El {} pequeño se esconde detrás de su mamá."],
        "girl": ["Una {} con trenzas dibuja un dragón en la acera.", "La {} más rápida de la escuela gana la carrera."],
        "child": ["Un niño o una niña es un {}.", "Cada {} merece tiempo para jugar."],
        "baby": ["El {} se ríe cuando le haces caras chistosas.", "Un {} llora a las tres de la madrugada."],
        "friend": ["Un {} de verdad te ayuda cuando estás en problemas.", "Le cuentas un secreto a tu mejor {}."],
        "adult": ["Cuando cumples dieciocho ya eres un {}.", "Un {} debe pagar sus propios impuestos."],
        "person": ["Cada {} tiene huellas dactilares distintas.", "Eres una {} única, como nadie más."],
        "people": ["Las {} hacen fila para entrar al concierto.", "Mucha {} se reúne en la plaza para la fiesta."],
        "neighbor": ["Tu {} toca la puerta para pedirte azúcar.", "El {} de al lado toca la guitarra a medianoche."],
        "stranger": ["Un {} se acerca y pregunta por una calle, y tú no lo conoces.", "Nunca aceptes dulces de un {}."],
    },
    22: {
        "mother": ["Tu {} te abraza cuando llegas a casa.", "Tu {} te prepara el desayuno todos los días."],
        "father": ["Tu {} te enseña a andar en bicicleta.", "Tu {} te lleva a la escuela en su coche."],
        "sister": ["Tu {} te presta su ropa sin preguntar.", "Tu {} menor te sigue a todas partes."],
        "brother": ["Tu {} mayor te defiende en la escuela.", "Tu {} te roba el control de la tele."],
        "son": ["El hijo varón de tus padres, o sea tu hermano, es su {}.", "El {} de la reina heredará el trono."],
        "daughter": ["La hija de tus padres, o sea tú si eres mujer, es su {}.", "La {} del rey será la princesa."],
        "grandmother": ["Tu {} te cuenta historias de cuando era niña.", "La mamá de tu mamá es tu {}."],
        "grandfather": ["Tu {} te enseña a jugar ajedrez.", "El papá de tu papá es tu {}."],
        "parents": ["Tus {} te dan permiso de salir.", "Tu mamá y tu papá juntos son tus {}."],
        "uncle": ["El hermano de tu mamá, tu {}, llega con regalos.", "Tu {} cuenta chistes en las cenas familiares."],
        "aunt": ["La hermana de tu papá, tu {}, te envía tarjetas.", "Tu {} hace el mejor pastel de la familia."],
        "cousin": ["Tu {} llega de otro país para las vacaciones.", "El hijo de tu tío es tu {}."],
    },
    23: {
        "red": ["El semáforo dice alto con su luz {}.", "El tomate maduro es {}."],
        "blue": ["Un día sin nubes, el cielo es {}.", "En la playa, el mar se ve {}."],
        "green": ["El pasto recién cortado es {}.", "Un sapo en el pantano es {}."],
        "yellow": ["Un pollito recién nacido es {}.", "El sol pintado en un dibujo se colorea de {}."],
        "black": ["Tu gato entre las sombras de la noche es {}.", "El café sin leche es {}."],
        "white": ["La nieve cubre la montaña de {}.", "Una nube de algodón es {}."],
        "brown": ["El chocolate derretido es {}.", "La tierra mojada del jardín es {}."],
        "orange": ["Una zanahoria es de color {}.", "El atardecer se tiñe de {} sobre el mar."],
        "pink": ["El algodón de azúcar de la feria es {}.", "Un flamenco es de color {}."],
        "gray": ["Un elefante es {}.", "Las nubes de tormenta se ven {}."],
        "purple": ["Las uvas moradas y las berenjenas son de color {}.", "Mezclas azul con rojo y te sale {}."],
        "gold": ["Un pirata abre un cofre lleno de monedas de {}.", "La medalla del primer lugar es de color {}."],
    },
    24: {
        "big": ["Una ballena es un animal muy {}.", "Te pierdes en una casa tan {} que tiene cien cuartos."],
        "small": ["Una hormiga es un animal muy {}.", "Buscas la llave en una caja tan {} que solo cabe un dedo."],
        "new": ["Estrenas un teléfono {} que huele a caja.", "El coche {} brilla sin un solo rayón."],
        "old": ["El libro tiene cien años y es muy {}.", "Un castillo {} tiene telarañas y fantasmas."],
        "good": ["Sacas 10 en el examen y es una nota {}.", "Un buen amigo es un {} amigo."],
        "bad": ["Sacas 2 en el examen y es una nota {}.", "El villano de la película es muy {}."],
        "young": ["Un bebé es muy {}.", "Un cachorro es {}; apenas tiene dos meses."],
        "tall": ["Una jirafa es muy {}.", "Un jugador de básquetbol es {}; mide dos metros."],
        "short": ["Un enano del cuento es {}.", "El camino es {}: llegas en dos minutos."],
        "fast": ["Un guepardo es el animal más {}.", "Un cohete despega {} hacia el espacio."],
        "slow": ["La tortuga camina muy {}.", "El caracol cruza el jardín {}."],
        "beautiful": ["Un arcoíris sobre el mar es {}.", "Un atardecer en la montaña es {}."],
    },
})
# ======================= ESCENAS (lote 2) =======================
FRASES.update({
    26: {
        "sad": ["Se te escapa tu globo favorito hacia el cielo y estás {}.", "Terminas la última página de tu libro favorito y estás {} porque se acabó."],
        "angry": ["Alguien se comió tu pizza sin preguntar y estás {}.", "Tu hermano rompió tu videojuego y estás {}."],
        "afraid": ["Suena un trueno en medio de la noche y estás {}.", "Ves una sombra enorme en la pared y estás {}."],
        "hungry": ["No desayunaste y tu estómago ruge: estás {}.", "Huele a pizza recién salida del horno y estás {}."],
        "thirsty": ["Corres bajo el sol sin agua y estás {}.", "Comes palomitas muy saladas y estás {}."],
        "bored": ["Llueve, no hay internet y no tienes nada que hacer: estás {}.", "La clase dura tres horas y estás {}."],
        "excited": ["Mañana viajas a un parque de diversiones y estás {}.", "Esperas el último capítulo de tu serie favorita y estás {}."],
        "nervous": ["Vas a hablar frente a toda la escuela y estás {}.", "Esperas el resultado de tu examen y estás {}."],
        "worried": ["Tu mamá no contesta el teléfono y estás {}.", "Tu gato no ha vuelto a casa en dos días y estás {}."],
        "surprised": ["Abres la puerta y todos gritan «¡sorpresa!»: estás {}.", "Encuentras un billete en tu abrigo viejo y estás {}."],
        "proud": ["Tu hermano menor aprende a andar en bicicleta y estás {} de él.", "Terminas un rompecabezas de mil piezas y estás {}."],
        "sick": ["Tienes fiebre, tos y dolor de cabeza: estás {}.", "No puedes ir a la escuela porque estás {}."],
    },
    27: {
        "bread": ["Huele a {} recién horneado en la panadería.", "Untas mantequilla en una rebanada de {}."],
        "rice": ["El sushi se enrolla con alga y {}.", "Sirves {} blanco junto a los frijoles."],
        "egg": ["Rompes un {} sobre la sartén caliente.", "La gallina deja un {} en el nido."],
        "cheese": ["Un ratón de caricatura persigue un trozo de {}.", "La pizza lleva mucho {} derretido."],
        "meat": ["El asador huele a {} a la parrilla.", "Un vegetariano no come {}."],
        "fruit": ["Las fresas, los plátanos y las manzanas son {}.", "De postre siempre pides {} fresca."],
        "apple": ["Dice el refrán que una al día te mantiene lejos del doctor: la {}.", "Muerdes una {} roja y crujiente."],
        "banana": ["El mono pela un {} amarillo.", "Te resbalas con una cáscara de {} en una caricatura."],
        "potato": ["Las papas fritas se hacen con {}.", "Preparas puré con una {} hervida."],
        "tomato": ["La salsa de la pizza se hace con {}.", "Cortas una rodaja de {} para tu sándwich."],
        "salad": ["Mezclas lechuga, pepino y tomate en una {}.", "Pides una {} como entrada."],
        "soup": ["En un día de lluvia tomas una {} caliente.", "Tomas la {} con una cuchara."],
    },
    28: {
        "water": ["Después de correr, bebes un vaso de {} fría.", "Los peces viven en el {}."],
        "milk": ["Mojas las galletas en un vaso de {}.", "Tu gato lame un plato de {}."],
        "juice": ["Exprimes naranjas para hacer {} fresco.", "Pides un {} de manzana en el desayuno."],
        "coffee": ["Tu papá no funciona sin su {} de la mañana.", "El {} negro te mantiene despierto."],
        "tea": ["En Inglaterra, a las cinco, todos toman {} con leche.", "Con dolor de garganta preparas {} con miel."],
        "soda": ["Sacudes la lata de {} y explota.", "Pides un {} con burbujas y hielo."],
        "beer": ["Los adultos brindan con {} en la fiesta.", "La {} se hace con cebada."],
        "wine": ["Las uvas se convierten en {}.", "En una boda los adultos brindan con {}."],
        "lemonade": ["En verano vendes {} fría en un puesto en la calle.", "La {} se hace con limón y azúcar."],
        "cocoa": ["Después de jugar en la nieve tomas {} caliente.", "La {} se prepara con leche y chocolate."],
        "smoothie": ["Mezclas fresas y plátano en la licuadora para hacer un {}.", "Pides un {} verde con espinaca."],
        "drink": ["Agua, jugo y café son cada uno una {}.", "El mesero pregunta: «¿Quiere una {}?»"],
    },
    29: {
        "grape": ["El vino nace de la {}.", "Te comes una {} verde de un racimo."],
        "strawberry": ["Decoras el pastel con una {} roja.", "Comes helado de {}."],
        "lemon": ["Exprimes un {} en el té.", "Muerdes un {} y haces una mueca."],
        "pear": ["Comes una {} jugosa.", "La {} tiene forma de campana."],
        "watermelon": ["En verano comes {} fría en rebanadas.", "La {} es verde por fuera y roja por dentro."],
        "carrot": ["Un conejo de caricatura mordisquea una {}.", "La {} es naranja y crece bajo tierra."],
        "onion": ["Cortas una {} y se te llenan los ojos de lágrimas.", "La {} le da sabor a la sopa."],
        "lettuce": ["La hamburguesa lleva tomate y {} fresca.", "Lavas la {} para la ensalada."],
        "cucumber": ["Te pones rodajas de {} fresca en los ojos.", "El {} es verde y crujiente."],
        "corn": ["Las palomitas se hacen con {}.", "Las tortillas se hacen con {}."],
        "pepper": ["Rellenas un {} con carne molida.", "El {} verde es más amargo que el rojo."],
        "mushroom": ["Pides una pizza con {} y queso.", "El {} crece en el bosque húmedo."],
    },
    32: {
        "eat": ["Después de correr, [[I|yo]] {} hasta quedar lleno.", "En Navidad [[we|nosotros]] {} hasta reventar."],
        "drink": ["Cuando tengo sed, [[I|yo]] {} agua fría.", "En el desayuno [[they|ellos]] {} jugo de naranja."],
        "work": ["[[I|Yo]] {} en un hospital de noche.", "[[They|Ellos]] {} en una fábrica de juguetes."],
        "live": ["[[I|Yo]] {} en una casa con jardín.", "[[We|Nosotros]] {} cerca del mar."],
        "study": ["Antes del examen [[I|yo]] {} toda la noche.", "[[They|Ellos]] {} en la biblioteca todos los días."],
        "play": ["Los sábados [[we|nosotros]] {} fútbol en el parque.", "[[I|Yo]] {} videojuegos con mi hermano."],
        "read": ["Antes de dormir [[I|yo]] {} un capítulo.", "[[They|Ellos]] {} el periódico en el desayuno."],
        "speak": ["[[I|Yo]] {} inglés y español.", "[[We|Nosotros]] {} en voz baja en la biblioteca."],
        "watch": ["Los viernes [[we|nosotros]] {} una película.", "[[I|Yo]] {} la televisión después de cenar."],
        "cook": ["Los domingos [[I|yo]] {} para toda mi familia.", "[[They|Ellos]] {} arroz con pollo."],
        "like": ["[[I|Yo]] {} el chocolate.", "[[We|Nosotros]] {} la música a todo volumen."],
        "want": ["[[I|Yo]] {} un vaso de agua.", "[[They|Ellos]] {} una pizza gigante."],
    },
    38: {
        "nurse": ["En el hospital, quien te pone una inyección y cuida a los enfermos es la {}.", "Una {} te toma la temperatura."],
        "engineer": ["Quien diseña puentes y edificios es un {}.", "Un {} revisa los planos antes de construir."],
        "lawyer": ["En el juicio, tu {} habla con el juez.", "Un {} estudia las leyes."],
        "driver": ["El {} del autobús espera en el semáforo.", "Un {} de taxi te pregunta a dónde vas."],
        "cook": ["El {} prepara sopa y corta cebolla en la cocina del restaurante.", "Un {} prueba la salsa antes de servir."],
        "farmer": ["El {} siembra maíz y ordeña vacas al amanecer.", "Un {} vive en el campo y cuida su tierra."],
        "artist": ["Un {} pinta un mural gigante en la calle.", "La {} dibuja tu retrato en cinco minutos."],
        "police officer": ["Un {} dirige el tráfico en la esquina.", "Si te pierdes, pides ayuda a un {}."],
        "waiter": ["El {} trae la cuenta a tu mesa.", "Un {} anota tu pedido en una libreta."],
        "singer": ["La {} canta en el escenario frente a miles de personas.", "Un {} ensaya antes del concierto."],
        "dentist": ["Abres bien la boca en el consultorio del {}.", "Un {} te revisa los dientes."],
        "pilot": ["El {} anuncia: «Vamos a despegar.»", "Un {} maneja el avión sobre las nubes."],
    },
    39: {
        "job": ["Mandas tu currículum porque buscas un nuevo {}.", "Ser bombero es un {} peligroso."],
        "work": ["Sales del {} a las cinco en punto.", "Tienes tanto {} que olvidas comer."],
        "boss": ["Tu {} te llama a su oficina y todos se ponen nerviosos.", "El {} da las órdenes en la empresa."],
        "worker": ["Cada {} de la obra lleva casco.", "Un {} llega temprano a la fábrica."],
        "company": ["Mandas tu currículum a una {} de videojuegos.", "La {} tiene cien empleados."],
        "meeting": ["A las diez tienes una {} con todo el equipo.", "La {} se alarga una hora más."],
        "email": ["Escribes un {} formal a tu jefe.", "Recibes un {} con un archivo adjunto."],
        "schedule": ["Revisas tu {} para ver a qué hora entras.", "El {} de tu trabajo cambia cada semana."],
        "colleague": ["Tu {} de la oficina te guarda café.", "Almuerzas con un {} de otro departamento."],
        "interview": ["Estás nervioso por tu {} de trabajo de mañana.", "En la {} te preguntan por tu experiencia."],
        "project": ["El equipo entrega un {} importante.", "Presentas tu {} ante el jefe."],
        "factory": ["Miles de juguetes salen de esa {}.", "El trabajador llega temprano a la {}."],
    },
    40: {
        "hour": ["Un día tiene veinticuatro {}.", "La película dura una {} y media."],
        "minute": ["Una hora tiene sesenta {}.", "El autobús llega en cinco {}."],
        "second": ["Un minuto tiene sesenta {}.", "Espera un {}, ya voy."],
        "clock": ["Miras el {} de la pared: las tres en punto.", "El {} despertador suena a las seis."],
        "night": ["La luna sale de {}.", "Duermes por la {}."],
        "morning": ["Desayunas por la {}.", "El sol sale en la {}."],
        "afternoon": ["Comes a las dos de la {}.", "Después del almuerzo viene la {}."],
        "evening": ["Cuando el sol se oculta y empieza el {}, prendes las luces.", "Cenas al {}, cuando baja el sol."],
        "o'clock": ["Son las [[three|tres]] {}.", "La clase empieza a las [[eight|ocho]] {}."],
        "noon": ["A las doce del día es el {}.", "Almuerzas al {}."],
        "midnight": ["A las doce de la noche es la {}.", "Cenicienta debe volver a casa a la {}."],
        "early": ["Te levantas {} para no llegar tarde.", "Llegas {} a la escuela, antes que todos."],
    },
    44: {
        "wake up": ["Suena el despertador a las seis y [[I|yo]] {}.", "Cada mañana [[I|yo]] {} con el canto de los pájaros."],
        "get up": ["Ya son las siete: [[I|yo]] {} de la cama de un salto.", "Después de apagar la alarma tres veces, por fin [[I|yo]] {}."],
        "take a shower": ["Antes de salir, [[I|yo]] {} con agua caliente.", "Después de correr, [[I|yo]] {} para refrescarme."],
        "brush my teeth": ["Después de comer, [[I|yo]] {}.", "Antes de dormir [[I|yo]] {} con pasta de menta."],
        "have breakfast": ["Por la mañana [[I|yo]] {} con pan y jugo.", "Antes de ir a la escuela [[I|yo]] {}."],
        "go to work": ["A las ocho [[I|yo]] {} en autobús.", "Los lunes [[I|yo]] {} más temprano por el tráfico."],
        "have lunch": ["Al mediodía [[I|yo]] {} con mis colegas.", "A las dos [[I|yo]] {} arroz con pollo."],
        "go home": ["A las cinco termino y [[I|yo]] {}.", "Cuando cae la tarde [[I|yo]] {} en metro."],
        "cook dinner": ["Por la noche [[I|yo]] {} para mi familia.", "Al llegar a casa [[I|yo]] {} una sopa rápida."],
        "watch TV": ["Después de cenar [[I|yo]] {} un rato.", "Los domingos [[I|yo]] {} una serie con mi familia."],
        "go to bed": ["Cuando tengo sueño [[I|yo]] {}.", "A las diez de la noche [[I|yo]] {}."],
        "sleep": ["Cuando estoy en la cama [[I|yo]] {} ocho horas.", "Todas las noches [[I|yo]] {} profundamente."],
    },
})
# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------
def _con_curso(d):
    """Agrega curso/tema/descripcion al inicio (el manifest los lee de aquí)."""
    base = {k: v for k, v in d.items() if k not in ("curso", "tema", "descripcion")}
    desc = d.get("descripcion") or d.get("tema", "")
    return {
        "curso": "Inglés",
        "tema": f"{d['id']}. {d['nombre'].capitalize()}",
        "descripcion": desc,
        **base,
    }
def cargar(n):
    return json.loads((ORIG / f"nivel-{n:02d}.json").read_text(encoding="utf-8"))
def guardar(n, d):
    (DEST / f"ing-{n:02d}.json").write_text(
        json.dumps(_con_curso(d), ensure_ascii=False, indent=2), encoding="utf-8"
    )
def base_es(es):
    """Significado sin paréntesis ni alternativas, para evitar opciones ambiguas."""
    b = re.sub(r"\s*\(.*?\)", "", es).split(",")[0].strip().lower()
    return b
def copia(e):
    return json.loads(json.dumps(e))
def numerar(n, k, ejercicios):
    for j, e in enumerate(ejercicios, 1):
        e["id"] = f"n{n:02d}-s{k:02d}-e{j:02d}"
    return ejercicios
def seccion(n, k, titulo, teoria, ejercicios, umbral=0.75, extra=None):
    numerar(n, k, ejercicios)
    s = {
        "id": f"n{n:02d}-s{k:02d}",
        "orden": k,
        "titulo": titulo,
        "teoria": teoria,
        "ejemplos": [],
        "vocabulario": [],
        "ejercicios": ejercicios,
        "dominio": {"umbralAciertos": umbral, "minimoRespondidas": len(ejercicios)},
    }
    if extra:
        s.update(extra)
    return s
# --------------------------------------------------------------------------
# Textos mixtos
# --------------------------------------------------------------------------
PAT = re.compile(r"(<<[^>]+>>|\[\[[^\]]+\]\])")
def parsear_texto(t):
    partes = []
    for trozo in PAT.split(t):
        if not trozo:
            continue
        if trozo.startswith("<<"):
            p = trozo[2:-2].split("|")
            partes.append({"target": True, "en": p[0], "es": p[1], "alt": p[2:]})
        elif trozo.startswith("[["):
            en, es = trozo[2:-2].split("|")
            partes.append({"en": en, "es": es})
        else:
            partes.append(trozo)
    return partes
def ejercicios_de_texto(t, error_prefijo="La palabra es", max_huecos=None):
    """Un ejercicio por hueco. Con max_huecos, solo algunos objetivos son hueco
    (repartidos por el texto); los demás se muestran en inglés, tocables."""
    partes = parsear_texto(t)
    idxs = [i for i, p in enumerate(partes) if isinstance(p, dict) and p.get("target")]
    if max_huecos and len(idxs) > max_huecos:
        paso = len(idxs) / max_huecos
        idxs = [idxs[int(k * paso)] for k in range(max_huecos)]
    res = []
    for objetivo in idxs:
        salida = []
        for i, p in enumerate(partes):
            if isinstance(p, str):
                salida.append(p)
            elif i == objetivo:
                salida.append({"hueco": True, "pista": p["es"]})
            else:
                salida.append({"en": p["en"], "es": p["es"]})
        p = partes[objetivo]
        res.append({
            "tipo": "texto_mixto",
            "consigna": "Lee el texto y escribe en inglés la palabra que falta",
            "partes": salida,
            "respuestas": [p["en"]] + p["alt"],
            "error": f"{error_prefijo} «{p['en']}» ({p['es']}).",
            "audio": {"texto": p["en"], "idioma": "en-US"},
        })
    return res
# --------------------------------------------------------------------------
# MEZCLA PROGRESIVA DE INGLÉS
# A medida que sube el nivel, palabras sueltas de las frases pasan de español
# a inglés (tocables, muestran su significado). Solo se usan palabras que ya se
# aprendieron en niveles anteriores, más unas pocas palabras de enlace.
# --------------------------------------------------------------------------
# (español -> (inglés, nivel desde el que se usa))
ENLACE = {
    "yo": ("I", 3), "tú": ("you", 3), "él": ("he", 3), "ella": ("she", 3),
    "nosotros": ("we", 3), "nosotras": ("we", 3), "ellos": ("they", 3), "ellas": ("they", 3),
    "soy": ("am", 4), "eres": ("are", 4), "es": ("is", 4), "somos": ("are", 4),
    "son": ("are", 4), "estoy": ("am", 4), "estás": ("are", 4), "está": ("is", 4), "están": ("are", 4),
    "estamos": ("are", 4),
    "y": ("and", 7), "con": ("with", 9), "muy": ("very", 12), "en": ("in", 18),
    "pero": ("but", 40), "el": ("the", 50), "la": ("the", 50), "los": ("the", 50), "las": ("the", 50),
    "de": ("of", 55), "para": ("for", 60), "un": ("a", 65), "una": ("a", 65), "porque": ("because", 70),
    "dice": ("says", 6), "dicen": ("say", 6),
    "come": ("eats", 33), "bebe": ("drinks", 33), "trabaja": ("works", 33),
    "vive": ("lives", 33), "estudia": ("studies", 33), "juega": ("plays", 33),
    "lee": ("reads", 33), "habla": ("speaks", 33), "quiere": ("wants", 33),
}
# palabras que NO se sustituyen (ambiguas o que chocan con nombres propios)
PROHIBIDAS = {"ver", "vino", "mañana", "tarde", "segundo", "café", "rosa", "bajo", "cambio", "cuenta",
              "punto", "cuarto", "sol", "luz", "no", "sí", "un", "una", "uno"}
PALABRA = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+")
def clave_lexico(es):
    c = re.sub(r"\s*\(.*?\)", "", es)
    c = re.split(r"\s*[/,]\s*", c)[0].strip().lower()
    return c if (c and " " not in c and len(c) >= 3 and c not in PROHIBIDAS) else None
def agregar_al_lexico(lexico, palabras_nivel):
    for w in palabras_nivel:
        k = clave_lexico(w["es"])
        if k and k not in lexico:
            lexico[k] = (w["en"], w["nivel"])
def mezclar_ingles(frase, nivel, lexico, evitar, rng):
    """Cambia a inglés palabras sueltas del español que rodea a los huecos y marcas."""
    p = min(0.9, 0.25 + nivel / 80)
    trozos = re.split(r"(<<[^>]+>>|\[\[[^\]]+\]\])", frase)
    salida = []
    for t in trozos:
        if not t or t.startswith("<<") or t.startswith("[["):
            salida.append(t)
            continue
        res, ultimo = [], 0
        for m in PALABRA.finditer(t):
            w = m.group(0)
            antes = t[:m.start()].rstrip()
            inicio = (antes == "" or antes[-1] in "«¿¡.:(\"'")
            if w[0].isupper() and not inicio:
                continue  # probablemente un nombre propio
            clave = w.lower()
            en = None
            if clave in ENLACE and nivel >= ENLACE[clave][1]:
                en = ENLACE[clave][0]
            elif clave in lexico and lexico[clave][1] < nivel and clave not in PROHIBIDAS:
                en = lexico[clave][0]
            if not en or en.lower() in evitar or rng.random() > p:
                continue
            if w[0].isupper():
                en = en[0].upper() + en[1:]
            res.append(t[ultimo:m.start()])
            res.append(f"[[{en}|{w}]]")
            ultimo = m.end()
        res.append(t[ultimo:])
        salida.append("".join(res))
    return "".join(salida)
# --------------------------------------------------------------------------
# Ejercicios a partir de una frase
# --------------------------------------------------------------------------
def _partes_con_hueco(frase):
    """Devuelve (partes, target) con el único <<...>> convertido en hueco."""
    partes = parsear_texto(frase)
    salida, target = [], None
    for p in partes:
        if isinstance(p, dict) and p.get("target"):
            target = p
            salida.append({"hueco": True, "pista": p["es"]})
        elif isinstance(p, dict):
            salida.append({"en": p["en"], "es": p["es"]})
        else:
            salida.append(p)
    assert target is not None, frase
    return salida, target
def _forma(x, ref):
    if x == "I":
        return "I"
    if ref[0].isupper():
        return x.capitalize()
    return x.lower()
SINONIMOS_ES = {
    "un": ["una"], "una": ["un"],
    "nosotras": ["nosotros"], "nosotros": ["nosotras"],
    "ellos": ["ellas"], "ellas": ["ellos"],
    "cansado": ["cansada"], "cansada": ["cansado"],
    "cansados": ["cansadas"], "cansadas": ["cansados"],
    "profesora": ["profesor", "maestra", "maestro"], "profesor": ["profesora", "maestro", "maestra"],
    "doctora": ["doctor"], "doctor": ["doctora"],
    "soy": ["estoy"], "estoy": ["soy"],
    "es": ["esta"], "esta": ["es"],
    "son": ["estan"], "estan": ["son"],
    "somos": ["estamos"], "estamos": ["somos"],
    "eres": ["estas"], "estas": ["eres"],
}
NIVELES_GENERO = {8, 23, 24, 26, 38}
def _sin_tildes(t):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
def variantes_es(es, nivel=None):
    """Formas válidas de responder al significado en español (la 1.ª es la que se muestra)."""
    out = [es]
    limpio = re.sub(r"\s*\(.*?\)", "", es).strip()
    if limpio and limpio not in out:
        out.append(limpio)
    for base in list(out):
        for trozo in re.split(r"\s*[/,]\s*", base):
            trozo = trozo.strip()
            if trozo and trozo not in out:
                out.append(trozo)
    # sinónimos palabra por palabra (género, ser/estar), sin tildes
    extra = []
    for base in list(out):
        toks = _sin_tildes(base.lower()).split()
        opciones = [[t] + SINONIMOS_ES.get(t, []) for t in toks]
        combos = [[]]
        for op in opciones:
            combos = [c + [x] for c in combos for x in op][:24]
        extra += [" ".join(c) for c in combos]
    # género en adjetivos/profesiones de algunos niveles
    if nivel in NIVELES_GENERO:
        for base in list(out):
            b = _sin_tildes(base.lower())
            if " " not in b and b[-1] in "oa":
                extra.append(b[:-1] + ("a" if b[-1] == "o" else "o"))
    for e in extra:
        if e not in out:
            out.append(e)
    return out
def ej_significado(frase, nivel=None):
    """Frase con la palabra en inglés resaltada; se escribe su significado en español."""
    partes = parsear_texto(frase)
    salida, t = [], None
    for p in partes:
        if isinstance(p, dict) and p.get("target"):
            t = p
            salida.append({"marca": True, "en": p["en"]})
        elif isinstance(p, dict):
            salida.append({"en": p["en"], "es": p["es"]})
        else:
            salida.append(p)
    assert t is not None, frase
    return {
        "tipo": "texto_mixto",
        "modo": "significado",
        "consigna": f"¿Qué significa «{t['en']}» en esta frase? Escríbelo en español",
        "partes": salida,
        "respuestas": variantes_es(t["es"], nivel),
        "error": f"«{t['en']}» significa «{t['es']}».",
        "audio": {"texto": t["en"], "idioma": "en-US"},
    }
def ej_escribir(frase, dictado=False):
    partes, t = _partes_con_hueco(frase)
    e = {
        "tipo": "texto_mixto",
        "consigna": "Escucha y escribe en inglés la palabra que falta" if dictado else "Escribe en inglés la palabra que falta",
        "partes": partes,
        "respuestas": [t["en"]] + t["alt"],
        "error": f"La palabra es «{t['en']}» ({t['es']}).",
        "audio": {"texto": t["en"], "idioma": "en-US"},
    }
    if dictado:
        e["autoaudio"] = True
    return e
def ej_elegir(frase, opciones_base, rng):
    partes, t = _partes_con_hueco(frase)
    malas = [o for o in opciones_base if o.lower() != t["en"].lower()]
    ops = [t["en"]] + [_forma(o, t["en"]) for o in rng.sample(malas, min(3, len(malas)))]
    rng.shuffle(ops)
    return {
        "tipo": "elegir",
        "consigna": "Elige la palabra que completa el texto",
        "partes": partes,
        "opciones": ops,
        "respuestas": [t["en"]] + t["alt"],
        "error": f"La palabra es «{t['en']}» ({t['es']}).",
        "audio": {"texto": t["en"], "idioma": "en-US"},
    }
# --------------------------------------------------------------------------
# Vocabulario
# --------------------------------------------------------------------------
def leer_palabras(d):
    palabras = []
    for s in d["secciones"][:-2]:
        lineas = s["teoria"].split("\n")
        palabras.append({
            "en": s["titulo"],
            "es": lineas[1].lstrip("= ").strip(),
            "teoria": s["teoria"],
        })
    return palabras
def frases_de(n, w, lexico=None, rng=None):
    """[frase1, frase2] con el hueco ya marcado como <<en|es|alt>>; mezcla inglés según el nivel."""
    crudas = FRASES[n][w["en"]]
    marca = "<<" + "|".join([w["en"], w["es"]] + ALT.get(w["en"], [])) + ">>"
    out = []
    for f in crudas:
        f = f.replace("{}", marca, 1)
        if lexico is not None:
            evitar = {w["en"].lower()}
            r = random.Random(f"{n}-{f}")
            f = mezclar_ingles(f, n, lexico, evitar, r)
        out.append(f)
    return out
def opciones_de(palabras, w):
    """Distractores: otras palabras del nivel cuyo significado no se confunda."""
    return [
        x["en"] for x in palabras
        if base_es(x["es"]) != base_es(w["es"]) and x["en"] != w["en"]
    ]
def par_alterno(w, pos, palabras, rng, nivel=None):
    """1.ª pregunta de la palabra: alterna elegir / escribir según su posición en el nivel."""
    if pos % 2 == 0:
        return ej_elegir(w["f"][0], opciones_de(palabras, w) + [w["en"]], rng)
    return ej_escribir(w["f"][0])
def sesion_palabras(n, k, grupo, palabras, rng, inicio):
    ej = [par_alterno(w, inicio + i, palabras, rng) for i, w in enumerate(grupo)]
    ej += [ej_significado(w["f"][1], n) for w in grupo]
    titulo = " · ".join(w["en"] for w in grupo)
    teoria = "\n".join(w["teoria"] for w in grupo)
    return seccion(n, k, titulo, teoria, ej)
def repaso_vocab(n, k, previas, rng):
    """Solo palabras de niveles anteriores (las de este nivel ya tuvieron sus 2 preguntas)."""
    if len(previas) < 4:
        return None
    pool = previas[:]
    rng.shuffle(pool)
    ej = []
    for i, p in enumerate(pool[:8]):
        if i % 2 == 0:
            e = ej_escribir(p["f"][1])
        else:
            e = ej_significado(p["f"][0], p["nivel"])
        e["origen"] = p["nivel"]
        ej.append(e)
    return seccion(n, k, "Repaso", "Palabras de niveles anteriores.", ej)
def construir_vocab(n, previas, lexico=None):
    d = cargar(n)
    palabras = leer_palabras(d)
    rng = random.Random(n * 7919)
    for w in palabras:
        w["f"] = frases_de(n, w, lexico)
    secs = []
    k = 1
    for g in range(0, len(palabras), 3):
        secs.append(sesion_palabras(n, k, palabras[g:g + 3], palabras, rng, g))
        k += 1
    if USAR_TEXTOS and n in TEXTOS_VOCAB:
        ej_t = ejercicios_de_texto(TEXTOS_VOCAB[n], max_huecos=3)
        secs.append(seccion(
            n, k, "Texto",
            "Lee el texto en español. Las palabras en inglés se pueden tocar para "
            "oírlas y ver su significado. Escribe la palabra que falta.",
            ej_t,
        ))
        k += 1
    rep = repaso_vocab(n, k, previas, rng)
    if rep:
        secs.append(rep)
        k += 1
    ev = d["secciones"][-1]
    orden = palabras[:]
    rng.shuffle(orden)
    ej_ev = []
    for i, w in enumerate(orden[:8]):
        if i % 2 == 0:
            ej_ev.append(ej_escribir(w["f"][1], dictado=(i % 4 == 0)))
        else:
            ej_ev.append(ej_significado(w["f"][0], n))
    ej_ev += [copia(e) for e in ev["ejercicios"] if e["tipo"] == "oracion_libre"]
    rng.shuffle(ej_ev)
    secs.append(seccion(n, k, "Evaluación", ev["teoria"], ej_ev,
                        umbral=ev["dominio"].get("umbralAciertos", 0.8)))
    d["secciones"] = secs
    nuevas = [{"en": w["en"], "es": w["es"], "nivel": n, "f": w["f"]} for w in palabras]
    return d, nuevas
# --------------------------------------------------------------------------
# Nivel 1
# --------------------------------------------------------------------------
def pool_de(en):
    for p in POOLS_N1:
        if en.lower() in [x.lower() for x in p]:
            return p
    return None
def _construir_nivel1_antiguo():
    d = cargar(1)
    por_titulo = {s["titulo"]: s for s in d["secciones"]}
    rng = random.Random(1)
    secs = []
    eval_ej = []
    for k, ((titulo, origenes, texto), frases) in enumerate(zip(GRUPOS_N1, FRASES_N1), 1):
        teoria = "\n".join(por_titulo[t]["teoria"] for t in origenes)
        por_target = {}
        for f in frases:
            _, t = _partes_con_hueco(f)
            por_target.setdefault(t["en"], []).append(f)
        primeras, segundas = [], []
        for i, (en, fs) in enumerate(por_target.items()):
            pool = pool_de(en)
            if i % 2 == 0 and pool and len(pool) >= 2:
                primeras.append(ej_elegir(fs[0], pool, rng))
            else:
                primeras.append(ej_escribir(fs[0]))
            segundas.append(ej_significado(fs[1] if len(fs) > 1 else fs[0], 1))
        n_t = len(por_target)
        ej = primeras + segundas
        if USAR_TEXTOS:
            ej += ejercicios_de_texto(texto, max_huecos=max(1, n_t // 2))
        secs.append(seccion(1, k, titulo, teoria, ej))
        for i, (en, fs) in enumerate(list(por_target.items())[:2]):
            eval_ej.append(ej_escribir(fs[-1]) if i % 2 == 0 else ej_significado(fs[0], 1))
    ev = d["secciones"][-1]
    rng.shuffle(eval_ej)
    secs.append(seccion(1, len(secs) + 1, "Evaluación", ev["teoria"], eval_ej,
                        umbral=ev["dominio"].get("umbralAciertos", 0.8)))
    d["secciones"] = secs
    return d
# --------------------------------------------------------------------------
# NIVEL 1 (v2): sesiones chicas, 1 idea por card, teoría que explica el uso
#   (titulo, teoria, [(grupo_viejo, [targets])...], [frases nuevas])
# --------------------------------------------------------------------------
def _viejas(gi, *targets):
    ts = {t.lower() for t in targets}
    out = []
    for f in FRASES_N1[gi]:
        _, t = _partes_con_hueco(f)
        if t["en"].lower() in ts:
            out.append(f)
    return out
SESIONES_N1 = [
    ("I am",
     "**I** = yo\nSiempre se escribe con mayúscula.\n**am** = soy / estoy\n"
     "Después de **I** siempre va **am**.\n**I am** = yo soy / yo estoy\n"
     "No se dice *I is* ni *I are*. Solo **I am**.",
     [(0, ["I", "am"])], []),
    ("You are",
     "**you** = tú / usted / ustedes\n**are** = eres / estás\n"
     "Después de **you** siempre va **are**.\n**you are** = tú eres / tú estás\n"
     "No se dice *you is* ni *you am*. Solo **you are**.",
     [(1, ["You", "are"])], []),
    ("He, she, it",
     "**he** = él (un hombre o un niño)\n**she** = ella (una mujer o una niña)\n"
     "**it** = eso (una cosa o un animal)\n"
     "Para una cosa o un animal no se usa *he* ni *she*: se usa **it**.\n"
     "La mesa → **it**. El perro → **it**.",
     [(2, ["He", "She", "It"])], []),
    ("Is",
     "**is** = es / está\nDespués de **he**, **she** o **it** siempre va **is**.\n"
     "**he** + **is** → **he is** = él es\n**she** + **is** → **she is** = ella es\n"
     "**it** + **is** → **it is** = eso es\n"
     "No se dice *he am* ni *he are*. Solo **he is**.",
     [(2, ["is"])],
     ["Tu mochila nueva brilla en la oscuridad: «[[It|Eso]] <<is|es>> genial.»",
      "Tocas el pan recién salido del horno: «[[It|Eso]] <<is|está>> caliente.»"]),
    ("We, they",
     "**we** = nosotros / nosotras\n**they** = ellos / ellas\n"
     "Después de **we** y de **they** va **are**.\n"
     "**we are** = nosotros somos / estamos\n**they are** = ellos son / están",
     [(3, ["We", "They"])], []),
    ("Am, is o are",
     "Para elegir entre **am**, **is** y **are**, mira quién hace la acción:\n"
     "**I** → **am**\n**he / she / it** → **is**\n**you / we / they** → **are**\n"
     "Ejemplos: **I am**, **she is**, **they are**.",
     [(4, ["am", "is", "are"])],
     ["Abres la puerta de tu casa y avisas: «[[I|Yo]] <<am|estoy>> en casa.»",
      "Tu pelota quedó atorada en el techo: «[[It|Eso]] <<is|está>> arriba.»",
      "Les gritas a tus amigos desde la ventana: «[[You|Ustedes]] <<are|son>> geniales.»"]),
    ("Happy, tired, here",
     "**happy** = feliz\n**tired** = cansado\n**here** = aquí\n"
     "Van después de **am**, **is** o **are**.\n"
     "**I am happy** = yo estoy feliz\n**she is tired** = ella está cansada\n"
     "**we are here** = nosotros estamos aquí",
     [(4, ["happy", "tired", "here"])], []),
    ("A",
     "**a** = un / una\nVa antes del nombre de una persona o cosa.\n"
     "**a student** = un estudiante / una estudiante\n**a book** = un libro\n"
     "Se usa con una sola persona o cosa. No se dice *she is teacher*: se dice **she is a teacher**.",
     [(5, ["a"])],
     ["Describes tu desayuno: «[[It|Eso]] [[is|es]] <<a|un>> sándwich.»"]),
    ("Student, teacher, doctor",
     "**student** = estudiante\n**teacher** = maestro / maestra\n**doctor** = doctor / doctora\n"
     "Con una profesión se usa **a** antes de la palabra.\n"
     "**I am a student** = yo soy estudiante\n**he is a teacher** = él es maestro",
     [(5, ["student", "teacher", "doctor"])], []),
    ("Not",
     "**not** = no\nVa justo después de **am**, **is** o **are**.\n"
     "**I am not** = yo no soy / no estoy\n**he is not** = él no es / no está\n"
     "**they are not** = ellos no son / no están",
     [(6, ["is not", "am not", "are not"])], []),
    ("Preguntas con Is",
     "Con **he**, **she** o **it**, la pregunta empieza con **Is**.\n"
     "**She is happy.** = Ella está feliz.\n**Is she happy?** = ¿Ella está feliz?\n"
     "Lo único que cambia: **is** pasa al principio.",
     [(7, ["Is"])],
     ["Miras al niño dormido en el sofá: «<<Is|¿Está>> [[he tired|él cansado]]?»",
      "Ves un paquete misterioso en tu puerta: «<<Is|¿Es>> [[it a book|eso un libro]]?»"]),
    ("Preguntas con Are y Am",
     "Con **you**, **we** o **they**, la pregunta empieza con **Are**.\n"
     "**You are tired.** → **Are you tired?** = ¿Estás cansado?\n"
     "Con **I**, la pregunta empieza con **Am**.\n"
     "**I am tired.** → **Am I tired?** = ¿Estoy cansado?",
     [(7, ["Are", "Am"])], []),
    ("Respuestas: Yes y No",
     "Para contestar una pregunta usas **Yes** (sí) o **No** (no).\n"
     "Después repites el pronombre y **am**, **is** o **are**.\n"
     "**Is she happy?** → **Yes, she is.**\n"
     "**Are you tired?** → **No, I am not.**\n"
     "Con **Yes**, al final no se acorta: **Yes, she is.** (no *Yes, she's*).",
     [(7, ["Yes", "No"])], []),
    ("I'm y you're",
     "**I'm** = I am (yo soy)\n**you're** = you are (tú eres)\n"
     "El apóstrofo (') reemplaza la letra **a**: **I am** → **I'm**, **you are** → **you're**.\n"
     "Significan lo mismo, pero se escriben juntas y más corto.",
     [(8, ["I'm", "You're"])],
     ["Tu compañero te ayuda con la tarea y le dices: «<<You're|Tú eres>> el mejor.»"]),
    ("He's, she's, it's",
     "**he's** = he is (él es)\n**she's** = she is (ella es)\n**it's** = it is (eso es)\n"
     "El apóstrofo (') reemplaza la letra **i** de **is**: **he is** → **he's**.",
     [(8, ["He's", "She's"])],
     ["Señalas al nuevo del equipo: «<<He's|Él es>> muy rápido.»",
      "Hablas de la cantante del momento: «<<She's|Ella es>> famosa.»",
      "Tocas la sopa recién servida: «<<It's|Eso está>> caliente.»",
      "Pruebas el postre de tu abuela: «<<It's|Eso es>> delicioso.»"]),
    ("We're y they're",
     "**we're** = we are (nosotros somos)\n**they're** = they are (ellos son)\n"
     "El apóstrofo (') reemplaza la letra **a** de **are**: **we are** → **we're**.",
     [(8, ["We're", "They're"])],
     ["Tú y tu hermana sacan un diez en el examen: «<<We're|Nosotros somos>> geniales.»",
      "Miras a los gemelos en el parque: «<<They're|Ellos son>> idénticos.»"]),
    ("Isn't y aren't",
     "**isn't** = is not (no es)\n**aren't** = are not (no son)\n"
     "El apóstrofo (') reemplaza la letra **o** de **not**: **is not** → **isn't**.\n"
     "No existe *amn't*: con **I** se dice **I'm not**.",
     [(8, ["isn't", "aren't"])],
     ["Pruebas la sopa y dices: «[[It|Eso]] <<isn't|no está|is not>> caliente.»",
      "Tus calcetines no combinan: «[[They|Ellos]] <<aren't|no son|are not>> iguales.»"]),
]
def construir_nivel1():
    d = cargar(1)
    rng = random.Random(1)
    secs, evals = [], []
    for k, (titulo, teoria, origenes, nuevas) in enumerate(SESIONES_N1, 1):
        frases = []
        for gi, ts in origenes:
            frases += _viejas(gi, *ts)
        frases += nuevas
        por_target = {}
        for f in frases:
            _, t = _partes_con_hueco(f)
            por_target.setdefault(t["en"], []).append(f)
        unico = len(por_target) == 1
        ej = []
        for i, (en, fs) in enumerate(por_target.items()):
            pool = pool_de(en)
            usa_elegir = pool and len(pool) >= 2
            if unico:
                for j, f in enumerate(fs[:4]):
                    if j == 0:
                        ej.append(ej_elegir(f, pool, rng) if usa_elegir else ej_escribir(f))
                    elif j % 2 == 1:
                        ej.append(ej_significado(f, 1))
                    else:
                        ej.append(ej_escribir(f))
            else:
                ej.append(ej_elegir(fs[0], pool, rng) if (i % 2 == 0 and usa_elegir) else ej_escribir(fs[0]))
                ej.append(ej_significado(fs[1] if len(fs) > 1 else fs[0], 1))
        ej.sort(key=lambda e: 0 if e["tipo"] == "elegir" else (1 if e.get("modo") != "significado" else 2))
        secs.append(seccion(1, k, titulo, teoria, ej))
        mios = []
        for i, (en, fs) in enumerate(list(por_target.items())[:2]):
            mios.append(ej_escribir(fs[-1]) if i % 2 == 0 else ej_significado(fs[0], 1))
        evals.append(mios)
    # evaluación: 1.º un ejercicio de cada sesión, luego segundos, hasta 20
    eval_ej = [m[0] for m in evals if m] + [m[1] for m in evals if len(m) > 1]
    eval_ej = eval_ej[:20]
    rng.shuffle(eval_ej)
    ev = d["secciones"][-1]
    secs.append(seccion(1, len(secs) + 1, "Evaluación", ev["teoria"], eval_ej,
                        umbral=ev["dominio"].get("umbralAciertos", 0.8)))
    d["secciones"] = secs
    return d
# --------------------------------------------------------------------------
# Gramática (niveles ya escritos como frases): quitar repetición
#   - máx. 2 ejercicios con la misma respuesta por sesión, máx. 1 dictado
#   - los completar se alternan entre elegir y escribir
#   - lo que se quita NO se pierde: pasa a la evaluación, que así deja de
#     repetir lo que ya preguntaste en las sesiones
# --------------------------------------------------------------------------
def _clave(e):
    r = (e.get("respuestas") or [""])[0]
    return re.sub(r"[^a-z0-9' ]", "", str(r).lower()).strip()
def _elegible(e, pool):
    return (
        e["tipo"] == "completar"
        and e.get("enunciado", "").count("___") == 1
        and len(pool) >= 2
        and len(e["respuestas"][0].split()) <= 2
        and e["respuestas"][0].lower() in [p.lower() for p in pool]
    )
def _a_elegir_gram(e, pool, rng):
    r = e["respuestas"][0]
    malas = [p for p in pool if p.lower() != r.lower()]
    ops = [r] + [_forma(x, r) for x in rng.sample(malas, min(3, len(malas)))]
    rng.shuffle(ops)
    return {
        "tipo": "elegir",
        "consigna": "Elige la palabra que completa la frase",
        "enunciado": e["enunciado"],
        "opciones": ops,
        "respuestas": list(e["respuestas"]),
        "error": e.get("error", ""),
    }
def construir_gramatica(n):
    d = cargar(n)
    rng = random.Random(n * 104729)
    sesiones, ev = d["secciones"][:-1], d["secciones"][-1]
    # opciones para elegir: respuestas de una palabra (o dos) de los "completar" del nivel
    pool = []
    for sec in d["secciones"]:
        for e in sec["ejercicios"]:
            if e["tipo"] == "completar":
                r = e["respuestas"][0]
                if len(r.split()) <= 2 and r.lower() not in [x.lower() for x in pool]:
                    pool.append(r)
    retenidos = []
    for k, sec in enumerate(sesiones, 1):
        cuenta, dictados = collections.Counter(), 0
        guardar_, quitar = [], []
        for e in sec["ejercicios"]:
            c = _clave(e)
            if e["tipo"] == "dictado" and dictados >= 1:
                quitar.append(e)
            elif cuenta[c] >= 2:
                quitar.append(e)
            else:
                if e["tipo"] == "dictado":
                    dictados += 1
                cuenta[c] += 1
                guardar_.append(e)
        while len(guardar_) < 3 and quitar:
            guardar_.append(quitar.pop(0))
        quitar += guardar_[6:]
        guardar_ = guardar_[:6]
        # reservar ejercicios para la evaluación (que no se pregunten dos veces)
        reservar = (1 if len(guardar_) >= 4 else 0) + (1 if len(guardar_) >= 6 else 0)
        for _ in range(reservar):
            idx_r = max(
                (i for i, x in enumerate(guardar_) if x["tipo"] != "dictado"),
                default=None,
            )
            if idx_r is None or len(guardar_) <= 3:
                break
            quitar.append(guardar_.pop(idx_r))
        # alternar elegir / escribir entre los completar
        comp, out = 0, []
        for e in guardar_:
            if _elegible(e, pool):
                out.append(_a_elegir_gram(e, pool, rng) if comp % 2 == 0 else e)
                comp += 1
            else:
                out.append(e)
        out.sort(key=lambda e: 0 if e["tipo"] == "elegir" else 1)
        sec["ejercicios"] = numerar(n, k, out)
        sec["id"] = f"n{n:02d}-s{k:02d}"
        sec["orden"] = k
        sec["dominio"] = {
            "umbralAciertos": sec.get("dominio", {}).get("umbralAciertos", 0.75),
            "minimoRespondidas": len(out),
        }
        retenidos.append(quitar)
    # evaluación: primero lo que se apartó (no se preguntó antes), repartido entre sesiones
    nueva, cuenta = [], collections.Counter()
    for ronda in range(6):
        for quitar in retenidos:
            if ronda < len(quitar):
                e = quitar[ronda]
                c = _clave(e)
                if cuenta[c] < 2:
                    cuenta[c] += 1
                    nueva.append(e)
    rng.shuffle(nueva)
    nueva = nueva[:8]
    # solo si casi no hay material nuevo, completar con originales de la evaluación
    usados = {e.get("enunciado") for e in nueva}
    for e in ev["ejercicios"]:
        if len(nueva) >= 3:
            break
        if e.get("enunciado") not in usados:
            nueva.append(e)
            usados.add(e.get("enunciado"))
    ev["ejercicios"] = numerar(n, len(sesiones) + 1, [copia(e) for e in nueva])
    ev["dominio"] = {
        "umbralAciertos": ev.get("dominio", {}).get("umbralAciertos", 0.8),
        "minimoRespondidas": len(nueva),
    }
    return d
# --------------------------------------------------------------------------
# Alfabeto: letras en grupos de 4; por letra 1 dictado + 1 nombre -> letra
# --------------------------------------------------------------------------
def construir_alfabeto():
    d = cargar(6)
    letras = [s for s in d["secciones"] if len(s["titulo"]) == 1]
    resto = [s for s in d["secciones"] if len(s["titulo"]) != 1]
    rng = random.Random(6)
    secs, k = [], 1
    for g in range(0, len(letras), 4):
        grupo = letras[g:g + 4]
        dict_ = [next(e for e in s["ejercicios"] if e["tipo"] == "dictado") for s in grupo]
        comp = [next(e for e in s["ejercicios"] if e["tipo"] == "completar") for s in grupo]
        secs.append(seccion(
            6, k, " · ".join(s["titulo"] for s in grupo),
            "\n".join(s["teoria"] for s in grupo),
            [copia(e) for e in dict_ + comp],
        ))
        k += 1
    for s in resto[:-1]:  # sesiones de deletrear
        s["ejercicios"] = numerar(6, k, s["ejercicios"])
        s["id"], s["orden"] = f"n06-s{k:02d}", k
        secs.append(s)
        k += 1
    ev = resto[-1]
    ej = [copia(e) for e in ev["ejercicios"]]
    rng.shuffle(ej)
    ej = ej[:12]
    ev["ejercicios"] = numerar(6, k, ej)
    ev["id"], ev["orden"] = f"n06-s{k:02d}", k
    ev["dominio"] = {"umbralAciertos": ev.get("dominio", {}).get("umbralAciertos", 0.8), "minimoRespondidas": len(ej)}
    secs.append(ev)
    d["secciones"] = secs
    return d
# --------------------------------------------------------------------------
# Lectura: una pregunta de cada texto se aparta para la evaluación
# --------------------------------------------------------------------------
def construir_lectura(n):
    d = cargar(n)
    rng = random.Random(n * 31)
    sesiones, ev = d["secciones"][:-1], d["secciones"][-1]
    apartadas = []
    for k, sec in enumerate(sesiones, 1):
        ej = sec["ejercicios"]
        if len(ej) >= 3:
            apartadas.append(ej.pop())
        sec["ejercicios"] = numerar(n, k, ej)
        sec["dominio"] = {
            "umbralAciertos": sec.get("dominio", {}).get("umbralAciertos", 0.75),
            "minimoRespondidas": len(ej),
        }
    rng.shuffle(apartadas)
    ev["ejercicios"] = numerar(n, len(sesiones) + 1, [copia(e) for e in apartadas])
    ev["dominio"] = {
        "umbralAciertos": ev.get("dominio", {}).get("umbralAciertos", 0.8),
        "minimoRespondidas": len(apartadas),
    }
    return d
# --------------------------------------------------------------------------
# Principal
# --------------------------------------------------------------------------
NIVELES_VOCAB = sorted(FRASES.keys())
# --------------------------------------------------------------------------
# Ejercicios estilo Duolingo (niveles 1 a 5): ordenar palabras y emparejar
#   nivel -> sesión -> {"emp": (consigna, [(izq, der)...]) | "auto", "ord": [(pista, respuesta, [sobran], [otras])]}
#   "auto" = parejas inglés/español sacadas de la teoría de la sesión (niveles de vocabulario)
# --------------------------------------------------------------------------
C_SIG = "Une cada palabra con su significado"
C_FORMA = "Une cada forma corta con su forma completa"
DUO = {
    1: {
        1: {"ord": [("Yo soy", "I am", ["is", "are"], [])]},
        2: {"ord": [("Tú eres", "you are", ["am", "is"], [])]},
        3: {"emp": (C_SIG, [("he", "él"), ("she", "ella"), ("it", "eso")])},
        4: {"ord": [("Él es", "he is", ["am", "are"], []), ("Eso es", "it is", ["are", "am"], [])]},
        5: {"emp": (C_SIG, [("I", "yo"), ("you", "tú"), ("we", "nosotros"), ("they", "ellos")]),
            "ord": [("Nosotros somos", "we are", ["is", "am"], []), ("Ellos son", "they are", ["is", "am"], [])]},
        6: {"emp": ("Une cada palabra con la que va después", [("I", "am"), ("she", "is"), ("you", "are")])},
        7: {"emp": (C_SIG, [("happy", "feliz"), ("tired", "cansado"), ("here", "aquí")]),
            "ord": [("Yo estoy feliz", "I am happy", ["is", "tired"], []),
                    ("Ella está cansada", "she is tired", ["am", "here"], [])]},
        8: {"ord": [("Yo soy un estudiante", "I am a student", ["is", "are"], [])]},
        9: {"emp": (C_SIG, [("student", "estudiante"), ("teacher", "maestro"), ("doctor", "doctor")]),
            "ord": [("Ella es una doctora", "she is a doctor", ["am", "are"], []),
                    ("Él es un maestro", "he is a teacher", ["are", "am"], [])]},
        10: {"ord": [("Yo no soy maestro", "I am not a teacher", ["is", "are"], []),
                     ("Ellos no están aquí", "they are not here", ["is", "am"], [])]},
        11: {"ord": [("¿Está ella feliz?", "is she happy", ["are", "am"], []),
                     ("¿Es él un doctor?", "is he a doctor", ["are", "am"], [])]},
        12: {"ord": [("¿Estás cansado?", "are you tired", ["is", "am"], []),
                     ("¿Estoy feliz?", "am I happy", ["is", "are"], [])]},
        13: {"ord": [("Sí, ella es", "Yes, she is", ["are", "am"], []),
                     ("No, yo no soy", "No, I am not", ["is", "are"], [])]},
        14: {"ord": [("Yo soy feliz", "I'm happy", ["you're", "he's"], []),
                     ("Tú eres un doctor", "you're a doctor", ["I'm", "he's"], [])]},
        15: {"emp": (C_FORMA, [("he's", "he is"), ("she's", "she is"), ("it's", "it is")]),
             "ord": [("Él es feliz", "he's happy", ["she's", "it's"], []),
                     ("Ella está cansada", "she's tired", ["he's", "it's"], [])]},
        16: {"ord": [("Nosotros estamos aquí", "we're here", ["they're", "you're"], []),
                     ("Ellos están cansados", "they're tired", ["we're", "I'm"], [])]},
        17: {"emp": (C_FORMA, [("isn't", "is not"), ("aren't", "are not"), ("he's", "he is")]),
             "ord": [("Él no está aquí", "he isn't here", ["aren't", "not"], []),
                     ("Ellos no están felices", "they aren't happy", ["isn't", "not"], [])]},
    },
    2: {
        1: {"emp": (C_SIG, [("I", "yo"), ("you", "tú"), ("we", "nosotros")]),
            "ord": [("Yo estoy cansado", "I am tired", ["is", "are"], [])]},
        2: {"emp": (C_SIG, [("he", "él"), ("she", "ella"), ("it", "eso")]),
            "ord": [("Ella está aquí", "she is here", ["am", "are"], [])]},
        3: {"emp": (C_SIG, [("they", "ellos"), ("we", "nosotros"), ("he", "él"), ("she", "ella")]),
            "ord": [("Ellos están felices", "they are happy", ["is", "am"], [])]},
    },
    3: {
        1: {"emp": "auto"},
        2: {"emp": "auto", "ord": [("Buenos días", "good morning", ["afternoon", "night"], [])]},
        3: {"emp": "auto", "ord": [("Buenas noches (al llegar)", "good evening", ["night", "morning"], [])]},
        4: {"emp": "auto", "ord": [("Disculpe", "excuse me", ["sorry", "please"], [])]},
    },
    4: {
        1: {"emp": "auto", "ord": [("cero, uno, dos", "zero one two", ["three"], [])]},
        2: {"emp": "auto", "ord": [("tres, cuatro, cinco", "three four five", ["six"], [])]},
        3: {"emp": "auto", "ord": [("seis, siete, ocho", "six seven eight", ["nine"], [])]},
        4: {"emp": "auto", "ord": [("nueve, diez", "nine ten", ["eight"], [])]},
    },
    5: {
        1: {"emp": "auto", "ord": [("Es lunes", "it is Monday", ["Tuesday", "are"], [])]},
        2: {"emp": "auto", "ord": [("Es viernes", "it is Friday", ["Saturday", "are"], [])]},
        3: {"emp": "auto", "ord": [("Es domingo", "it is Sunday", ["weekend", "are"], [])]},
        4: {"emp": "auto", "ord": [("Mañana es martes", "tomorrow is Tuesday", ["today", "are"], [])]},
    },
}
def _pares_de_teoria(teoria):
    """Parejas (inglés, español) de una teoría de vocabulario: '**en**  /ipa/' + '= es'."""
    pares, en = [], None
    for l in teoria.split("\n"):
        m = re.match(r"\*\*(.+?)\*\*", l.strip())
        if m:
            en = m.group(1).strip()
        elif l.strip().startswith("=") and en:
            pares.append((en, l.strip().lstrip("= ").strip()))
            en = None
    return pares
def _ej_emparejar(consigna, pares, rng):
    assert len({d for _, d in pares}) == len(pares), pares
    orden = list(range(len(pares)))
    while len(pares) > 1 and orden == sorted(orden):
        rng.shuffle(orden)
    return {
        "tipo": "emparejar",
        "consigna": consigna,
        "pares": [{"izq": a, "der": b} for a, b in pares],
        "ordenDer": orden,
        "respuestas": ["listo"],
    }
def _ej_ordenar(pista, resp, sobran, otras, rng):
    fichas = resp.split() + list(sobran)
    original = list(fichas)
    while fichas == original or fichas[: len(resp.split())] == resp.split():
        rng.shuffle(fichas)
    return {
        "tipo": "ordenar",
        "consigna": "Arma la frase en inglés",
        "pista": pista,
        "palabras": fichas,
        "respuestas": [resp] + list(otras),
        "audio": {"texto": resp, "idioma": "en-US"},
    }
def agregar_duolingo(n, d):
    """Suma emparejar/ordenar a las sesiones indicadas en DUO. En vocabulario quita significados repetidos."""
    rng = random.Random(100 + n)
    for k, cfg in DUO.get(n, {}).items():
        sec = d["secciones"][k - 1]
        ej = sec["ejercicios"]
        nuevos_emp, nuevos_ord = [], []
        emp = cfg.get("emp")
        if emp == "auto":
            pares = _pares_de_teoria(sec["teoria"])
            if len(pares) < 3 and k > 1:
                pares = _pares_de_teoria(d["secciones"][k - 2]["teoria"])[-(3 - len(pares)):] + pares
            nuevos_emp.append(_ej_emparejar(C_SIG, pares, rng))
        elif emp:
            nuevos_emp.append(_ej_emparejar(emp[0], emp[1], rng))
        for pista, resp, sobran, otras in cfg.get("ord", []):
            nuevos_ord.append(_ej_ordenar(pista, resp, sobran, otras, rng))
        sig = [e for e in ej if e.get("modo") == "significado"]
        if n in (1, 3, 4, 5):
            quitar = min(len(nuevos_emp) + len(nuevos_ord), max(len(sig) - 1, 0))
            for e in sig[len(sig) - quitar:]:
                ej.remove(e)
        pos = next((i for i, e in enumerate(ej) if e.get("modo") == "significado"), len(ej))
        ej[pos:pos] = nuevos_ord
        ej[0:0] = nuevos_emp
        numerar(n, sec["orden"], ej)
        sec["dominio"]["minimoRespondidas"] = len(ej)
    return d
def main():
    # 1) partir de los originales completos
    DEST.mkdir(parents=True, exist_ok=True)
    for f in sorted(ORIG.glob("nivel-*.json")):
        d0 = json.loads(f.read_text(encoding="utf-8"))
        guardar(d0["id"], d0)
    # 2) nivel 1
    guardar(1, agregar_duolingo(1, construir_nivel1()))
    # 3) vocabulario (el léxico previo se acumula en orden de nivel)
    previas = []
    lexico = {}
    for n in NIVELES_VOCAB:
        d, nuevas = construir_vocab(n, previas, lexico)
        guardar(n, agregar_duolingo(n, d))
        previas.extend(nuevas)
        agregar_al_lexico(lexico, nuevas)
    # 3b) gramática y alfabeto
    idx = json.loads((ORIG / "index.json").read_text(encoding="utf-8"))
    for nv in idx["niveles"]:
        if nv["tipo"] == "gramatica" and nv["id"] != 1:
            guardar(nv["id"], agregar_duolingo(nv["id"], construir_gramatica(nv["id"])))
    guardar(6, construir_alfabeto())
    for n in (46, 60, 87, 98):
        guardar(n, construir_lectura(n))
    # 4) config: documentación de los tipos de ejercicio (ya no vive en public/)
    cfg = json.loads((ORIG / "config.json").read_text(encoding="utf-8"))
    cfg["version"] = 4
    cfg["tiposDeEjercicio"]["elegir"] = (
        "Elegir una opción tocando (campos: opciones[], respuestas[], consigna)."
    )
    cfg["tiposDeEjercicio"]["texto_mixto"] = (
        "Texto corto en español con palabras en inglés tocables (partes[]: string | {en,es} | "
        "{hueco:true,pista}). Se escribe la palabra que falta."
    )
    cfg["tiposDeEjercicio"]["ordenar"] = (
        "Ordenar palabras tocando fichas (pista en español, palabras[] con sobrantes, respuestas[])."
    )
    cfg["tiposDeEjercicio"]["emparejar"] = (
        "Unir parejas (pares[{izq,der}], ordenDer[]). Hasta 2 errores; respuestas: ['listo']."
    )
    (RAIZ / "scripts" / "ingles_config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Listo.")
if __name__ == "__main__":
    main()
