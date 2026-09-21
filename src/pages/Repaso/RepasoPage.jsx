import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";
import coursesSemanas from "../../data/coursesSemanas.json";
import {
  leerLog,
  marcarRepasoHecho,
  registrarCursoCompletado,
  clasificarRepasos,
  intervaloClasses,
  formatearFecha,
  diffDias,
  REPASO_INTERVALOS,
  eliminarRepaso
} from "../../lib/repasoStorage";
import { obtenerRecomendacionesHoy } from "../../lib/repasoRecomendado";
import {
  construirPromptRepaso,
  construirPromptJson,
  construirPromptExamen,
  copiarTexto
} from "../../lib/promptsRepaso";
const TABS = [
  { id: "hoy", label: "Hoy" },
  { id: "proximos", label: "Próximos" },
  { id: "temario", label: "Temario" }
];
const CATEGORIAS_TEMARIO = [
  {
    id: "letras",
    label: "Letras",
    cursos: [
      "Habilidad Verbal",
      "Lenguaje",
      "Literatura",
      "Historia Universal",
      "Historia del Perú",
      "Filosofía"
    ]
  },
  {
    id: "ciencias",
    label: "Ciencias",
    cursos: [
      "Biología",
      "Física",
      "Química",
      "Geografía",
      "Educación Cívica",
      "Psicología"
    ]
  },
  {
    id: "matematica",
    label: "Matemática",
    cursos: [
      "Habilidad Lógico Matemático",
      "Aritmética",
      "Álgebra",
      "Geometría",
      "Trigonometría",
      "Economía"
    ]
  }
];
const SEMANAS_TEMARIO = [1, 2, 3, 4, 5, 6, 7, 8];
const LABELS_CORTOS_TEMARIO = {
  "Habilidad Lógico Matemático": "R. Matemático",
  "Habilidad Verbal": "R. Verbal"
};
const INSTRUCCIONES_CHATGPT = {
  "Habilidad Lógico Matemático": `
En este curso prioriza el razonamiento y la resolución de problemas.
La teoría debe ser breve y funcional. Incluye solo los conceptos necesarios para comprender y resolver el tema.
Prioriza:
- análisis de condiciones;
- relaciones y patrones;
- estrategias de razonamiento;
- métodos de resolución;
- procedimientos;
- casos particulares;
- ejercicios tipo UNMSM;
- errores frecuentes.
La explicación debe enseñar cómo pensar y resolver, no solo definir conceptos.
No agregues etimología, historia, curiosidades ni información que no ayude a resolver problemas.
`,
  "Aritmética": `
En este curso prioriza la comprensión de las propiedades numéricas y su aplicación en ejercicios.
Incluye la teoría necesaria para comprender el tema, pero da especial importancia a:
- propiedades;
- relaciones;
- fórmulas;
- reglas;
- condiciones de aplicación;
- casos;
- métodos;
- procedimientos;
- ejercicios resueltos;
- estrategias;
- ejercicios tipo UNMSM.
La teoría debe servir para comprender y resolver ejercicios.
No agregues etimología, historia, curiosidades ni información contextual que no aporte al dominio del tema.
`,
  "Álgebra": `
En este curso prioriza la comprensión de las relaciones algebraicas y su aplicación en ejercicios.
Incluye:
- conceptos fundamentales;
- propiedades;
- identidades;
- fórmulas;
- relaciones;
- condiciones y restricciones;
- métodos;
- casos especiales;
- procedimientos;
- ejercicios;
- estrategias de resolución;
- errores frecuentes.
Explica cuándo y cómo aplicar cada propiedad, fórmula o procedimiento.
No agregues etimología, historia o curiosidades que no sean útiles para el examen.
`,
  "Geometría": `
En este curso prioriza el razonamiento geométrico y la resolución de problemas.
Incluye, cuando corresponda:
- conceptos y elementos;
- propiedades;
- relaciones;
- teoremas;
- fórmulas;
- condiciones;
- casos;
- interpretación de figuras;
- procedimientos;
- demostraciones solo cuando sean necesarias para comprender el tema;
- ejercicios tipo UNMSM;
- errores frecuentes.
Da prioridad a comprender qué propiedad o relación permite resolver cada problema.
No agregues historia, etimología o curiosidades que no sean relevantes.
`,
  "Trigonometría": `
En este curso prioriza la comprensión de las relaciones trigonométricas y su aplicación en ejercicios.
Incluye:
- conceptos fundamentales;
- razones o funciones correspondientes;
- propiedades;
- relaciones;
- identidades;
- fórmulas;
- condiciones de aplicación;
- casos;
- procedimientos;
- transformación de expresiones;
- estrategias;
- ejercicios tipo UNMSM;
- errores frecuentes.
No te limites a enumerar fórmulas: explica cuándo y cómo se utilizan.
No agregues etimología, historia o curiosidades innecesarias.
`,
  "Economía": `
En este curso prioriza la comprensión de los conceptos y fenómenos económicos.
Incluye, cuando corresponda:
- concepto;
- características;
- elementos;
- clasificación;
- funcionamiento;
- relaciones;
- causas;
- consecuencias;
- diferencias entre conceptos;
- ejemplos y situaciones de aplicación;
- términos indispensables para el examen.
La teoría tiene importancia, pero debe ser directa y orientada al contenido del tema.
No agregues etimología, historia o curiosidades si no ayudan a comprender o diferenciar el tema.
`,
  "Biología": `
En este curso prioriza la comprensión de estructuras, funciones y procesos biológicos.
Incluye, cuando corresponda:
- concepto;
- características;
- estructura;
- partes o componentes;
- funciones;
- clasificación;
- procesos;
- mecanismos;
- relaciones;
- diferencias;
- ejemplos;
- términos indispensables para el examen.
Explica la teoría con precisión y suficiente profundidad para el nivel preuniversitario.
No agregues etimología, historia del descubrimiento o curiosidades salvo que sean relevantes para comprender el tema o sean importantes para el examen.
`,
  "Física": `
En este curso combina teoría física y resolución de problemas.
La teoría debe explicar lo necesario para comprender el fenómeno:
- concepto físico;
- magnitudes;
- unidades;
- leyes;
- principios;
- significado físico de las variables;
- relaciones;
- condiciones de aplicación.
La práctica debe incluir:
- interpretación del problema;
- identificación de datos;
- planteamiento;
- elección de la fórmula o principio;
- procedimiento;
- despeje cuando corresponda;
- sustitución;
- unidades;
- casos particulares;
- ejercicios tipo UNMSM;
- errores frecuentes.
No presentes únicamente fórmulas: explica brevemente qué representan físicamente y cuándo se aplican.
No agregues etimología, historia o curiosidades que no aporten a la comprensión o resolución de problemas.
`,
  "Química": `
En este curso combina teoría química y aplicación práctica según la naturaleza del tema.
Incluye únicamente lo que corresponda al tema:
- conceptos;
- propiedades;
- clasificación;
- estructura;
- relaciones;
- fórmulas;
- nomenclatura;
- reglas;
- reacciones;
- procesos;
- condiciones;
- cálculos;
- procedimientos;
- ejercicios;
- errores frecuentes.
La proporción entre teoría y ejercicios debe adaptarse al tema.
Si el tema es principalmente conceptual, prioriza la comprensión.
Si requiere procedimientos o cálculos, prioriza también la resolución de ejercicios.
No agregues etimología, historia o curiosidades que no sean útiles para el examen.
`,
  "Geografía": `
En este curso prioriza la comprensión del espacio geográfico y de sus procesos.
Incluye, cuando corresponda:
- concepto;
- características;
- elementos;
- factores;
- clasificación;
- ubicación;
- distribución;
- procesos;
- relaciones;
- causas;
- consecuencias;
- ejemplos;
- diferencias importantes.
Da importancia a las relaciones entre factores y fenómenos geográficos.
No agregues etimología, historia o curiosidades que no aporten al dominio del tema.
`,
  "Educación Cívica": `
En este curso prioriza la comprensión de conceptos cívicos, derechos, deberes, instituciones y normas.
Incluye, cuando corresponda:
- concepto;
- características;
- elementos;
- funciones;
- derechos;
- deberes;
- instituciones;
- competencias;
- normas;
- relaciones;
- diferencias;
- situaciones de aplicación;
- datos relevantes para el examen.
Da especial importancia a distinguir conceptos e instituciones similares.
No agregues etimología, historia o curiosidades innecesarias.
`,
  "Psicología": `
En este curso prioriza la comprensión de procesos psicológicos, conceptos y enfoques.
Incluye, cuando corresponda:
- concepto;
- objeto de estudio;
- características;
- elementos;
- procesos;
- tipos;
- teorías;
- enfoques;
- autores indispensables;
- relaciones;
- diferencias;
- ejemplos o situaciones de aplicación.
Da especial importancia a las diferencias entre conceptos similares y a reconocer cada teoría o enfoque.
No agregues biografías, etimologías o información histórica innecesaria.
`,
  "Habilidad Verbal": `
En este curso prioriza la resolución de preguntas y el reconocimiento de criterios.
Incluye:
- concepto mínimo necesario;
- criterio de identificación;
- tipos;
- relaciones;
- procedimiento;
- estrategia;
- análisis de alternativas;
- casos frecuentes;
- ejercicios tipo UNMSM;
- errores frecuentes.
La explicación debe enseñar cómo identificar y resolver el ejercicio.
No desarrolles teoría extensa si no mejora la capacidad de resolución.
`,
  "Lenguaje": `
En este curso combina teoría lingüística y aplicación práctica.
Incluye:
- concepto;
- características;
- elementos;
- clasificación;
- reglas;
- funciones;
- relaciones;
- casos;
- excepciones;
- procedimiento de análisis;
- ejemplos;
- errores frecuentes;
- ejercicios cuando correspondan.
La teoría debe permitir reconocer y aplicar correctamente las reglas.
No agregues etimología o historia de la lengua salvo que formen parte del tema solicitado.
`,
  "Literatura": `
En este curso prioriza el análisis y reconocimiento de obras, autores, corrientes y características literarias.
Incluye, cuando corresponda:
- concepto;
- características;
- género o especie;
- corriente o movimiento;
- autor;
- obra;
- tema;
- personajes;
- estructura;
- recursos literarios;
- relaciones;
- diferencias;
- datos relevantes para examen.
El contexto histórico o biográfico solo debe incluirse cuando ayude a comprender o identificar el tema u obra.
No agregues biografía, etimología o contexto innecesario.
`,
  "Historia Universal": `
En este curso prioriza la comprensión de procesos históricos y sus relaciones.
Incluye, cuando corresponda:
- ubicación temporal;
- contexto;
- antecedentes;
- causas;
- acontecimientos principales;
- desarrollo;
- consecuencias;
- personajes;
- relaciones;
- diferencias;
- cronología;
- conceptos indispensables.
El contexto histórico es importante cuando permite comprender el proceso.
No agregues acontecimientos pertenecientes a otros temas del temario.
`,
  "Historia del Perú": `
En este curso prioriza la comprensión cronológica, causal y estructural de los procesos históricos del Perú.
Incluye, cuando corresponda:
- ubicación temporal;
- contexto;
- organización política;
- organización social;
- economía;
- cultura;
- antecedentes;
- causas;
- acontecimientos;
- desarrollo;
- consecuencias;
- personajes;
- relaciones;
- diferencias;
- cronología.
El contexto debe incluirse cuando sea necesario para comprender el proceso.
No mezcles periodos, culturas o procesos que correspondan a otros temas del temario.
`,
  "Filosofía": `
En este curso prioriza la comprensión de problemas filosóficos, conceptos y posiciones.
Incluye, cuando corresponda:
- problema filosófico;
- concepto;
- ideas fundamentales;
- características;
- postura;
- corriente;
- autor;
- planteamientos principales;
- relaciones;
- diferencias;
- ejemplos de aplicación.
Da especial importancia a identificar:
autor → corriente o postura → idea central → diferencias.
No agregues etimología, biografía extensa o historia innecesaria salvo que sea relevante para el tema.
`
};
function labelCursoTemario(curso) {
  return LABELS_CORTOS_TEMARIO[curso] || curso;
}
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export default function RepasoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("hoy");
  const [searchOpen, setSearchOpen] = useState(false);
  const [log, setLog] = useState(() => leerLog());
  const [recomendadoFullScreenOpen, setRecomendadoFullScreenOpen] =
    useState(false);
  const [confirmarRepaso, setConfirmarRepaso] = useState({
    isOpen: false,
    curso: "",
    semana: null,
    tema: ""
  });
  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    id: null,
    phase: 1
  });
  const [cursoTemario, setCursoTemario] = useState("");
  const [categoriaTemario, setCategoriaTemario] = useState("");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [semanaSelectorAbierto, setSemanaSelectorAbierto] = useState(false);
  const [semanaTemario, setSemanaTemario] = useState(1);
  const [busquedaTemario, setBusquedaTemario] = useState("");
  const [temaSeleccionado, setTemaSeleccionado] = useState(null);
  const [busquedaTemarioAbierta, setBusquedaTemarioAbierta] =
    useState(false);
  const [copiadoKey, setCopiadoKey] = useState("");
  const selectRef = useRef(null);
  const semanaRef = useRef(null);
  const buscadorTemarioRef = useRef(null);
  const recomendacionesHoy = useMemo(
    () => obtenerRecomendacionesHoy(),
    [log]
  );
  const recomendacionesConTemas = useMemo(
    () => recomendacionesHoy.filter((r) => r.temas.length > 0),
    [recomendacionesHoy]
  );
  const { repasosHoy, proximos } = useMemo(
    () => clasificarRepasos(log),
    [log]
  );
  const porFecha = useMemo(() => {
    const map = {};
    proximos.forEach((item) => {
      if (!map[item.fecha]) {
        map[item.fecha] = [];
      }
      map[item.fecha].push(item);
    });
    return map;
  }, [proximos]);
  const cursosDeCategoria = useMemo(() => {
    if (!categoriaTemario) return [];
    const categoria = CATEGORIAS_TEMARIO.find(
      (cat) => cat.id === categoriaTemario
    );
    return categoria ? categoria.cursos : [];
  }, [categoriaTemario]);
  const temasSemana = useMemo(() => {
    if (!cursoTemario) return [];
    return (
      coursesSemanas[cursoTemario]?.[`semana_${semanaTemario}`] || []
    );
  }, [cursoTemario, semanaTemario]);
  /*
   * Número inicial de la semana actual.
   *
   * Ejemplo:
   * Semana 1 → 1
   * Semana 2 → cantidad de temas de semana 1 + 1
   * Semana 3 → temas de semana 1 + semana 2 + 1
   */
  const numeroInicialSemana = useMemo(() => {
    if (!cursoTemario) return 1;
    let total = 0;
    for (let semana = 1; semana < semanaTemario; semana++) {
      total += (
        coursesSemanas[cursoTemario]?.[`semana_${semana}`] || []
      ).length;
    }
    return total + 1;
  }, [cursoTemario, semanaTemario]);
  /*
   * Calcula el número consecutivo de un tema dentro de un curso.
   * No reinicia la numeración al cambiar de semana.
   */
  function obtenerNumeroTema(curso, semana, indice) {
    let total = 0;
    for (let numeroSemana = 1; numeroSemana < semana; numeroSemana++) {
      total += (
        coursesSemanas[curso]?.[`semana_${numeroSemana}`] || []
      ).length;
    }
    return total + indice + 1;
  }
  const resultadosBusquedaTemario = useMemo(() => {
    const termino = normalizarTexto(busquedaTemario.trim());
    if (!termino) return [];
    const resultados = [];
    for (const [curso, semanas] of Object.entries(coursesSemanas)) {
      for (const [claveSemana, temas] of Object.entries(semanas || {})) {
        const numeroSemana = Number(
          claveSemana.replace("semana_", "")
        );
        for (let indice = 0; indice < (temas || []).length; indice++) {
          const tema = temas[indice];
          if (normalizarTexto(tema).includes(termino)) {
            resultados.push({
              curso,
              semana: numeroSemana,
              numeroTema: obtenerNumeroTema(
                curso,
                numeroSemana,
                indice
              ),
              tema
            });
          }
        }
      }
    }
    return resultados;
  }, [busquedaTemario]);
  const resultadoBusquedaTemario =
    resultadosBusquedaTemario[0] || null;
  const temasVisiblesTemario = useMemo(() => {
    if (temaSeleccionado) {
      return [temaSeleccionado];
    }
    if (busquedaTemario.trim()) {
      return resultadosBusquedaTemario;
    }
    if (!cursoTemario) return [];
    return temasSemana.map((tema, indice) => ({
      curso: cursoTemario,
      semana: semanaTemario,
      numeroTema: numeroInicialSemana + indice,
      tema
    }));
  }, [
    temaSeleccionado,
    busquedaTemario,
    resultadosBusquedaTemario,
    cursoTemario,
    semanaTemario,
    temasSemana,
    numeroInicialSemana
  ]);
  const cursoSelectorTemario =
    cursoTemario || resultadoBusquedaTemario?.curso || "";
  const semanaSelectorTemario = cursoTemario
    ? semanaTemario
    : resultadoBusquedaTemario?.semana || 1;
  const semanaHabilitada =
    Boolean(cursoTemario) || Boolean(resultadoBusquedaTemario);
  useEffect(() => {
    function manejarClickFuera(e) {
      if (
        selectRef.current &&
        !selectRef.current.contains(e.target)
      ) {
        setSelectorAbierto(false);
      }
      if (
        semanaRef.current &&
        !semanaRef.current.contains(e.target)
      ) {
        setSemanaSelectorAbierto(false);
      }
      if (
        buscadorTemarioRef.current &&
        !buscadorTemarioRef.current.contains(e.target)
      ) {
        setBusquedaTemarioAbierta(false);
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
    };
  }, []);
  function irAMiEstudio(nombre) {
    navigate(`/?q=${encodeURIComponent(nombre)}`);
  }
  function marcar(id, intervaloIdx, repasosDoneActual) {
    const repasosDone = Array.isArray(repasosDoneActual)
      ? [...repasosDoneActual]
      : [];
    if (!repasosDone.includes(intervaloIdx)) {
      repasosDone.push(intervaloIdx);
    }
    // marcarRepasoHecho ya suma por su cuenta el siguiente intervalo;
    // por eso se le pasa el estado ORIGINAL (si no, contaba doble).
    setLog(marcarRepasoHecho(id, repasosDoneActual));
  }
  function iniciarBorrado(id) {
    setDeleteState({
      isOpen: true,
      id,
      phase: 1
    });
  }
  function confirmarBorrado() {
    if (deleteState.phase === 1) {
      setDeleteState({
        ...deleteState,
        phase: 2
      });
    } else {
      setLog(eliminarRepaso(deleteState.id));
      setDeleteState({
        isOpen: false,
        id: null,
        phase: 1
      });
    }
  }
  function cancelarBorrado() {
    setDeleteState({
      isOpen: false,
      id: null,
      phase: 1
    });
  }
  function elegirCategoria(catId) {
    setCategoriaTemario(catId);
    setCursoTemario("");
    setSemanaTemario(1);
    setTemaSeleccionado(null);
    setBusquedaTemario("");
    setSelectorAbierto(true);
    setSemanaSelectorAbierto(false);
  }
  function elegirCurso(nombre) {
    const categoria = CATEGORIAS_TEMARIO.find((cat) =>
      cat.cursos.includes(nombre)
    );
    setCursoTemario(nombre);
    setCategoriaTemario(categoria?.id || "");
    setSemanaTemario(1);
    setTemaSeleccionado(null);
    setBusquedaTemario("");
    setSelectorAbierto(false);
  }
  function volverCategorias() {
    setCategoriaTemario("");
    setCursoTemario("");
    setSemanaTemario(1);
    setTemaSeleccionado(null);
    setBusquedaTemario("");
    setSelectorAbierto(true);
    setSemanaSelectorAbierto(false);
  }
  function elegirSemana(semana) {
    const cursoBusqueda = resultadoBusquedaTemario?.curso;
    const categoriaBusqueda = CATEGORIAS_TEMARIO.find((cat) =>
      cat.cursos.includes(cursoBusqueda)
    );
    if (!cursoTemario && cursoBusqueda) {
      setCursoTemario(cursoBusqueda);
      setCategoriaTemario(categoriaBusqueda?.id || "");
    }
    setSemanaTemario(semana);
    setTemaSeleccionado(null);
    setSemanaSelectorAbierto(false);
    setBusquedaTemario("");
    setBusquedaTemarioAbierta(false);
  }
  function seleccionarResultadoBusqueda(resultado) {
    const categoria = CATEGORIAS_TEMARIO.find((cat) =>
      cat.cursos.includes(resultado.curso)
    );
    setCategoriaTemario(categoria?.id || "");
    setCursoTemario(resultado.curso);
    setSemanaTemario(resultado.semana);
    setTemaSeleccionado({
      curso: resultado.curso,
      semana: resultado.semana,
      numeroTema: resultado.numeroTema,
      tema: resultado.tema
    });
    setBusquedaTemarioAbierta(false);
    setSelectorAbierto(false);
    setSemanaSelectorAbierto(false);
  }
  function manejarBusquedaTemarioKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    setBusquedaTemarioAbierta(false);
  }
  function limpiarBusquedaTemario() {
    setBusquedaTemario("");
    setBusquedaTemarioAbierta(false);
  }
  function resaltarCoincidencia(texto) {
    const termino = busquedaTemario.trim();
    if (!termino) return texto;
    const terminoNormalizado = normalizarTexto(termino);
    const partes = [];
    let posicion = 0;
    while (posicion < texto.length) {
      const posicionNormalizada = normalizarTexto(
        texto.slice(posicion)
      ).indexOf(terminoNormalizado);
      if (posicionNormalizada === -1) {
        partes.push(
          <span key={posicion}>
            {texto.slice(posicion)}
          </span>
        );
        break;
      }
      let inicio = posicion;
      let caracteresNormalizados = 0;
      while (
        inicio < texto.length &&
        caracteresNormalizados < posicionNormalizada
      ) {
        caracteresNormalizados += normalizarTexto(
          texto[inicio]
        ).length;
        inicio++;
      }
      if (inicio > posicion) {
        partes.push(
          <span key={`${posicion}-antes`}>
            {texto.slice(posicion, inicio)}
          </span>
        );
      }
      let fin = inicio;
      let longitudNormalizada = 0;
      while (
        fin < texto.length &&
        longitudNormalizada < terminoNormalizado.length
      ) {
        longitudNormalizada += normalizarTexto(
          texto[fin]
        ).length;
        fin++;
      }
      partes.push(
        <mark
          key={`${inicio}-${fin}`}
          className="repaso__temario-search-highlight"
        >
          {texto.slice(inicio, fin)}
        </mark>
      );
      posicion = fin;
    }
    return partes;
  }
  function temaEstaRecomendadoHoy(curso, semana, tema) {
    return recomendacionesHoy.some(
      (r) =>
        r.curso === curso &&
        r.temas.includes(tema)
    );
  }
  function temaEstaProgramado(curso, semana, tema) {
    return log.some(
      (entrada) =>
        entrada.subject === curso &&
        entrada.tema === tema &&
        entrada.day === `Semana ${semana}`
    );
  }
  function abrirConfirmacionRepaso(curso, semana, tema) {
    if (temaEstaProgramado(curso, semana, tema)) return;
    setConfirmarRepaso({
      isOpen: true,
      curso,
      semana,
      tema
    });
  }
  function cancelarProgramacionRepaso() {
    setConfirmarRepaso({
      isOpen: false,
      curso: "",
      semana: null,
      tema: ""
    });
  }
  function confirmarProgramacionRepaso() {
    if (
      !confirmarRepaso.curso ||
      !confirmarRepaso.tema ||
      !confirmarRepaso.semana
    ) {
      cancelarProgramacionRepaso();
      return;
    }
    registrarCursoCompletado({
      subject: confirmarRepaso.curso,
      tema: confirmarRepaso.tema,
      day: `Semana ${confirmarRepaso.semana}`
    });
    setLog(leerLog());
    cancelarProgramacionRepaso();
  }
  function abrirTemaEnYoutube(curso, tema) {
    const query = `${curso} ${tema} preuniversitario`;
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      "_blank"
    );
  }
  function armarTemarioCurso(curso) {
    return Object.entries(coursesSemanas[curso] || {})
      .map(([claveSemana, temas]) => {
        const numeroSemana = claveSemana.replace("semana_", "");
        return `Semana ${numeroSemana}: ${(temas || []).join(" | ")}`;
      })
      .join("\n");
  }
  // Copia al portapapeles el prompt del paso 1 (investigar) o del paso 2 (JSON).
  async function copiarPasoJson(paso, curso, tema) {
    const texto =
      paso === 1
        ? construirPromptRepaso({
            curso,
            tema,
            temarioCurso: armarTemarioCurso(curso),
            paraJson: true
          })
        : paso === 3
        ? construirPromptExamen({ curso, tema })
        : construirPromptJson({ curso, tema });
    const clave = `${curso}|${tema}|${paso}`;
    const ok = await copiarTexto(texto);
    if (!ok) {
      window.alert("No se pudo copiar al portapapeles.");
      return;
    }
    setCopiadoKey(clave);
    setTimeout(() => {
      setCopiadoKey((actual) => (actual === clave ? "" : actual));
    }, 2000);
  }
  // Paso 1: abre ChatGPT con el prompt ya puesto. Además lo copia al
  // portapapeles por si la URL resulta muy larga y el chat abre vacío.
  function abrirPaso1EnChatGPT(curso, tema) {
    const prompt = construirPromptRepaso({
      curso,
      tema,
      temarioCurso: armarTemarioCurso(curso)
    });
    window.open(
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}&hints=search`,
      "_blank"
    );
    copiarTexto(prompt);
  }
  function abrirTemaEnChatGPT(curso, tema) {
    const temarioCurso = Object.entries(
      coursesSemanas[curso] || {}
    )
      .map(([claveSemana, temas]) => {
        const numeroSemana = claveSemana.replace("semana_", "");
        return `Semana ${numeroSemana}: ${(temas || []).join(" | ")}`;
      })
      .join("\n");
    const prompt = construirPromptRepaso({
      curso,
      tema,
      temarioCurso
    });
    window.open(
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
      "_blank"
    );
  }
  // Versión anterior (prompt único con INSTRUCCIONES_CHATGPT). Ya no se usa:
  // se dejó tal cual y solo se quitó la referencia desde el botón.
  function abrirTemaEnChatGPTAnterior(curso, tema) {
    const instruccionesCurso =
      INSTRUCCIONES_CHATGPT[curso] ||
      "Adapta la explicación a la naturaleza del curso y prioriza únicamente los contenidos fundamentales del tema.";
    const temarioCurso = Object.entries(
      coursesSemanas[curso] || {}
    )
      .map(([claveSemana, temas]) => {
        const numeroSemana = claveSemana.replace("semana_", "");
        return `Semana ${numeroSemana}: ${(temas || []).join(" | ")}`;
      })
      .join("\n");
    const prompt = `Investiga el tema "${tema}" del curso "${curso}" a nivel preuniversitario para el examen de admisión UNMSM.
Usa información confiable y contrástala antes de responder, pero NO muestres el proceso de investigación ni información sobre las fuentes.
Quiero APUNTES PARA COPIAR EN EL CUADERNO.
ALCANCE DEL TEMA:
El siguiente es el temario COMPLETO ÚNICAMENTE del curso "${curso}".
ÚSALO SOLO PARA DELIMITAR EL TEMA SOLICITADO.
TEMARIO DE ${curso.toUpperCase()}:
${temarioCurso}
REGLA PRINCIPAL:
Investiga ÚNICAMENTE el tema "${tema}".
El curso "${curso}" sirve para establecer el nivel y el enfoque académico.
Los demás temas del temario son unidades independientes.
NO desarrolles otros temas aunque:
- estén relacionados;
- sean necesarios para el mismo curso;
- aparezcan inmediatamente antes o después;
- normalmente se estudien juntos;
- sean subtemas relacionados.
Si necesitas mencionar brevemente otro concepto para explicar "${tema}", puedes hacerlo, pero NO lo desarrolles.
Ejemplo:
Si el tema solicitado es "Lógica proposicional", no desarrolles como temas independientes "Conectivos lógicos", "Tablas de verdad" o "Cuantificadores" si aparecen como entradas separadas del temario.
COMPLETO ≠ LARGO.
Completo → cubrir todos los contenidos fundamentales del tema.
Breve → expresar cada contenido con la menor cantidad de palabras posible.
La cantidad de contenido debe depender de la amplitud real del tema.
Tema pequeño → respuesta pequeña pero completa.
Tema amplio → respuesta más amplia.
NO rellenes la respuesta para hacerla parecer completa.
ENFOQUE DEL CURSO:
${instruccionesCurso}
REGLAS DE CONTENIDO:
- Incluye todo lo fundamental del tema.
- No omitas conceptos importantes solo para hacer la respuesta más corta.
- No agregues información solo para hacerla parecer completa.
- Prioriza contenido evaluable en un examen de admisión.
- Incluye definiciones solo cuando sean necesarias.
- Incluye clasificaciones solo cuando correspondan al tema.
- Incluye propiedades cuando correspondan.
- Incluye relaciones cuando sean importantes.
- Incluye procesos cuando correspondan.
- Incluye fórmulas cuando correspondan.
- Incluye reglas cuando correspondan.
- Incluye procedimientos cuando correspondan.
- Incluye ejemplos cuando ayuden a comprender o resolver.
- Incluye diferencias cuando existan conceptos que puedan confundirse.
- Incluye excepciones solo si son relevantes para examen.
- Incluye términos indispensables.
- No fuerces secciones que no correspondan.
- No repitas información.
- No inventes clasificaciones, relaciones ni datos.
- No presentes como absoluto algo que solo ocurre generalmente.
- No agregues etimología salvo que sea parte fundamental del tema.
- No agregues curiosidades.
- No agregues historia innecesaria.
- No agregues biografías innecesarias.
- No agregues contenido universitario especializado.
- No agregues información de otros temas del temario.
- No menciones universidades, academias, profesores ni el proceso de investigación.
REGLAS DE REDACCIÓN:
- Ve directamente al contenido.
- Sé MUY breve, conciso y directo.
- Una viñeta = una idea.
- Una idea = un dato principal.
- No conviertas una viñeta en un párrafo.
- No juntes varias ideas importantes en una sola viñeta.
- Usa frases cortas.
- Reduce la longitud de cada idea, NO el contenido necesario.
- Usa palabras clave.
- Usa "→" para relaciones.
- Usa "=" para equivalencias.
- Usa "⊃" para inclusión cuando ayude.
- Usa "↑" y "↓" cuando faciliten relaciones.
- Usa tablas solo cuando realmente ayuden a comparar.
- Usa fórmulas y esquemas cuando correspondan.
- Cada característica importante → una viñeta.
- Cada causa importante → una viñeta.
- Cada consecuencia importante → una viñeta.
- Cada tipo importante → una viñeta.
- Cada propiedad importante → una viñeta.
- Cada ejemplo → breve.
- Evita palabras de relleno.
NIVEL DE BREVEDAD:
NO:
"Los seres vivos son sistemas organizados capaces de realizar funciones vitales, mantener su equilibrio interno, reproducirse y evolucionar."
SÍ:
- Organización → estructura ordenada.
- Metabolismo → realizan reacciones químicas.
- Homeostasis → mantienen equilibrio interno.
- Reproducción → originan nuevos individuos.
- Evolución → cambian a través del tiempo.
FORMATO:
# ${tema}
Organiza únicamente las secciones que realmente correspondan al tema.
Puedes utilizar:
- Concepto
- Características
- Elementos / partes
- Clasificación
- Propiedades
- Reglas
- Fórmulas
- Funciones
- Procesos
- Procedimientos
- Casos importantes
- Ejemplos
- Diferencias
- Claves para examen
NO tienes que utilizar todas.
Si una sección no corresponde al tema, elimínala.
Si el tema necesita otra sección para explicarse correctamente, créala.
PARA TEMAS MATEMÁTICOS, FÍSICOS O QUÍMICOS:
Cuando corresponda, incluye ejercicios o ejemplos de aplicación.
No conviertas todo en teoría.
Explica:
concepto → procedimiento → aplicación.
PARA TEMAS DE LETRAS, CIENCIAS SOCIALES O HUMANIDADES:
Prioriza la comprensión de conceptos, relaciones, características, procesos, diferencias y datos relevantes.
No agregues ejercicios matemáticos ni estructuras artificiales que no correspondan al tema.
RESULTADO FINAL:
La respuesta debe parecer un APUNTE DE CUADERNO:
- completa en contenido;
- breve en redacción;
- una idea por viñeta;
- ordenada;
- directa;
- fácil de copiar;
- fácil de memorizar;
- orientada al examen de admisión UNMSM.
No escribas introducción.
No escribas conclusión.
No hagas un informe.
No hagas un ensayo.
No expliques el proceso de investigación.
Escribe directamente los apuntes.`;
    window.open(
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
      "_blank"
    );
  }
  return (
    <main className="container__repaso">
      <div className="repaso">
        <AppHeader
          section="repaso"
          onAbrirBuscador={() => setSearchOpen(true)}
        />
        <div className="repaso__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`repaso__tab ${
                tab === t.id ? "repaso__tab--active" : ""
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "hoy" && (
          <section className="repaso__section">
            <div className="repaso__list">
              {repasosHoy.map(
                ({ entrada, intervaloIdx, vencido }) => {
                  const lc = intervaloClasses(intervaloIdx);
                  const numRepaso = intervaloIdx + 1;
                  return (
                    <div
                      key={entrada.id}
                      className={`repaso__item ${lc.box}`}
                    >
                      <div className="repaso__item-body">
                        <div className="repaso__item-tags">
                          <span
                            className={`repaso__badge ${lc.badge}`}
                          >
                            Repaso {numRepaso}
                          </span>
                          {entrada.day && (
                            <span className="repaso__item-day">
                              {entrada.day}
                            </span>
                          )}
                          {vencido && (
                            <span className="repaso__item-overdue">
                              Vencido
                            </span>
                          )}
                        </div>
                        <h3 className="repaso__item-subject">
                          {entrada.subject}
                        </h3>
                        {entrada.tema && (
                          <p className="repaso__item-tema">
                            Tema: {entrada.tema}
                          </p>
                        )}
                        <p className="repaso__item-meta">
                          Repaso {numRepaso} de{" "}
                          {REPASO_INTERVALOS.length}
                          {" · "}
                          Intervalo{" "}
                          {REPASO_INTERVALOS[intervaloIdx]} día
                          {REPASO_INTERVALOS[intervaloIdx] > 1
                            ? "s"
                            : ""}
                        </p>
                        <button
                          onClick={() =>
                            irAMiEstudio(
                              entrada.tema || entrada.subject
                            )
                          }
                          className="repaso__item-link"
                        >
                          <i className="bi bi-book" />
                          Repasar
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          marcar(
                            entrada.id,
                            intervaloIdx,
                            entrada.repasosDone
                          )
                        }
                        className="repaso__check"
                        aria-label="Marcar repaso como realizado"
                        title="Marcar repaso como realizado"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          fill="none"
                          strokeWidth="2.5"
                          width="16"
                          height="16"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          iniciarBorrado(entrada.id)
                        }
                        className="repaso__trash"
                        aria-label="Eliminar repaso"
                        title="Eliminar repaso"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  );
                }
              )}
            </div>
            {repasosHoy.length === 0 && (
              <div className="repaso__empty">
                <div className="repaso__empty-emoji">🎉</div>
                <p className="repaso__empty-title">
                  No tienes repasos pendientes hoy
                </p>
                <p className="repaso__empty-sub">
                  Vuelve mañana o completa más cursos en el
                  cronograma
                </p>
              </div>
            )}
          </section>
        )}
        {tab === "proximos" && (
          <section className="repaso__section">
            {proximos.length === 0 ? (
              <div className="repaso__empty">
                <div className="repaso__empty-emoji">🎉</div>
                <p className="repaso__empty-title">
                  No tienes repasos próximos
                </p>
                <p className="repaso__empty-sub">
                  Cuando guardes temas, aquí verás cuándo te
                  toca repasarlos
                </p>
              </div>
            ) : (
              <div className="repaso__proximos-list">
                {Object.keys(porFecha)
                  .sort()
                  .map((fecha) => {
                    const grupo = porFecha[fecha];
                    const diff = diffDias(fecha);
                    const etiqueta =
                      diff === 1
                        ? "Mañana"
                        : `En ${diff} días`;
                    return (
                      <div
                        key={fecha}
                        className="repaso__proximos-group"
                      >
                        <div className="repaso__proximos-group-header">
                          <span className="repaso__proximos-fecha">
                            {formatearFecha(fecha)}
                          </span>
                          <span className="repaso__proximos-etiqueta">
                            {etiqueta}
                          </span>
                        </div>
                        {grupo.map(
                          ({ entrada, intervaloIdx }) => (
                            <div
                              key={entrada.id}
                              className="repaso__proximos-row"
                            >
                              <div className="repaso__proximos-row-content">
                                <span
                                  className={`repaso__dot ${
                                    intervaloClasses(
                                      intervaloIdx
                                    ).badge
                                  }`}
                                />
                                <span className="repaso__proximos-subject">
                                  {entrada.subject}
                                  {entrada.tema && (
                                    <span className="repaso__proximos-tema">
                                      {" "}
                                      — {entrada.tema}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  iniciarBorrado(
                                    entrada.id
                                  )
                                }
                                className="repaso__proximos-trash"
                                aria-label="Eliminar repaso"
                                title="Eliminar repaso"
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}
        {tab === "temario" && (
          <section className="repaso__section">
            <div className="repaso__temario-toolbar">
              <div
                className="repaso__categoria-wrapper"
                ref={selectRef}
              >
                <button
                  type="button"
                  className={`repaso__categoria-tab ${
                    selectorAbierto
                      ? "repaso__categoria-tab--active"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectorAbierto((prev) => !prev);
                    setSemanaSelectorAbierto(false);
                  }}
                >
                  {cursoSelectorTemario
                    ? labelCursoTemario(cursoSelectorTemario)
                    : categoriaTemario
                      ? CATEGORIAS_TEMARIO.find(
                          (cat) =>
                            cat.id === categoriaTemario
                        )?.label
                      : "Curso"}
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {selectorAbierto && (
                  <div className="repaso__select">
                    <div className="repaso__select-menu">
                      {!categoriaTemario ? (
                        CATEGORIAS_TEMARIO.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className="repaso__select-option"
                            onClick={() =>
                              elegirCategoria(cat.id)
                            }
                          >
                            {cat.label}
                          </button>
                        ))
                      ) : (
                        <>
                          <button
                            type="button"
                            className="repaso__select-back"
                            onClick={volverCategorias}
                          >
                            <i className="fa-solid fa-arrow-left" />
                            Categorías
                          </button>
                          {cursosDeCategoria.map((curso) => (
                            <button
                              key={curso}
                              type="button"
                              className={`repaso__select-option ${
                                cursoTemario === curso
                                  ? "repaso__select-option--active"
                                  : ""
                              }`}
                              onClick={() =>
                                elegirCurso(curso)
                              }
                            >
                              {labelCursoTemario(curso)}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div
                className="repaso__categoria-wrapper"
                ref={semanaRef}
              >
                <button
                  type="button"
                  disabled={!semanaHabilitada}
                  className={`repaso__categoria-tab ${
                    semanaSelectorAbierto
                      ? "repaso__categoria-tab--active"
                      : ""
                  }`}
                  onClick={() => {
                    if (!semanaHabilitada) return;
                    if (
                      !cursoTemario &&
                      resultadoBusquedaTemario
                    ) {
                      const categoria =
                        CATEGORIAS_TEMARIO.find((cat) =>
                          cat.cursos.includes(
                            resultadoBusquedaTemario.curso
                          )
                        );
                      setCursoTemario(
                        resultadoBusquedaTemario.curso
                      );
                      setCategoriaTemario(
                        categoria?.id || ""
                      );
                      setSemanaTemario(
                        resultadoBusquedaTemario.semana
                      );
                      setTemaSeleccionado({
                        curso:
                          resultadoBusquedaTemario.curso,
                        semana:
                          resultadoBusquedaTemario.semana,
                        numeroTema:
                          resultadoBusquedaTemario.numeroTema,
                        tema:
                          resultadoBusquedaTemario.tema
                      });
                    }
                    setSemanaSelectorAbierto(
                      (prev) => !prev
                    );
                    setSelectorAbierto(false);
                  }}
                >
                  Semana {semanaSelectorTemario}
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {semanaSelectorAbierto &&
                  semanaHabilitada && (
                    <div className="repaso__select">
                      <div className="repaso__select-menu">
                        {SEMANAS_TEMARIO.map((semana) => (
                          <button
                            key={semana}
                            type="button"
                            className={`repaso__select-option ${
                              semanaSelectorTemario === semana
                                ? "repaso__select-option--active"
                                : ""
                            }`}
                            onClick={() =>
                              elegirSemana(semana)
                            }
                          >
                            Semana {semana}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div
                className="repaso__temario-search"
                ref={buscadorTemarioRef}
              >
                <div className="repaso__temario-search-input">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    type="text"
                    value={busquedaTemario}
                    placeholder="Buscar tema..."
                    onChange={(e) => {
                      setBusquedaTemario(e.target.value);
                      setTemaSeleccionado(null);
                      setBusquedaTemarioAbierta(true);
                    }}
                    onFocus={() => {
                      if (busquedaTemario.trim()) {
                        setBusquedaTemarioAbierta(true);
                      }
                    }}
                    onKeyDown={
                      manejarBusquedaTemarioKeyDown
                    }
                    aria-label="Buscar tema en el temario"
                  />
                  {busquedaTemario && (
                    <button
                      type="button"
                      onClick={limpiarBusquedaTemario}
                      aria-label="Limpiar búsqueda"
                      title="Limpiar búsqueda"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
                {busquedaTemarioAbierta &&
                  busquedaTemario.trim() && (
                    <div className="repaso__temario-search-results">
                      {resultadosBusquedaTemario.length > 0 ? (
                        resultadosBusquedaTemario
                          .slice(0, 8)
                          .map((resultado) => (
                            <button
                              key={`${resultado.curso}|${resultado.semana}|${resultado.tema}`}
                              type="button"
                              className="repaso__temario-search-result"
                              onClick={() =>
                                seleccionarResultadoBusqueda(
                                  resultado
                                )
                              }
                            >
                              <span className="repaso__temario-search-result-tema">
                                {resaltarCoincidencia(
                                  resultado.tema
                                )}
                              </span>
                              <span className="repaso__temario-search-result-meta">
                                {labelCursoTemario(
                                  resultado.curso
                                )}
                                {" · "}
                                Semana{" "}
                                {resultado.semana}
                                {" · "}
                                Tema{" "}
                                {String(
                                  resultado.numeroTema
                                ).padStart(2, "0")}
                              </span>
                            </button>
                          ))
                      ) : (
                        <div className="repaso__temario-search-empty">
                          No se encontró ningún tema.
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
            {!cursoTemario &&
              !busquedaTemario.trim() && (
                <div className="repaso__empty">
                  <div className="repaso__empty-emoji">
                    📚
                  </div>
                  <p className="repaso__empty-title">
                    Elige un curso
                  </p>
                  <p className="repaso__empty-sub">
                    Selecciona un curso para ver sus temas
                  </p>
                </div>
              )}
            {(cursoTemario ||
              busquedaTemario.trim()) && (
              <div className="repaso__temario-list">
                {temasVisiblesTemario.map(
                  ({
                    curso,
                    semana,
                    numeroTema,
                    tema
                  }) => {
                    const programado =
                      temaEstaProgramado(
                        curso,
                        semana,
                        tema
                      );
                    const recomendadoHoy =
                      !programado &&
                      temaEstaRecomendadoHoy(
                        curso,
                        semana,
                        tema
                      );
                    return (
                      <div
                        key={`${curso}|${semana}|${tema}`}
                        className={`repaso__temario-item ${
                          programado
                            ? "repaso__temario-item--done"
                            : recomendadoHoy
                              ? "repaso__temario-item--recomendado"
                              : ""
                        }`}
                      >
                        <div className="repaso__temario-item-content">
                          <button
                            type="button"
                            className="repaso__temario-item-nombre-button"
                            onClick={() =>
                              abrirConfirmacionRepaso(
                                curso,
                                semana,
                                tema
                              )
                            }
                            disabled={programado}
                          >
                            <span className="repaso__temario-item-numero">
                              {numeroTema})
                            </span>{" "}
                            {tema}
                          </button>
                        </div>
                        {!programado && (
                          <div className="repaso__temario-actions">
                            <button
                              type="button"
                              className="repaso__temario-action"
                              onClick={() =>
                                abrirTemaEnYoutube(
                                  curso,
                                  tema
                                )
                              }
                            >
                              ▶ YouTube
                            </button>
                            <button
                              type="button"
                              className="repaso__temario-action"
                              onClick={() =>
                                abrirPaso1EnChatGPT(curso, tema)
                              }
                            >
                              🤖 Investigar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
                {temasVisiblesTemario.length === 0 && (
                  <p className="repaso__proximos-empty">
                    No se encontró ningún tema.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
        <button
          type="button"
          className="repaso__recomendado-fab"
          onClick={() =>
            setRecomendadoFullScreenOpen(true)
          }
          aria-label="Ver repasos recomendados de hoy"
        >
          <i className="bi bi-calendar-check" />
        </button>
        {recomendadoFullScreenOpen && (
          <div className="repaso__recomendado-fullscreen">
            <div className="repaso__recomendado-fullscreen-header">
              <button
                type="button"
                className="repaso__recomendado-volver"
                onClick={() =>
                  setRecomendadoFullScreenOpen(false)
                }
              >
                <i className="bi bi-arrow-left" /> Volver
              </button>
              <h2>Recomendado de hoy</h2>
            </div>
            <p className="repaso__recomendado-vacio">
              {recomendacionesConTemas.length === 0
                ? "No hay repasos pendientes por hoy. ¡Vas al día!"
                : null}
            </p>
            {recomendacionesConTemas.map((r) => (
              <div
                key={`${r.curso}-Turno${r.turno}`}
                className="repaso__recomendado-curso"
              >
                <div className="repaso__recomendado-curso-nombre">
                  {r.curso}
                </div>
                <ul className="repaso__recomendado-temas">
                  {r.temas.map((tema) => (
                    <li key={tema}>{tema}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={(item) => {
            setSearchOpen(false);
            irAMiEstudio(
              item.type === "curso"
                ? item.nombre
                : item.tema
            );
          }}
        />
        {deleteState.isOpen && (
          <div className="delete-modal-overlay">
            <div className="delete-modal-content">
              <div className="delete-modal-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <h3 className="delete-modal-title">
                ¿Eliminar repaso?
              </h3>
              <p className="delete-modal-text">
                {deleteState.phase === 1
                  ? "Esta acción requiere confirmación. Selecciona Aceptar para continuar."
                  : "¡Atención! ¿Estás completamente seguro de borrarlo?"}
              </p>
              <div
                className={`delete-modal-buttons ${
                  deleteState.phase === 1
                    ? "delete-modal-buttons--reverse"
                    : ""
                }`}
              >
                <button
                  onClick={confirmarBorrado}
                  className={`btn-confirm ${
                    deleteState.phase === 1
                      ? "btn-confirm--phase1"
                      : "btn-confirm--phase2"
                  }`}
                >
                  {deleteState.phase === 1
                    ? "Aceptar"
                    : "Sí, borrar"}
                </button>
                <button
                  onClick={cancelarBorrado}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmarRepaso.isOpen && (
          <div className="repaso__confirm-toast">
            <div className="repaso__confirm-toast-content">
              <div className="repaso__confirm-toast-info">
                <i className="fa-solid fa-calendar-check" />
                <div>
                  <strong>Guardar repaso</strong>
                  <span>{confirmarRepaso.tema}</span>
                </div>
              </div>
              <div className="repaso__confirm-toast-actions">
                <button
                  type="button"
                  className="repaso__confirm-toast-cancel"
                  onClick={
                    cancelarProgramacionRepaso
                  }
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="repaso__confirm-toast-confirm"
                  onClick={
                    confirmarProgramacionRepaso
                  }
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}