# Notas del proyecto: sección de inglés

Prompt para retomar el trabajo en un chat nuevo (sube este zip junto con él):

```
Continúa un proyecto que dejé a medias: la sección de inglés de mi app de estudio (React + Vite, PWA). Adjunto el zip del proyecto. Lee primero scripts/reestructurar_ingles.py, src/components/InglesLeccion.jsx y un nivel de ejemplo (public/temas/ing/ing-03.json).

CÓMO FUNCIONA
- Los 98 JSON de public/temas/ing/ (ing-01 a ing-98) los GENERA el script scripts/reestructurar_ingles.py a partir de los originales respaldados en scripts/ingles_original/. NO edites los JSON a mano: cambia el script y córrelo con `python3 scripts/reestructurar_ingles.py` y luego `python3 actualizar_manifest.py`. La carpeta public/ingles ya no existe: la página /ingles y la sección de temas leen los mismos archivos de temas/ing (la lista de niveles sale del manifest, curso ING).
- Las frases de cada palabra están en el diccionario FRASES del script. Cada palabra lleva 2 frases con {} donde va la palabra. Los bloques al final del archivo pisan a los anteriores.
- Por palabra hay 2 preguntas: (1) elegir o escribir, alternando entre palabras; (2) significado en español (la palabra sale en inglés, resaltada, y se escribe su significado).
- Las palabras de los niveles anteriores se van cambiando a inglés en el español que rodea la frase (función mezclar_ingles, diccionario ENLACE). Nombres propios y palabras ambiguas no se tocan.
- La app tiene fase de estudio: teoría a pantalla completa, tira lateral, espera de 15 s, reloj fijo y cola de reintentos. Progreso en clave v2.

LO QUE ESTÁ HECHO
- Motor de la app y los 98 niveles reestructurados.
- Nivel 1 (to be) partido en 17 sesiones chicas (1-2 ideas por card) + evaluación; teoría reescrita explicando cómo se usa cada palabra (lista SESIONES_N1 en el script). Los ids n01-sNN cambiaron: el progreso viejo del nivel 1 ya no coincide.
- Escenas nuevas (variadas, sin personajes fijos) en el nivel 1 y en los niveles 3, 4, 5, 7, 8, 10, 11, 16, 21-24, 26-29, 32, 38-41 y 44.

LO QUE FALTA
- Reescribir las frases de 27 niveles de vocabulario que siguen con el estilo antiguo (Ana y Luis): 47-51, 55-59, 63, 64, 67-70, 72, 74-77, 84, 88, 94-97. Hazlo por lotes de unos 10 niveles, añadiendo un bloque FRASES.update({...}) al final del script.

MIS PREFERENCIAS
- Frases como mini escenas variadas (situaciones, humor, lugares distintos), hablándole al lector ("tú"), sin personajes fijos como Ana o Luis. La pista debe permitir deducir la palabra.
- No repetir la misma palabra muchas veces. No quiero escribir lo mismo 3 veces.
- Los niveles de gramática (43) y lectura (4) ya están recortados y NO se tocan más, salvo las sesiones "La tabla" de los niveles 20, 37 y 92 (muchas formas juntas en una card), que él puede pedir partir.
- Responde en español, con mensajes cortos (uso el celular).

CUIDADO
- Mantén la concordancia en español con el artículo antes de {} (el/la, un/una).
- Las claves de FRASES deben coincidir exactamente con el título de la sesión original (por ejemplo "traffic light", "New Year").
- No puedes abrir la app en tu entorno: valida los JSON con código (sin ids duplicados, sesiones vacías ni opciones sin respuesta) y dime que yo debo probarla con npm run dev.
```
- Estilo Duolingo (niveles 1 a 5): tipos nuevos `ordenar` (fichas para armar la frase, con palabras sobrantes) y `emparejar` (unir parejas, hasta 2 errores). Se agregan desde el script con el diccionario DUO y la función agregar_duolingo; la pantalla está en InglesLeccion.jsx (componentes Ordenar y Emparejar) y los estilos en _ingles.scss. Para sumar más niveles, agregar su entrada en DUO.
