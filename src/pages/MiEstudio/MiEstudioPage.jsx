import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import manifest from "../../data/manifest.json";
import { registrarCursoCompletado } from "../../lib/repasoStorage";
import { obtenerRecomendacionesHoy } from "../../lib/repasoRecomendado";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useSearchHistory } from "../../hooks/useSearchHistory";
import AppHeader from "../../components/AppHeader";
import { useFooterVisibility } from "../../context/FooterVisibilityContext";
import QuestionCard from "./QuestionCard";
import TemaExamenView from "./TemaExamenView";
import ExplanationPanel from "./ExplanationPanel";
import GlossaryText from "./Glossarytext";

import { resaltarPalabraTemporal, flashearFondoTemporal } from "../../utils/resaltarBusqueda";
import TopBar from "./TopBar";
import TheorySearchBar from "./TheorySearchBar";
import Hud from "./Hud";
import SeenQuestionsModal from "./SeenQuestionsModal";
import SearchModal from "../../components/SearchModal";
import Modal from "../../components/Modal";
import ModoEstudioModal from "./ModoEstudioModal";
import PomodoroAlarmModal from "./PomodoroAlarmModal";
import TopicsModal from "./TopicsModal";
import ExercisesSection from "./ExercisesSection";
import ConfirmacionSalida from "../../components/ConfirmacionSalida";
import CongratulationsAlert from "../../components/CongratulationsAlert";
import {
  guardarRetorno,
  limpiarPomodoroCompartido,
  leerYLimpiarRetorno
} from "../../lib/pomodoroShared";
import { usePomodoro } from "../../context/PomodoroContext";
import { shuffle } from "../../lib/shuffle";
import SeleccionAreaModal from "../Examen/SeleccionAreaModal";
import "katex/dist/katex.min.css";

const OPCIONES_BUSQUEDA = manifest.cursos.flatMap((curso) => [
  { type: "curso", nombre: curso.nombre },
  ...curso.temas.map((tema) => ({
    type: "tema",
    curso: curso.nombre,
    tema: tema.tema,
    archivo: tema.archivo
  }))
]);

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


function adaptarEjerciciosAparte(data) {
  if (!data || !Array.isArray(data.ejercicios) || data.ejercicios.length === 0) {
    return data;
  }
  const ejercicios = data.ejercicios;
  const theory = (data.theory || []).filter(
    (seccion) => seccion?.titulo !== "Ejercicios"
  );
  const totalPuntosTeoria = theory.reduce(
    (total, seccion) => total + (seccion.puntos?.length || 0),
    0
  );
  const examenTeoria = Array.from(
    { length: totalPuntosTeoria },
    (_, i) => (data.examen || [])[i] ?? null
  );
  return {
    ...data,
    theory: [
      ...theory,
      {
        titulo: "Ejercicios",
        puntos: ejercicios.map((_, i) => ({
          texto: `Ejercicio ${i + 1}`,
          explicacion: ""
        }))
      }
    ],
    examen: [...examenTeoria, ...ejercicios]
  };
}

export default function MiEstudioPage() {
  const [topicData, setTopicData] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [, setLoading] = useState(false);
  const [, setError] = useState("");
  const [flatPuntos, setFlatPuntos] = useState([]);
  const puntosBuscables = useMemo(
    () => flatPuntos.filter((p) => p.seccionTitulo !== "Ejercicios"),
    [flatPuntos]
  );
  const puntosTeoria = puntosBuscables;

  const [teoriaVistaIndex, setTeoriaVistaIndex] = useState(0);

  const seccionesAgrupadas = useMemo(() => {
    const grupos = [];
    let tituloActual = null;
    let grupoActual = null;
    puntosTeoria.forEach(p => {
      if (p.seccionTitulo !== tituloActual) {
        tituloActual = p.seccionTitulo;
        grupoActual = { titulo: p.seccionTitulo, puntos: [] };
        grupos.push(grupoActual);
      }
      grupoActual.puntos.push(p);
    });
    return grupos;
  }, [puntosTeoria]);

  useEffect(() => {
    if (seccionesAgrupadas.length > 0 && teoriaVistaIndex >= seccionesAgrupadas.length) {
      setTeoriaVistaIndex(seccionesAgrupadas.length - 1);
    }
  }, [seccionesAgrupadas.length, teoriaVistaIndex]);

  const seccionActual = seccionesAgrupadas[teoriaVistaIndex] || null;

  const puntosEstables = useMemo(() => {
    return (topicData?.theory || []).flatMap((seccion, idxSeccion) =>
      seccion.puntos.map((p, idxPunto) => ({
        ...p,
        id: `${idxSeccion}-${idxPunto}`,
        seccionTitulo: seccion.titulo
      }))
    );
  }, [topicData]);
  const [preguntasFinalesIds, setPreguntasFinalesIds] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [ordenPreguntas, setOrdenPreguntas] = useState([]);
  const [posOrden, setPosOrden] = useState(0);
  const [maxUnlocked, setMaxUnlocked] = useState(0);
  const [stage, setStage] = useState("theory");
  const [isLevelMode, setIsLevelMode] = useState(false);
  const [textosSeleccionados, setTextosSeleccionados] = useState([]);
  const [textosCompletados, setTextosCompletados] = useState([]);
  const huboCambiosSinGuardarRef = useRef(false);
  const [mostrarCongratulations, setMostrarCongratulations] = useState(false);
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [temaProximoSalida, setTemaProximoSalida] = useState(null);
  const [destinoSalida, setDestinoSalida] = useState("tema");
  const [mostrarBarraTeoria, setMostrarBarraTeoria] = useState(false);
  const [mostrarBotonBuscador, setMostrarBotonBuscador] = useState(false);
  const barraTeoriaRef = useRef(null);
  const { setFooterHidden } = useFooterVisibility();

  useEffect(() => {
    const manejarScroll = () => {
      if (window.scrollY > 80) {
        setMostrarBotonBuscador(true);
      } else {
        setMostrarBotonBuscador(false);
        setMostrarBarraTeoria(false);
      }
    };
    window.addEventListener("scroll", manejarScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", manejarScroll);
    };
  }, []);

  useEffect(() => {
    if (!mostrarBarraTeoria) return;
    const manejarClickFuera = (e) => {
      if (
        barraTeoriaRef.current &&
        !barraTeoriaRef.current.contains(e.target)
      ) {
        setMostrarBarraTeoria(false);
      }
    };
    document.addEventListener("pointerdown", manejarClickFuera);
    return () => {
      document.removeEventListener("pointerdown", manejarClickFuera);
    };
  }, [mostrarBarraTeoria]);

  useEffect(() => {
    const ocultar = Boolean(topicData) && (stage === "theory" || stage === "question");
    setFooterHidden(ocultar);
    return () => setFooterHidden(false);
  }, [topicData, stage, setFooterHidden]);

  useEffect(() => {
    if (!topicData?.curso || !topicData?.tema) return;
    const idsTeoriaNormal = flatPuntos
      .filter((p) => p.seccionTitulo !== "Ejercicios")
      .map((p) => p.id);
    const total = idsTeoriaNormal.length;
    if (total === 0) return;
    const correctas = textosCompletados.filter((id) => idsTeoriaNormal.includes(id)).length;
    const tercio = total / 3;
    const estrellas = Math.min(3, Math.floor(correctas / tercio));
    const claveTema = `${topicData.curso}_${topicData.tema}`;
    let todasLasEstrellas = {};
    try {
      todasLasEstrellas = JSON.parse(localStorage.getItem("estrellasTemas") || "{}");
    } catch {
      todasLasEstrellas = {};
    }
    const actual = todasLasEstrellas[claveTema];
    if (!actual || actual.estrellas !== estrellas || actual.correctas !== correctas || actual.total !== total) {
      todasLasEstrellas[claveTema] = { estrellas, correctas, total };
      localStorage.setItem("estrellasTemas", JSON.stringify(todasLasEstrellas));
    }
  }, [textosCompletados, flatPuntos, topicData]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stage !== "theory" || (textosSeleccionados.length === 0 && textosCompletados.length === 0)) {
        return;
      }
      if (topicData?.archivo) {
        localStorage.setItem(
          `textos_${topicData.archivo}`,
          JSON.stringify({
            textos: textosSeleccionados,
            completados: textosCompletados
          })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stage, textosSeleccionados, textosCompletados, topicData?.archivo]);

  const [countdown, setCountdown] = useState(0);
  const [vidas, setVidas] = useState(5);
  const [alertaVidas, setAlertaVidas] = useState(null);
  const [modoExamenTema, setModoExamenTema] = useState(false);
  const [faseExamenTema, setFaseExamenTema] = useState("preguntas");
  const [titulosFinalesExamen, setTitulosFinalesExamen] = useState([]);
  const vidaPerderRef = useRef(null);
  const ceroVidasRef = useRef(null);
  const alertaNotificacionRef = useRef(null);

  useEffect(() => {
    if (!alertaVidas) return;
    const delay = alertaVidas === "cero" ? 2500 : 3200;
    const t = setTimeout(() => {
      setAlertaVidas(null);
      if (alertaVidas === "cero") setVidas(5);
    }, delay);
    return () => clearTimeout(t);
  }, [alertaVidas]);

  const [corazonRoto, setCorazonRoto] = useState(false);
  useEffect(() => {
    if (!alertaVidas) {
      setCorazonRoto(false);
      return;
    }
    const t = setTimeout(() => {
      setCorazonRoto(true);
    }, 700);
    return () => clearTimeout(t);
  }, [alertaVidas]);

  function renderCorazonesVidas() {
    return (
      <div className="vidas-fullscreen__hearts">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < vidas) {
            return <i key={i} className="bi bi-heart-fill vidas-fullscreen__heart is-full" />;
          }
          if (i === vidas) {
            return (
              <i
                key={i}
                className={`vidas-fullscreen__heart ${corazonRoto ? "bi bi-heartbreak is-roto" : "bi bi-heart-fill is-a-punto"}`}
              />
            );
          }
          return <i key={i} className="bi bi-heartbreak vidas-fullscreen__heart is-roto" />;
        })}
      </div>
    );
  }

  const [examenPreguntas, setExamenPreguntas] = useState([]);
  const [nivelIndex, setNivelIndex] = useState(0);
  const [nivelMaxUnlocked, setNivelMaxUnlocked] = useState(0);
  const [, setNivelCompletions] = useState({});
  const [, setUltimoFlipIndex] = useState(0);
  const [isFlipQuiz, setIsFlipQuiz] = useState(false);
  const [quizBatch, setQuizBatch] = useState([]);
  const [quizPos, setQuizPos] = useState(0);
  const [preguntasVistas, setPreguntasVistas] = useState({});
  const [seenQuestionsOpen, setSeenQuestionsOpen] = useState(false);
  const [repasoQuizActivo, setRepasoQuizActivo] = useState(false);
  const [repasoQuizBatch, setRepasoQuizBatch] = useState([]);
  const [repasoQuizPos, setRepasoQuizPos] = useState(0);
  const [repasoDesdeTeoria, setRepasoDesdeTeoria] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [avisoContinuarVacio, setAvisoContinuarVacio] = useState(false);
  const avisoContinuarVacioTimeoutRef = useRef(null);

  function mostrarAvisoContinuarVacio() {
    clearTimeout(avisoContinuarVacioTimeoutRef.current);
    setAvisoContinuarVacio(true);
    avisoContinuarVacioTimeoutRef.current = setTimeout(
      () => setAvisoContinuarVacio(false),
      2500
    );
  }

  useEffect(() => {
    return () => clearTimeout(avisoContinuarVacioTimeoutRef.current);
  }, []);

  const [temasOpen, setTemasOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [preguntasFalladas, setPreguntasFalladas] = useState({});
  const [questionResult, setQuestionResult] = useState(null);
  const [attemptKey, setAttemptKey] = useState(0);
  const [, setLevelCompletions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useLocalStorage("miEstudio_nombreUsuario", null);
  const [preguntaModoAbierta, setPreguntaModoAbierta] = useState(false);
  const [modoEstudio, setModoEstudio] = useState("completo");
  const [esModoAdicionales, setEsModoAdicionales] = useState(false);
  const [pomodoroAlarmaAbierta, setPomodoroAlarmaAbierta] = useState(false);
  const [pomodoroAlarmaLabel, setPomodoroAlarmaLabel] = useState("");
  const pomodoroEstuvoCorriendoRef = useRef(false);
  const pomodoro = usePomodoro();

  useEffect(() => {
    if (pomodoro.isRunning) {
      pomodoroEstuvoCorriendoRef.current = true;
      return;
    }
    if (pomodoroEstuvoCorriendoRef.current && pomodoro.secondsLeft === 0) {
      setPomodoroAlarmaLabel(pomodoro.label || "");
      setPomodoroAlarmaAbierta(true);
    }
    pomodoroEstuvoCorriendoRef.current = false;
  }, [pomodoro.isRunning, pomodoro.secondsLeft, pomodoro.label]);

  function irAPomodoroDesdeAlarma() {
    setPomodoroAlarmaAbierta(false);
    limpiarPomodoroCompartido();
    if (topicData?.tema) guardarRetorno(topicData.tema);
    navigate("/pomodoro");
  }

  const { guardarBusqueda: guardarBusquedaInicio } = useSearchHistory();
  const [repasoGuardadoMsg, setRepasoGuardadoMsg] = useState(false);
  const [repasoGuardadoSaliendo, setRepasoGuardadoSaliendo] = useState(false);
  const repasoGuardadoTimers = useRef([]);
  const [sinPreguntaAlerta, setSinPreguntaAlerta] = useState(false);
  const [sinSeleccionAlerta, setSinSeleccionAlerta] = useState(false);
  const [faltaCompletarTeoria, setFaltaCompletarTeoria] = useState(false);
  const [sinPreguntaSaliendo, setSinPreguntaSaliendo] = useState(false);
  const sinPreguntaTimers = useRef([]);
  const [confirmGuardarRepasoFinal, setConfirmGuardarRepasoFinal] = useState(false);
  // Solo en memoria: al no persistir en storage, el toast vuelve a
  // mostrarse en cada recarga de la página (F5), en vez de una sola vez.
  const [pantallaToastVisto, setPantallaToastVisto] = useState(false);
  const [pantallaToastVisible, setPantallaToastVisible] = useState(false);
  const [pantallaToastSaliendo, setPantallaToastSaliendo] = useState(false);
  const pantallaToastTimers = useRef([]);

  function cerrarPantallaToast() {
    setPantallaToastSaliendo(true);
    setPantallaToastVisto(true);
    pantallaToastTimers.current.push(
      setTimeout(() => {
        setPantallaToastVisible(false);
        setPantallaToastSaliendo(false);
      }, 300)
    );
  }

  useEffect(() => {
    if (sinPreguntaAlerta && alertaNotificacionRef.current) {
      alertaNotificacionRef.current.currentTime = 0;
      alertaNotificacionRef.current.play().catch((err) => {
        console.error("Error al reproducir sonido de alerta:", err);
      });
    }
  }, [sinPreguntaAlerta]);

  useEffect(() => {
    return () => {
      repasoGuardadoTimers.current.forEach(clearTimeout);
      sinPreguntaTimers.current.forEach(clearTimeout);
      pantallaToastTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (pantallaToastVisto || isFullscreen) return;
    const t = setTimeout(() => setPantallaToastVisible(true), 700);
    return () => clearTimeout(t);
  }, [pantallaToastVisto, isFullscreen]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    let timer = null;
    if (stage === "question" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage, countdown]);

  useEffect(() => {
    if (topicData) {
      localStorage.setItem(`ultimaCard_${topicData.curso}_${topicData.tema}`, cardIndex.toString());
    }
  }, [cardIndex, topicData]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error al entrar en pantalla completa:", err);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  async function abrirTema(item) {
    window.scrollTo(0, 0);
    setLoading(true);
    setError("");
    localStorage.setItem(
      "ultimoTemaAbierto",
      JSON.stringify({ curso: item.curso, tema: item.tema, archivo: item.archivo })
    );
    try {
      const res = await fetch(import.meta.env.BASE_URL + item.archivo);
      if (!res.ok) throw new Error("No se encontró el archivo del tema");
      const data = adaptarEjerciciosAparte(await res.json());
      const puntos = (data.theory || []).flatMap((seccion, idxSeccion) =>
        seccion.puntos.map((p, idxPunto) => ({
          ...p,
          id: `${idxSeccion}-${idxPunto}`,
          seccionTitulo: seccion.titulo
        }))
      );
      const examenList = data.examen || [];
      const storageCompletionsKey = `completions_${item.curso}_${item.tema}`;
      const storedCompletions = JSON.parse(localStorage.getItem(storageCompletionsKey) || "{}");
      setLevelCompletions(storedCompletions);
      const storageMaxUnlKey = `maxUnlocked_${item.curso}_${item.tema}`;
      const storedMax = parseInt(localStorage.getItem(storageMaxUnlKey) || "0", 10);
      setMaxUnlocked(storedMax);
      const storageNivelCompletionsKey = `examenCompletions_${item.curso}_${item.tema}`;
      const storedNivelCompletions = JSON.parse(localStorage.getItem(storageNivelCompletionsKey) || "{}");
      setNivelCompletions(storedNivelCompletions);
      const storageNivelMaxKey = `examenMaxUnlocked_${item.curso}_${item.tema}`;
      const storedNivelMax = parseInt(localStorage.getItem(storageNivelMaxKey) || "0", 10);
      setNivelMaxUnlocked(storedNivelMax);
      setExamenPreguntas(examenList);
      setNivelIndex(0);
      const storageUltimaCardKey = `ultimaCard_${item.curso}_${item.tema}`;
      let cardInicial = parseInt(localStorage.getItem(storageUltimaCardKey) || "0", 10);
      if (cardInicial >= puntos.length) cardInicial = 0;
      const storagePreguntasVistasKey = `preguntasVistas_${item.curso}_${item.tema}`;
      const storedPreguntasVistas = JSON.parse(localStorage.getItem(storagePreguntasVistasKey) || "{}");
      setPreguntasVistas(storedPreguntasVistas);
      setTextosSeleccionados([]);
      setTextosCompletados([]);
      setTeoriaVistaIndex(0);
      setEsModoAdicionales(false);
      huboCambiosSinGuardarRef.current = false;
      const storageTextosKey = `textos_${item.archivo}`;
      const textosGuardados = localStorage.getItem(storageTextosKey);
      if (textosGuardados) {
        try {
          const { textos, completados } = JSON.parse(textosGuardados);
          setTextosSeleccionados(textos || []);
          setTextosCompletados(completados || []);
        } catch { }
      }
      setTopicData({ ...data, curso: item.curso, tema: item.tema, archivo: item.archivo });
      setFlatPuntos(puntos);
      setCardIndex(cardInicial);
      setUltimoFlipIndex(cardInicial);
      setIsFlipQuiz(false);
      setQuizBatch([]);
      setQuizPos(0);
      setOrdenPreguntas([]);
      setPosOrden(0);
      setStage("theory");
      setModoEstudio("completo");
      setIsLevelMode(false);
      setScore(0);
      setWrongCount(0);
      setPreguntasFalladas({});
      setQuestionResult(null);
      setAttemptKey(0);
      setSearchOpen(false);
      setCountdown(0);
      setVidas(5);
      setAlertaVidas(null);
      setSinPreguntaAlerta(false);
      setPreguntaModoAbierta(true);
    } catch (e) {
      console.error("Error en abrirTema:", e);
      setError(`No pude cargar "${item.tema}". (${e.message})`);
    } finally {
      setLoading(false);
    }
  }

  async function generarCuestionarioDECO() {
    if (!topicData) return;
    const teoria = (topicData.theory || [])
      .map((seccion) => {
        const titulo = seccion?.titulo || "";
        const puntos = (seccion?.puntos || [])
          .map((punto) => {
            const texto = punto?.texto || "";
            return texto;
          })
          .filter(Boolean)
          .join("\n\n");
        return [titulo, puntos].filter(Boolean).join("\n\n");
      })
      .filter(Boolean)
      .join("\n\n");
    const prompt = `Actúa como profesor experto en admisión UNMSM.
Genera 20 preguntas de opción múltiple con estilo DECO utilizando EXCLUSIVAMENTE la teoría proporcionada.
REGLAS:
- 20 preguntas.
- Cada pregunta debe tener 5 alternativas: A, B, C, D y E.
- Prioriza situaciones, aplicación, análisis, relaciones, causa-efecto, interpretación y comparación.
- Evita preguntas de definición directa cuando sea posible.
- Los distractores deben ser plausibles.
- Distribuye las preguntas por todo el contenido.
- No repitas innecesariamente un mismo concepto.
- Nivel preuniversitario.
- Enfoque tipo examen de admisión UNMSM.
- Indica la respuesta correcta y una explicación breve después de cada pregunta.
- No agregues información que no esté respaldada por la teoría.
CURSO:
${topicData.curso || ""}
TEMA:
${topicData.tema || ""}
TEORÍA:
${teoria}`;
    try {
      await navigator.clipboard.writeText(prompt);
      window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("No se pudo copiar el cuestionario:", error);
      window.open(
        `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  function pedirAbrirTema(item) {
    const hayCambiosSinGuardar =
      stage === "theory" &&
      topicData?.archivo &&
      topicData.archivo !== item.archivo &&
      huboCambiosSinGuardarRef.current;
    if (hayCambiosSinGuardar) {
      setTemaProximoSalida(item);
      setDestinoSalida("tema");
      setMostrarConfirmacionSalida(true);
      return;
    }
    abrirTema(item);
  }

  function irADestinoSalida() {
    if (destinoSalida === "inicio") {
      setTopicData(null);
      setStage("theory");
    } else if (temaProximoSalida) {
      abrirTema(temaProximoSalida);
    }
    setTemaProximoSalida(null);
  }

  function handleGuardarYSalir() {
    if (topicData?.archivo) {
      localStorage.setItem(
        `textos_${topicData.archivo}`,
        JSON.stringify({ textos: textosSeleccionados, completados: textosCompletados })
      );
    }
    huboCambiosSinGuardarRef.current = false;
    setMostrarConfirmacionSalida(false);
    irADestinoSalida();
  }

  function handleSalirSinGuardar() {
    huboCambiosSinGuardarRef.current = false;
    setMostrarConfirmacionSalida(false);
    irADestinoSalida();
  }

  function handleCancelarSalida() {
    setMostrarConfirmacionSalida(false);
    setTemaProximoSalida(null);
  }

  function seleccionarItem(item) {
    if (item.type === "contenido") {
      const secIndex = seccionesAgrupadas.findIndex(
        (sec) => sec.puntos.some((p) => p.id === item.puntoId)
      );
      if (secIndex !== -1) {
        setTeoriaVistaIndex(secIndex);
      }
      setSearchOpen(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const contenedorPunto = document.getElementById(`punto-${item.puntoId}`);
          contenedorPunto?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
          const selectorCampo =
            item.campo === "explicacion"
              ? ".teoria-explicacion-extra__texto"
              : ".teoria-contenido-principal";
          const contenedorCampo =
            contenedorPunto?.querySelector(selectorCampo);
          if (item.matchText && contenedorCampo) {
            resaltarPalabraTemporal(contenedorCampo, item.matchText);
          } else if (contenedorCampo) {
            flashearFondoTemporal(contenedorCampo);
          }
        });
      });
      return;
    }
    guardarBusquedaInicio(item);
    if (item.type === "curso") {
      setCursoSeleccionado(item.nombre);
      setTemasOpen(true);
      setSearchOpen(false);
    } else {
      setCursoSeleccionado(item.curso);
      setTemasOpen(false);
      pedirAbrirTema(item);
    }
  }

  const teoriaCompleta = useMemo(() => {
    const idsTeoriaNormal = flatPuntos
      .filter((p) => p.seccionTitulo !== "Ejercicios")
      .map((p) => p.id);
    return idsTeoriaNormal.length === 0 || idsTeoriaNormal.every((id) => textosSeleccionados.includes(id));
  }, [flatPuntos, textosSeleccionados]);

  function intentarCompletarTema() {
    if (!teoriaCompleta) {
      sinPreguntaTimers.current.forEach(clearTimeout);
      setSinSeleccionAlerta(false);
      setFaltaCompletarTeoria(true);
      setSinPreguntaSaliendo(false);
      setSinPreguntaAlerta(true);
      sinPreguntaTimers.current = [
        setTimeout(() => setSinPreguntaSaliendo(true), 4000),
        setTimeout(() => {
          setSinPreguntaAlerta(false);
          setSinPreguntaSaliendo(false);
        }, 4300)
      ];
      return;
    }
    finalizarTema();
  }

  function elegirModoEstudio(modo, opts = {}) {
    setPreguntaModoAbierta(false);
    setEsModoAdicionales(!!opts.soloAdicionales);
    if (modo === "solo_preguntas") {
      const originalExamen = topicData?.examen || [];
      let preguntasFinales = [];
      let idsFinales = [];
      let titulosFinales = [];
      if (opts.soloAdicionales) {
        const itemsFinales = flatPuntos
          .map((p, i) => ({ punto: p, pregunta: originalExamen[i] }))
          .filter((x) => x.pregunta && x.punto?.seccionTitulo === "Ejercicios");
        preguntasFinales = itemsFinales.map((x) => x.pregunta);
        idsFinales = itemsFinales.map((x) => x.punto.id);
        titulosFinales = itemsFinales.map((x) => x.punto.seccionTitulo);
      } else if (opts.seleccionEspecifica) {
        const itemsFinales = flatPuntos
          .map((p, i) => ({ id: p.id, pregunta: originalExamen[i], titulo: p.seccionTitulo }))
          .filter((p) => p.pregunta && opts.seleccionEspecifica.includes(p.id));
        preguntasFinales = itemsFinales.map((p) => p.pregunta);
        idsFinales = itemsFinales.map((p) => p.id);
        titulosFinales = itemsFinales.map((p) => p.titulo);
      } else if (opts.requiereSeleccion) {
        if (textosSeleccionados.length === 0) {
          sinPreguntaTimers.current.forEach(clearTimeout);
          setSinSeleccionAlerta(true);
          setFaltaCompletarTeoria(false);
          setSinPreguntaSaliendo(false);
          setSinPreguntaAlerta(true);
          sinPreguntaTimers.current = [
            setTimeout(() => setSinPreguntaSaliendo(true), 4000),
            setTimeout(() => {
              setSinPreguntaAlerta(false);
              setSinPreguntaSaliendo(false);
            }, 4300)
          ];
          return;
        }
        const itemsPuntos = flatPuntos.map((p, i) => ({ id: p.id, pregunta: originalExamen[i], titulo: p.seccionTitulo }));
        const itemsVinculadosTeoria = itemsPuntos.filter((p) => p.pregunta && textosSeleccionados.includes(p.id));
        const itemsFinales = itemsVinculadosTeoria.length > 0 ? itemsVinculadosTeoria : itemsPuntos.filter((p) => p.pregunta);
        preguntasFinales = itemsFinales.map((p) => p.pregunta);
        idsFinales = itemsFinales.map((p) => p.id);
        titulosFinales = itemsFinales.map((p) => p.titulo);
      } else {
        const itemsFinales = flatPuntos
          .map((p, i) => ({ id: p.id, pregunta: originalExamen[i], titulo: p.seccionTitulo }))
          .filter((p) => p.pregunta);
        preguntasFinales = itemsFinales.map((p) => p.pregunta);
        idsFinales = itemsFinales.map((p) => p.id);
        titulosFinales = itemsFinales.map((p) => p.titulo);
      }
      if (preguntasFinales.length === 0) {
        sinPreguntaTimers.current.forEach(clearTimeout);
        setSinSeleccionAlerta(false);
        setFaltaCompletarTeoria(false);
        setSinPreguntaSaliendo(false);
        setSinPreguntaAlerta(true);
        sinPreguntaTimers.current = [
          setTimeout(() => setSinPreguntaSaliendo(true), 4000),
          setTimeout(() => {
            setSinPreguntaAlerta(false);
            setSinPreguntaSaliendo(false);
          }, 4300)
        ];
        setModoEstudio("completo");
        setStage("theory");
        return;
      }
      setExamenPreguntas(preguntasFinales);
      setPreguntasFinalesIds(idsFinales);
      setTitulosFinalesExamen(titulosFinales);
      setModoExamenTema(!opts.seleccionEspecifica && !opts.soloAdicionales);
      if (!opts.seleccionEspecifica && !opts.soloAdicionales) {
        setFaseExamenTema("preguntas");
      }
      const orden = shuffle(Array.from({ length: preguntasFinales.length }, (_, i) => i));
      setOrdenPreguntas(orden);
      setPosOrden(0);
      setCardIndex(orden[0] ?? 0);
      setModoEstudio("solo_preguntas");
      setStage("question");
      setIsFlipQuiz(false);
      setCountdown(0);
      setQuestionResult(null);
      setAttemptKey(0);
    }
  }

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [simulacroModalOpen, setSimulacroModalOpen] = useState(false);

  useEffect(() => {
    let q = searchParams.get("q");
    if (!q) {
      const temaPendiente = leerYLimpiarRetorno();
      if (temaPendiente) q = temaPendiente;
    }
    if (!q) return;
    const qNorm = normalizarTexto(q);
    const temaMatch = OPCIONES_BUSQUEDA.find(
      (item) => item.type === "tema" && normalizarTexto(item.tema) === qNorm
    );
    const cursoMatch = OPCIONES_BUSQUEDA.find(
      (item) => item.type === "curso" && normalizarTexto(item.nombre) === qNorm
    );
    if (temaMatch) {
      seleccionarItem(temaMatch);
    } else if (cursoMatch) {
      seleccionarItem(cursoMatch);
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  function avanzarCard() {
    if (stage === "theory") return;
    if (repasoQuizActivo) {
      if (repasoQuizPos < repasoQuizBatch.length - 1) {
        setRepasoQuizPos(repasoQuizPos + 1);
        setQuestionResult(null);
        setAttemptKey((k) => k + 1);
      } else {
        salirDeRepaso();
      }
      return;
    }
    if (isLevelMode) {
      if (nivelIndex < examenPreguntas.length - 1) {
        setNivelIndex(nivelIndex + 1);
        setQuestionResult(null);
        setAttemptKey(0);
      } else {
        finalizarTema();
      }
      return;
    }
    if (isFlipQuiz) {
      if (quizPos < quizBatch.length - 1) {
        setQuizPos(quizPos + 1);
        setQuestionResult(null);
        setAttemptKey((k) => k + 1);
      } else {
        setIsFlipQuiz(false);
        setUltimoFlipIndex(cardIndex + 1);
        setQuestionResult(null);
        setAttemptKey((k) => k + 1);
        setCountdown(0);
        if (cardIndex < flatPuntos.length - 1) {
          setCardIndex(cardIndex + 1);
          setStage("theory");
        } else {
          finalizarTema();
        }
      }
      return;
    }
    if (modoEstudio === "solo_preguntas") {
      if (posOrden < ordenPreguntas.length - 1) {
        const siguientePos = posOrden + 1;
        setPosOrden(siguientePos);
        setCardIndex(ordenPreguntas[siguientePos]);
        setStage("question");
        setIsLevelMode(false);
        setQuestionResult(null);
        setAttemptKey(0);
        setCountdown(0);
      } else {
        finalizarTema();
      }
      return;
    }
    if (cardIndex < flatPuntos.length - 1) {
      setCardIndex(cardIndex + 1);
      setStage("theory");
      setIsLevelMode(false);
      setQuestionResult(null);
      setAttemptKey(0);
      setCountdown(0);
    } else {
      finalizarTema();
    }
  }

  function retrocederCard() {
    if (stage === "theory") return;
    if (repasoQuizActivo) {
      if (repasoQuizPos > 0) {
        setRepasoQuizPos(repasoQuizPos - 1);
        setQuestionResult(null);
        setAttemptKey((k) => k + 1);
      }
      return;
    }
    if (isLevelMode) {
      if (nivelIndex > 0) {
        setNivelIndex(nivelIndex - 1);
        setQuestionResult(null);
        setAttemptKey(0);
      }
      return;
    }
    if (isFlipQuiz) {
      if (quizPos > 0) {
        setQuizPos(quizPos - 1);
        setQuestionResult(null);
        setAttemptKey((k) => k + 1);
      }
      return;
    }
    if (modoEstudio === "solo_preguntas") {
      if (posOrden > 0) {
        const anteriorPos = posOrden - 1;
        setPosOrden(anteriorPos);
        setCardIndex(ordenPreguntas[anteriorPos]);
        setStage("question");
        setIsLevelMode(false);
        setQuestionResult(null);
        setAttemptKey(0);
        setCountdown(0);
      }
      return;
    }
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
      setStage("theory");
      setIsLevelMode(false);
      setQuestionResult(null);
      setAttemptKey(0);
      setCountdown(0);
    }
  }

  function reintentarPregunta() {
    setQuestionResult(null);
    setAttemptKey((k) => k + 1);
  }

  function finalizarTema() {
    if (esModoAdicionales) {
      const idsEjercicios = flatPuntos
        .filter((p) => p.seccionTitulo === "Ejercicios")
        .map((p) => p.id);
      huboCambiosSinGuardarRef.current = true;
      setTextosSeleccionados((prev) => [...prev, ...idsEjercicios.filter((id) => !prev.includes(id))]);
    }
    if (!teoriaCompleta) {
      setStage("theory");
      setIsLevelMode(false);
      return;
    }
    setStage("finished");
    setConfirmGuardarRepasoFinal(true);
    setMostrarCongratulations(true);
    if (topicData) {
      const completados = JSON.parse(localStorage.getItem("temasCompletados") || "[]");
      const id = `${topicData.curso}_${topicData.tema}`;
      if (!completados.includes(id)) {
        completados.push(id);
        localStorage.setItem("temasCompletados", JSON.stringify(completados));
      }
    }
  }

  function volverATeoriaDesdeExamenTema() {
    setModoExamenTema(false);
    setStage("theory");
  }

  function finalizarTemaDesdeExamen() {
    setModoExamenTema(false);
    setStage("finished");
    setConfirmGuardarRepasoFinal(true);
    setMostrarCongratulations(true);
    if (topicData) {
      const completados = JSON.parse(localStorage.getItem("temasCompletados") || "[]");
      const id = `${topicData.curso}_${topicData.tema}`;
      if (!completados.includes(id)) {
        completados.push(id);
        localStorage.setItem("temasCompletados", JSON.stringify(completados));
      }
    }
  }

  function confirmarGuardarRepasoFinal(guardar) {
    if (guardar && topicData) {
      registrarCursoCompletado({ subject: topicData.curso, tema: topicData.tema });
    }
    setConfirmGuardarRepasoFinal(false);
  }

  const [botonArmado, setBotonArmado] = useState(null);

  function manejarBotonConfig(key, accion) {
    if (botonArmado === key) {
      accion();
      setBotonArmado(null);
    } else {
      setBotonArmado(key);
    }
  }

  function guardarParaRepaso() {
    if (!topicData) return;
    registrarCursoCompletado({ subject: topicData.curso, tema: topicData.tema });
    repasoGuardadoTimers.current.forEach(clearTimeout);
    setRepasoGuardadoSaliendo(false);
    setRepasoGuardadoMsg(true);
    repasoGuardadoTimers.current = [
      setTimeout(() => setRepasoGuardadoSaliendo(true), 1800),
      setTimeout(() => {
        setRepasoGuardadoMsg(false);
        setRepasoGuardadoSaliendo(false);
      }, 2100)
    ];
  }

  function gameOver() {
    if (!topicData) return;
    localStorage.removeItem(`completions_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`maxUnlocked_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`examenCompletions_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`examenMaxUnlocked_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`ultimaCard_${topicData.curso}_${topicData.tema}`);
    setLevelCompletions({});
    setMaxUnlocked(0);
    setNivelCompletions({});
    setNivelMaxUnlocked(0);
    setCardIndex(0);
    setNivelIndex(0);
    setStage("theory");
    setIsLevelMode(false);
    setScore(0);
    setWrongCount(0);
    setPreguntasFalladas({});
    setQuestionResult(null);
    setAttemptKey(0);
    setCountdown(0);
  }

  function rendirsePregunta() {
    setQuestionResult({ isCorrect: false, rendido: true, vidasEnEsteIntento: vidas });
    let vistaKeyRendido = null;
    let vistaPreguntaRendido = null;
    if (isFlipQuiz) {
      const item = quizBatch[quizPos];
      if (item) {
        vistaKeyRendido = `ex-${item.puntoIndex}`;
        vistaPreguntaRendido = item.pregunta;
      }
    } else if (isLevelMode) {
      vistaKeyRendido = `ex-${nivelIndex}`;
      vistaPreguntaRendido = examenPreguntas[nivelIndex] || null;
    } else if (modoEstudio === "solo_preguntas") {
      vistaKeyRendido = `ex-${cardIndex}`;
      vistaPreguntaRendido = examenPreguntas[cardIndex] || null;
    } else {
      vistaKeyRendido = `pt-${cardIndex}`;
      vistaPreguntaRendido = flatPuntos[cardIndex]?.pregunta || null;
    }
    if (vistaKeyRendido && vistaPreguntaRendido) {
      setPreguntasFalladas((prev) => ({
        ...prev,
        [vistaKeyRendido]: { pregunta: vistaPreguntaRendido }
      }));
    }
    setWrongCount((w) => w + 1);
  }

  function manejarRespuesta(correcto) {
    setQuestionResult({ isCorrect: correcto, vidasEnEsteIntento: vidas });
    let vistaKey = null;
    let vistaPregunta = null;
    if (isFlipQuiz) {
      const item = quizBatch[quizPos];
      if (item) {
        vistaKey = `ex-${item.puntoIndex}`;
        vistaPregunta = item.pregunta;
      }
    } else if (isLevelMode) {
      vistaKey = `ex-${nivelIndex}`;
      vistaPregunta = examenPreguntas[nivelIndex] || null;
    } else if (modoEstudio === "solo_preguntas") {
      vistaKey = `ex-${cardIndex}`;
      vistaPregunta = examenPreguntas[cardIndex] || null;
    } else {
      vistaKey = `pt-${cardIndex}`;
      vistaPregunta = flatPuntos[cardIndex]?.pregunta || null;
    }
    if (vistaKey && vistaPregunta && topicData) {
      setPreguntasVistas((prev) => {
        if (prev[vistaKey]) return prev;
        const next = { ...prev, [vistaKey]: { pregunta: vistaPregunta } };
        localStorage.setItem(`preguntasVistas_${topicData.curso}_${topicData.tema}`, JSON.stringify(next));
        return next;
      });
    }
    if (correcto) {
      setScore((s) => s + 1);
      let puntoIdRespondido = null;
      if (modoEstudio === "solo_preguntas" && preguntasFinalesIds[cardIndex]) {
        puntoIdRespondido = preguntasFinalesIds[cardIndex];
      } else if (isFlipQuiz) {
        const item = quizBatch[quizPos];
        puntoIdRespondido = item ? flatPuntos[item.puntoIndex]?.id || null : null;
      } else if (!isLevelMode) {
        puntoIdRespondido = flatPuntos[cardIndex]?.id || null;
      }
      const puntoRespondido = puntoIdRespondido
        ? flatPuntos.find((p) => p.id === puntoIdRespondido)
        : null;
      if (puntoIdRespondido && puntoRespondido?.seccionTitulo !== "Ejercicios") {
        huboCambiosSinGuardarRef.current = true;
        setTextosCompletados((prev) => (prev.includes(puntoIdRespondido) ? prev : [...prev, puntoIdRespondido]));
        setTextosSeleccionados((prev) => {
          if (prev.includes(puntoIdRespondido)) return prev;
          const newSelection = [...prev, puntoIdRespondido];
          const idsTeoriaNormal = flatPuntos
            .filter((p) => p.seccionTitulo !== "Ejercicios")
            .map((p) => p.id);
          if (idsTeoriaNormal.length > 0 && idsTeoriaNormal.every((id) => newSelection.includes(id))) {
            setMostrarCongratulations(true);
          }
          return newSelection;
        });
      }
      if (isLevelMode) {
        setNivelCompletions((prev) => {
          const newCompletions = { ...prev, [nivelIndex]: (prev[nivelIndex] || 0) + 1 };
          if (topicData) {
            localStorage.setItem(`examenCompletions_${topicData.curso}_${topicData.tema}`, JSON.stringify(newCompletions));
          }
          return newCompletions;
        });
        setNivelMaxUnlocked((m) => {
          const nextMax = nivelIndex === m ? m + 1 : m;
          if (topicData) {
            localStorage.setItem(`examenMaxUnlocked_${topicData.curso}_${topicData.tema}`, nextMax);
          }
          return nextMax;
        });
      } else {
        setLevelCompletions((prev) => {
          const newCompletions = { ...prev, [cardIndex]: (prev[cardIndex] || 0) + 1 };
          if (topicData) {
            localStorage.setItem(`completions_${topicData.curso}_${topicData.tema}`, JSON.stringify(newCompletions));
          }
          return newCompletions;
        });
        setMaxUnlocked((m) => {
          const nextMax = cardIndex === m ? m + 1 : m;
          if (topicData) {
            localStorage.setItem(`maxUnlocked_${topicData.curso}_${topicData.tema}`, nextMax);
          }
          return nextMax;
        });
      }
    } else {
      setWrongCount((w) => w + 1);
      if (vistaKey && vistaPregunta) {
        setPreguntasFalladas((prev) => ({
          ...prev,
          [vistaKey]: { pregunta: vistaPregunta }
        }));
      }
      setVidas((prevVidas) => {
        const nuevasVidas = prevVidas - 1;
        if (nuevasVidas === 3) {
          setAlertaVidas("tres");
        } else if (nuevasVidas === 1) {
          setAlertaVidas("una");
        } else if (nuevasVidas <= 0) {
          setAlertaVidas("cero");
          if (ceroVidasRef.current) {
            ceroVidasRef.current.currentTime = 0;
            ceroVidasRef.current.play().catch(() => { });
          }
          gameOver();
        }
        if (nuevasVidas > 0 && vidaPerderRef.current) {
          vidaPerderRef.current.currentTime = 0;
          vidaPerderRef.current.play().catch(() => { });
        }
        return nuevasVidas;
      });
    }
  }

  function reiniciarTarjetas() {
    setCardIndex(0);
    setUltimoFlipIndex(0);
    setIsFlipQuiz(false);
    setQuizBatch([]);
    setQuizPos(0);
    setStage("theory");
    setQuestionResult(null);
    setAttemptKey(0);
    setCountdown(0);
    setConfigOpen(false);
    setConfirmLeave(false);
    setConfirmGuardarRepasoFinal(false);
    setBotonArmado(null);
  }

  function verPreguntasVistas() {
    const lote = Object.entries(preguntasVistas)
      .map(([key, val]) => {
        if (val && typeof val === "object" && val.pregunta) {
          return { key, pregunta: val.pregunta };
        }
        const i = Number(key);
        const pregunta = flatPuntos[i]?.pregunta;
        return pregunta ? { key, pregunta } : null;
      })
      .filter(Boolean);
    if (lote.length === 0) {
      sinPreguntaTimers.current.forEach(clearTimeout);
      setSinPreguntaSaliendo(false);
      setSinPreguntaAlerta(true);
      sinPreguntaTimers.current = [
        setTimeout(() => setSinPreguntaSaliendo(true), 1950),
        setTimeout(() => {
          setSinPreguntaAlerta(false);
          setSinPreguntaSaliendo(false);
        }, 2250)
      ];
      return;
    }
    setRepasoQuizBatch(shuffle(lote));
    setRepasoQuizPos(0);
    setRepasoQuizActivo(true);
    setQuestionResult(null);
    setAttemptKey((k) => k + 1);
    if (stage !== "question") {
      setRepasoDesdeTeoria(true);
      setStage("question");
    } else {
      setRepasoDesdeTeoria(false);
    }
  }

  function salirDeRepaso() {
    setRepasoQuizActivo(false);
    setQuestionResult(null);
    setAttemptKey((k) => k + 1);
    if (repasoDesdeTeoria) {
      setStage("theory");
      setRepasoDesdeTeoria(false);
    }
  }

  const [confirmSalirApp, setConfirmSalirApp] = useState(false);
  const [confirmAbandonarPregunta, setConfirmAbandonarPregunta] = useState(false);
  const temaExamenViewRef = useRef(null);

  function pedirAbandonarPregunta() {
    setConfirmAbandonarPregunta(true);
  }

  function cancelarAbandonarPregunta() {
    setConfirmAbandonarPregunta(false);
  }

  function confirmarAbandonarPregunta() {
    setConfirmAbandonarPregunta(false);
    if (modoExamenTema && stage === "question" && temaExamenViewRef.current) {
      temaExamenViewRef.current.finalizarAhora();
      return;
    }
    abandonarJuego();
  }

  function cancelarSalirApp() {
    setConfirmSalirApp(false);
  }

  function confirmarSalirApp() {
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()) {
      const AppPlugin = window.Capacitor.Plugins?.App;
      if (AppPlugin?.exitApp) {
        AppPlugin.exitApp();
        return;
      }
    }
    window.close();
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 300);
  }

  function irAInicio() {
    const hayCambiosSinGuardar =
      stage === "theory" && topicData?.archivo && huboCambiosSinGuardarRef.current;
    if (hayCambiosSinGuardar) {
      setTemaProximoSalida(null);
      setDestinoSalida("inicio");
      setMostrarConfirmacionSalida(true);
      return;
    }
    setTopicData(null);
    setStage("theory");
  }

  function abandonarJuego() {
    setStage("theory");
    setIsLevelMode(false);
    setQuestionResult(null);
    setAttemptKey(0);
    setConfigOpen(false);
    setConfirmLeave(false);
    setConfirmGuardarRepasoFinal(false);
    setBotonArmado(null);
    setCountdown(0);
  }

  const current = isLevelMode ? examenPreguntas[nivelIndex] : flatPuntos[cardIndex];
  const [musicaTeoriaOn, setMusicaTeoriaOn] = useState(false);
  const musicaTeoriaRef = useRef(null);
  const [preguntaChatGpt, setPreguntaChatGpt] = useState("");

  function enviarPreguntaChatGpt() {
    const pregunta = preguntaChatGpt.trim();
    if (!pregunta) return;
    const url = `https://chatgpt.com/?q=${encodeURIComponent(pregunta)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setPreguntaChatGpt("");
  }

  useEffect(() => {
    if (!musicaTeoriaRef.current) {
      const audio = new Audio(`${import.meta.env.BASE_URL}sonidos/Paperback_Rain.mp3`);
      audio.loop = true;
      audio.volume = 0.35;
      musicaTeoriaRef.current = audio;
    }
    return () => {
      if (musicaTeoriaRef.current) {
        musicaTeoriaRef.current.pause();
        musicaTeoriaRef.current.src = "";
        musicaTeoriaRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = musicaTeoriaRef.current;
    if (!audio) return;
    if (musicaTeoriaOn) {
      const resultado = audio.play();
      if (resultado && typeof resultado.catch === "function") {
        resultado.catch(() => { });
      }
    } else {
      audio.pause();
    }
  }, [musicaTeoriaOn]);

  const preguntaActual = repasoQuizActivo
    ? repasoQuizBatch[repasoQuizPos]?.pregunta || null
    : isLevelMode
      ? current
      : isFlipQuiz
        ? quizBatch[quizPos]?.pregunta || null
        : modoEstudio === "solo_preguntas"
          ? examenPreguntas[cardIndex] || null
          : null;

  const [modoPruebaAvance, setModoPruebaAvance] = useState(false);
  useEffect(() => {
    function alternar() {
      setModoPruebaAvance((actual) => {
        const nuevo = !actual;
        alert(
          nuevo
            ? "Modo prueba activado: ya puedes avanzar sin responder."
            : "Modo prueba desactivado."
        );
        return nuevo;
      });
    }
    window.addEventListener("mp-toggle", alternar);
    return () => window.removeEventListener("mp-toggle", alternar);
  }, []);

  const canAdvance =
    modoPruebaAvance ||
    stage !== "question" ||
    Boolean(questionResult && questionResult.isCorrect);

  const [hintBloqueoVisible, setHintBloqueoVisible] = useState(false);
  const hintBloqueoTimeoutRef = useRef(null);

  function mostrarHintBloqueo() {
    clearTimeout(hintBloqueoTimeoutRef.current);
    setHintBloqueoVisible(true);
    hintBloqueoTimeoutRef.current = setTimeout(() => setHintBloqueoVisible(false), 2000);
  }

  useEffect(() => {
    function onKeyDown(e) {
      const tagActivo = document.activeElement && document.activeElement.tagName;
      if (tagActivo === "INPUT" || tagActivo === "BUTTON" || tagActivo === "TEXTAREA") return;
      if (searchOpen || configOpen || temasOpen || !topicData) return;
      const tecla = e.key.toLowerCase();
      // =========================
      // NAVEGACIÓN DE TEORÍA
      // =========================
      if (stage === "theory" && !isLevelMode) {
        if (["arrowleft", "arrowup", "a", "w"].includes(tecla)) {
          e.preventDefault();
          setTeoriaVistaIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (["arrowright", "arrowdown", "d", "s"].includes(tecla)) {
          e.preventDefault();
          setTeoriaVistaIndex((i) =>
            Math.min(seccionesAgrupadas.length - 1, i + 1)
          );
          return;
        }
        // Enter → entrar al videojuego/examen
        if (tecla === "enter") {
          e.preventDefault();
          if (examenPreguntas.length > 0) {
            elegirModoEstudio("solo_preguntas", {
              requiereSeleccion: true
            });
          } else {
            finalizarTema();
          }
          return;
        }
      }
      // =========================
      // VIDEOJUEGO / PREGUNTAS
      // =========================
      if (stage === "question") {
        if (countdown > 0) return;
        // Enter → avanzar o reintentar
        if (tecla === "enter") {
          e.preventDefault();
          if (questionResult && questionResult.isCorrect) {
            avanzarCard();
          } else if (questionResult && !questionResult.isCorrect) {
            reintentarPregunta();
          }
          return;
        }
        // Espacio → avanzar si está permitido
        if (tecla === " ") {
          e.preventDefault();
          if (canAdvance) {
            avanzarCard();
          }
          return;
        }
        // Flecha izquierda → anterior
        if (tecla === "arrowleft") {
          e.preventDefault();
          retrocederCard();
          return;
        }
        // Flecha derecha → siguiente
        if (tecla === "arrowright") {
          e.preventDefault();
          if (canAdvance) {
            avanzarCard();
          }
          return;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    stage,
    questionResult,
    searchOpen,
    configOpen,
    temasOpen,
    topicData,
    canAdvance,
    isLevelMode,
    countdown,
    examenPreguntas,
    elegirModoEstudio,
    finalizarTema,
    avanzarCard,
    retrocederCard,
    reintentarPregunta,
    seccionesAgrupadas.length
  ]);

  useEffect(() => {
    function onKeyDown(e) {
      const tagActivo = document.activeElement && document.activeElement.tagName;
      if (tagActivo === "INPUT" || tagActivo === "BUTTON" || tagActivo === "TEXTAREA") return;
      if (searchOpen || configOpen || temasOpen || !topicData) return;
      if (stage === "question" && countdown > 0) return;
      if (e.key === "Enter") {
        if (stage === "theory" && !isLevelMode) {
          e.preventDefault();
          if (examenPreguntas.length > 0) {
            elegirModoEstudio("solo_preguntas", { requiereSeleccion: true });
          } else {
            finalizarTema();
          }
        } else if (stage === "question" && questionResult && questionResult.isCorrect) {
          e.preventDefault();
          avanzarCard();
        } else if (stage === "question" && questionResult && !questionResult.isCorrect) {
          e.preventDefault();
          reintentarPregunta();
        }
      } else if (e.key === " " || e.code === "Space") {
        if (stage === "question") {
          e.preventDefault();
          if (canAdvance) avanzarCard();
        }
      } else if (e.key === "ArrowLeft") {
        if (stage === "question") retrocederCard();
      } else if (e.key === "ArrowRight") {
        if (stage === "question" && canAdvance) avanzarCard();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    stage, questionResult, searchOpen, configOpen, temasOpen, topicData, cardIndex,
    flatPuntos, maxUnlocked, nivelIndex, examenPreguntas, nivelMaxUnlocked, canAdvance,
    isLevelMode, countdown, modoEstudio, ordenPreguntas, posOrden, isFlipQuiz, quizBatch,
    quizPos, repasoQuizActivo, repasoQuizBatch, repasoQuizPos
  ]);

  const recomendacionesHoyInicio = useMemo(
    () => obtenerRecomendacionesHoy(),
    []
  );

  let ultimoTemaInicio = null;
  try {
    ultimoTemaInicio = JSON.parse(localStorage.getItem("ultimoTemaAbierto"));
  } catch {
    ultimoTemaInicio = null;
  }

  const wrapClass = [
    "mi-estudio__wrap",
    stage === "question" ? "is-question" : topicData ? "has-topbar" : "is-home"
  ].join(" ");

  const progresoPregunta = repasoQuizActivo
    ? { current: repasoQuizPos + 1, total: repasoQuizBatch.length }
    : isLevelMode
      ? { current: nivelIndex + 1, total: examenPreguntas.length }
      : isFlipQuiz
        ? { current: quizPos + 1, total: quizBatch.length }
        : modoEstudio === "solo_preguntas"
          ? { current: posOrden + 1, total: ordenPreguntas.length }
          : { current: cardIndex + 1, total: flatPuntos.length };

  const nombreCursoActivo = cursoSeleccionado || (topicData ? topicData.curso : null);
  const cursoEncontrado = manifest.cursos.find((c) => c.nombre === nombreCursoActivo);
  const temasDelCurso = cursoEncontrado ? cursoEncontrado.temas : [];

  return (
    <div className="mi-estudio">
      <ModoEstudioModal open={preguntaModoAbierta} onElegir={elegirModoEstudio} />
      <PomodoroAlarmModal
        open={pomodoroAlarmaAbierta}
        label={pomodoroAlarmaLabel}
        onIrAPomodoro={irAPomodoroDesdeAlarma}
        onClose={() => {
          setPomodoroAlarmaAbierta(false);
          limpiarPomodoroCompartido();
        }}
      />
      {topicData && (
        <TopBar
          stage={
            modoExamenTema
              ? faseExamenTema === "resultados"
                ? "results"
                : "question"
              : stage
          }
          tema={topicData.tema}
          curso={topicData.curso}
          onAbrirBuscador={() => setSearchOpen(true)}
          onTogglePomodoroMini={() => setPomodoroMiniOpen((o) => !o)}
          onAbrirTemas={() => setTemasOpen(true)}
          onGuardarRepaso={guardarParaRepaso}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onAbandonarPregunta={pedirAbandonarPregunta}
          onIrInicio={irAInicio}
          pdfVerUrl={
            topicData?.archivo
              ? `${window.location.origin}${import.meta.env.BASE_URL}${topicData.archivo.replace(/^temas\//i, "PDFs/").replace(/\.json$/i, ".pdf")}`
              : null
          }
          pdfDescargaUrl={
            topicData?.archivo
              ? `${import.meta.env.BASE_URL}${topicData.archivo.replace(/^temas\//i, "PDFs/").replace(/\.json$/i, ".pdf")}`
              : null
          }
        />
      )}
      {pantallaToastVisible && (
        <div className={`repaso-toast is-top mi-estudio__pantalla-toast${pantallaToastSaliendo ? " is-saliendo" : ""}`}>
          <div className="mi-estudio__pantalla-toast-contenido">
            <i className="fas fa-expand" />
            <span>Pantalla compelta</span>
          </div>
          <div className="mi-estudio__pantalla-toast-acciones">
            <button
              type="button"
              className="mi-estudio__pantalla-toast-btn"
              onClick={() => {
                toggleFullscreen();
                cerrarPantallaToast();
              }}
            >
              Activar
            </button>
            <button
              type="button"
              className="mi-estudio__pantalla-toast-close"
              onClick={cerrarPantallaToast}
              aria-label="Cerrar"
              title="Cerrar"
            >
              <i className="fas fa-xmark" />
            </button>
          </div>
        </div>
      )}
      {repasoGuardadoMsg && (
        <div className={`repaso-toast is-success${repasoGuardadoSaliendo ? " is-saliendo" : ""}`}>
          <i className="fas fa-bookmark" /> Guardado para repasar
        </div>
      )}
      {sinPreguntaAlerta && (
        <div className={`repaso-toast is-top sin-pregunta-alerta${sinPreguntaSaliendo ? " is-saliendo" : ""}`}>
          <div className="sin-pregunta-alerta__contenido">
            <i className="fas fa-circle-info" />
            <span>
              {faltaCompletarTeoria
                ? "Dale check a toda la teoría antes de completar el tema"
                : sinSeleccionAlerta
                  ? "Tildá al menos un punto de teoría para ir al examen"
                  : <>No hay preguntas de "{topicData?.tema || "este tema"}"</>}
            </span>
          </div>
          <button
            type="button"
            className="sin-pregunta-alerta__close"
            onClick={() => {
              sinPreguntaTimers.current.forEach(clearTimeout);
              setSinPreguntaSaliendo(false);
              setSinPreguntaAlerta(false);
            }}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>
      )}
      <Modal open={confirmSalirApp} onClose={cancelarSalirApp}>
        <h3 className="tema-modal-title">¿Salir de la aplicación?</h3>
        <p className="tema-modal-subtitle">Vas a salir de la web/aplicación. Tu progreso ya quedó guardado.</p>
        <div className="tema-modal-actions">
          <button type="button" className="btn-solid" onClick={cancelarSalirApp}>Cancelar</button>
          <button type="button" className="btn-outline" onClick={confirmarSalirApp}>Sí, salir</button>
        </div>
      </Modal>
      <Modal open={confirmAbandonarPregunta} onClose={cancelarAbandonarPregunta} plain>
        <div className="retirada-modal">
          <h3 className="retirada-modal__title">Regresar a la teoría</h3>
          <p className="retirada-modal__subtitle">¿Ya te rendiste, perdedor?</p>
          <div className="retirada-modal__actions">
            <button type="button" className="retirada-modal__btn is-confirm" onClick={cancelarAbandonarPregunta}>Cancelar</button>
            <button type="button" className="retirada-modal__btn is-cancel" onClick={confirmarAbandonarPregunta}>Regresar</button>
          </div>
        </div>
      </Modal>
      <div className={`config-overlay ${configOpen ? "" : "is-closed"}`} aria-hidden={!configOpen}>
        <div className="config-overlay__panel">
          {confirmLeave && (
            <div className="config-overlay__confirm animate-bounce">Confirmar. Eres un perdedor.</div>
          )}
          <div className="config-overlay__row">
            <div className="config-overlay__item">
              <button
                onClick={() => manejarBotonConfig("continuar", () => {
                  setConfigOpen(false);
                  setConfirmLeave(false);
                  setBotonArmado(null);
                })}
                className={`config-overlay__btn ${botonArmado === "continuar" ? "is-armado" : ""}`}
              >
                <i className="fas fa-play" />
              </button>
              {botonArmado === "continuar" && <span className="config-overlay__label">Continuar</span>}
            </div>
            <div className="config-overlay__item">
              <button
                onClick={() => manejarBotonConfig("pantalla", toggleFullscreen)}
                className={`config-overlay__btn ${botonArmado === "pantalla" ? "is-armado" : ""}`}
              >
                <i className={`fas ${isFullscreen ? "fa-compress" : "fa-expand"}`} />
              </button>
              {botonArmado === "pantalla" && (
                <span className="config-overlay__label">{isFullscreen ? "Minimizar" : "Pantalla Completa"}</span>
              )}
            </div>
            <div className="config-overlay__item">
              <button
                onClick={() => manejarBotonConfig("repasar", verPreguntasVistas)}
                className={`config-overlay__btn ${botonArmado === "repasar" ? "is-armado" : ""}`}
              >
                <i className="fas fa-list-check" />
              </button>
              {botonArmado === "repasar" && <span className="config-overlay__label">Repasar</span>}
            </div>
            <div className="config-overlay__item">
              <button
                onClick={() => {
                  if (confirmLeave) abandonarJuego();
                  else setConfirmLeave(true);
                }}
                className={`config-overlay__btn ${confirmLeave ? "is-armado" : ""}`}
              >
                <i className="fas fa-door-open" />
              </button>
              {confirmLeave && <span className="config-overlay__label">Abandonar</span>}
            </div>
            <div className="config-overlay__item">
              <button
                onClick={() => manejarBotonConfig("reiniciar", reiniciarTarjetas)}
                className={`config-overlay__btn ${botonArmado === "reiniciar" ? "is-armado" : ""}`}
              >
                <i className="fas fa-rotate-left" />
              </button>
              {botonArmado === "reiniciar" && <span className="config-overlay__label">Reiniciar</span>}
            </div>
          </div>
        </div>
      </div>
      <div className={wrapClass}>
        {!topicData && (
          <>
            <AppHeader
              section="inicio"
              onAbrirBuscador={() => setSearchOpen(true)}
            />
            <div className="mi-estudio__home-screen container">
              <section className="mi-estudio__intro">
                <div className="mi-estudio__intro-content">
                  <h1 className="mi-estudio__intro-title">
                    Aprende y domina{" "}
                    <span className="mi-estudio__intro-highlight">cada tema</span>
                  </h1>
                  <div className="welcome-section__continuar-wrapper">
                    {avisoContinuarVacio && (
                      <span className="aviso-bloqueo">
                        No hay tema para continuar
                      </span>
                    )}
                    <button
                      type="button"
                      className="welcome-section__continuar-btn"
                      onClick={() => {
                        if (!ultimoTemaInicio) {
                          mostrarAvisoContinuarVacio();
                          return;
                        }
                        seleccionarItem({
                          type: "tema",
                          curso: ultimoTemaInicio.curso,
                          tema: ultimoTemaInicio.tema,
                          archivo: ultimoTemaInicio.archivo
                        });
                      }}
                    >
                      <span className="welcome-section__continuar-label">
                        Continuar:
                      </span>
                      <span className="welcome-section__continuar-tema">
                        {ultimoTemaInicio ? ultimoTemaInicio.tema : "..."}
                      </span>
                      <i className="bi bi-arrow-right welcome-section__continuar-arrow" />
                    </button>
                    <button
                      type="button"
                      className="welcome-section__simulacro-panel"
                      onClick={() => setSimulacroModalOpen(true)}
                      aria-label="Rendir simulacro"
                    >
                      <span className="welcome-section__simulacro-icon">
                        <i className="bi bi-bullseye"></i>
                      </span>
                      <span className="welcome-section__simulacro-info">
                        <strong>Rendir simulacro</strong>
                        <span>Pon a prueba tus conocimientos</span>
                      </span>
                    </button>
                  </div>
                </div>
              </section>
              <SeleccionAreaModal
                open={simulacroModalOpen}
                onClose={() => setSimulacroModalOpen(false)}
                onConfirmar={(area) => {
                  setSimulacroModalOpen(false);
                  navigate(`/examen?area=${area}`);
                }}
              />
            </div>
            {recomendacionesHoyInicio.length > 0 && (
              <div className="mi-estudio__recomendados container">
                <div className="mi-estudio__recomendados-fecha">
                  {(() => {
                    const ahora = new Date();
                    const objetivo = new Date(2027, 2, 15);
                    let meses =
                      (objetivo.getFullYear() - ahora.getFullYear()) * 12 +
                      (objetivo.getMonth() - ahora.getMonth());
                    const fechaMeses = new Date(ahora);
                    fechaMeses.setMonth(fechaMeses.getMonth() + meses);
                    if (fechaMeses > objetivo) {
                      meses--;
                      fechaMeses.setMonth(fechaMeses.getMonth() - 1);
                    }
                    const diasRestantes = Math.ceil(
                      (objetivo - fechaMeses) / (1000 * 60 * 60 * 24)
                    );
                    const semanas = Math.floor(diasRestantes / 7);
                    const dias = diasRestantes % 7;
                    return `${meses} meses · ${semanas} semanas · ${dias} días`;
                  })()}
                </div>
                <div className="mi-estudio__recomendados-grid">
                  {recomendacionesHoyInicio.map((r) => (
                    <div
                      key={`${r.curso}-Turno${r.turno}`}
                      className="mi-estudio__recomendados-curso"
                    >
                      <span className="mi-estudio__recomendados-curso-nombre">
                        {r.curso}
                      </span>
                      <ul className="mi-estudio__recomendados-temas">
                        {r.temas.map((tema) => (
                          <li key={tema}>{tema}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}
        {topicData && (stage === "theory" || stage === "question") && (
          <div className="mi-estudio__stage">
            {stage === "question" && !modoExamenTema && (
              <div className="mi-estudio__hud-wrap animate-fade-in">
                <Hud
                  current={progresoPregunta.current}
                  total={progresoPregunta.total}
                  correct={score}
                  wrong={wrongCount}
                  vidas={vidas}
                />
              </div>
            )}
            {stage === "theory" && flatPuntos.length > 0 && (
              <div className="mi-estudio__theory-wrap">
                <div
                  ref={barraTeoriaRef}
                  className={`teoria-sticky-bar ${mostrarBarraTeoria ? "is-open" : ""}`}
                >
                  <TheorySearchBar
                    flatPuntos={puntosTeoria}
                    onSelect={(sel) => seleccionarItem({ type: "contenido", ...sel })}
                  />
                  <button
                    type="button"
                    onClick={() => setMusicaTeoriaOn((v) => !v)}
                    className={`mi-estudio__voz-btn mi-estudio__voz-btn--musica ${musicaTeoriaOn ? "is-on" : "is-off"}`}
                    title={musicaTeoriaOn ? "Desactivar música" : "Activar música"}
                    aria-label={musicaTeoriaOn ? "Desactivar música" : "Activar música"}
                  >
                    <i className="fa-solid fa-music" />
                  </button>
                </div>
                {mostrarBotonBuscador && !mostrarBarraTeoria && (
                  <button
                    type="button"
                    className="teoria-buscador-flotante"
                    onClick={() => setMostrarBarraTeoria(true)}
                    aria-label="Abrir buscador"
                    title="Abrir buscador"
                  >
                    <i className="fa-solid fa-magnifying-glass" />
                  </button>
                )}
                <div className="teoria-articulo-web">
                  {seccionActual && (
                    <>
                      <h3 className="teoria-etiqueta">
                        {seccionActual.titulo}
                      </h3>

                      {seccionActual.puntos.map((punto, i) => (
                        <div
                          key={punto.id}
                          id={`punto-${punto.id}`}
                          className={`arcade-game-container teoria-card-unica`}
                        >
                          <div className="arcade-grid" />

                          <div className="teoria-card-unica__inner">
                            <div
                              className="teoria-punto__fila"
                            >
                              <div>
                                <input
                                  type="checkbox"
                                  id={`checkbox-${punto.id}`}
                                  className={`teoria-etiqueta-checkbox${textosCompletados.includes(punto.id) ? " is-completado" : ""}`}
                                  checked={textosSeleccionados.includes(punto.id)}
                                  onChange={() => {
                                    const puntoId = punto.id;

                                    if (textosCompletados.includes(puntoId)) return;

                                    setTextosSeleccionados((prev) => {
                                      const newSelection = prev.includes(puntoId)
                                        ? prev.filter((t) => t !== puntoId)
                                        : [...prev, puntoId];

                                      const idsTeoriaNormal = flatPuntos
                                        .filter((p) => p.seccionTitulo !== "Ejercicios")
                                        .map((p) => p.id);

                                      if (
                                        idsTeoriaNormal.length > 0 &&
                                        idsTeoriaNormal.every((id) => newSelection.includes(id))
                                      ) {
                                        setMostrarCongratulations(true);
                                      }

                                      return newSelection;
                                    });
                                  }}
                                />

                                <label
                                  htmlFor={`checkbox-${punto.id}`}
                                  className="teoria-contenido-principal"
                                >
                                  <GlossaryText
                                    text={punto.texto}
                                    glosario={topicData?.glosario}
                                  />
                                </label>
                              </div>
                            </div>

                            {punto.imagen && (
                              <div className="teoria-punto__imagen-wrap">
                                <img
                                  src={
                                    /^(https?:)?\/\//i.test(punto.imagen)
                                      ? punto.imagen
                                      : `${import.meta.env.BASE_URL}${String(punto.imagen).replace(/^\/+/, "")}`
                                  }
                                  alt={punto.texto || "Imagen de la teoría"}
                                  className="teoria-punto__imagen"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {punto.explicacion && (
                              <div className="teoria-explicacion-extra teoria-explicacion-extra--unida">
                                <div className="teoria-explicacion-extra__fila">
                                  <div className="teoria-explicacion-extra__texto">
                                    <GlossaryText
                                      text={punto.explicacion}
                                      glosario={topicData?.glosario}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="teoria-nav-botones">
                        <button
                          type="button"
                          className="teoria-nav-btn"
                          onClick={() => setTeoriaVistaIndex((i) => Math.max(0, i - 1))}
                          disabled={teoriaVistaIndex === 0}
                          title="Anterior"
                          aria-label="Sección anterior"
                        >
                          <i className="fa-solid fa-arrow-left"></i>
                        </button>

                        <button
                          type="button"
                          className="teoria-nav-btn teoria-nav-btn--game"
                          onClick={() =>
                            elegirModoEstudio("solo_preguntas", {
                              seleccionEspecifica: seccionActual.puntos.map((p) => p.id)
                            })
                          }
                          title="Ir a las preguntas de esta sección"
                          aria-label="Ir a las preguntas de esta sección"
                        >
                          <i className="fa-solid fa-gamepad"></i>
                        </button>

                        <button
                          type="button"
                          className="teoria-nav-btn"
                          onClick={() =>
                            setTeoriaVistaIndex((i) =>
                              Math.min(seccionesAgrupadas.length - 1, i + 1)
                            )
                          }
                          disabled={teoriaVistaIndex === seccionesAgrupadas.length - 1}
                          title="Siguiente"
                          aria-label="Sección siguiente"
                        >
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                    </>
                  )}

                  <div className="teoria-acciones-final">
                    <button
                      className={`teoria-boton-examen${examenPreguntas.length > 0 ? "" : " is-bloqueado"}`}
                      onClick={() =>
                        examenPreguntas.length > 0 &&
                        elegirModoEstudio("solo_preguntas")
                      }
                      aria-disabled={examenPreguntas.length === 0}
                    >
                      <i className="fa-solid fa-graduation-cap"></i> Ir al Examen
                    </button>

                    <button
                      className={`teoria-boton-examen teoria-boton-completar${teoriaCompleta ? "" : " is-bloqueado"}`}
                      onClick={intentarCompletarTema}
                      aria-disabled={!teoriaCompleta}
                    >
                      <i className="fa-solid fa-check-circle"></i> Completar Tema
                    </button>
                  </div>

                  <ExercisesSection
                    examenPreguntas={(topicData?.examen || []).filter(
                      (_, i) => puntosEstables[i]?.seccionTitulo === "Ejercicios"
                    )}
                    onModoEstudio={() =>
                      elegirModoEstudio("solo_preguntas", { soloAdicionales: true })
                    }
                  />
                </div>
              </div>
            )}
            {stage === "question" && modoExamenTema && (
              <div className="mi-estudio__question-stage">
                <div className="mi-estudio__question-inner animate-fade-in">
                  <TemaExamenView
                    ref={temaExamenViewRef}
                    preguntas={examenPreguntas}
                    titulos={titulosFinalesExamen}
                    claveTiempo={`tiempoExamenTema_${topicData?.curso}_${topicData?.tema}`}
                    onTerminar={finalizarTemaDesdeExamen}
                    onFaseChange={setFaseExamenTema}
                    onVolverTeoria={volverATeoriaDesdeExamenTema}
                  />
                </div>
              </div>
            )}
            {stage === "question" && !modoExamenTema && (
              <div className="mi-estudio__question-stage">
                {countdown > 0 ? (
                  <div className="mi-estudio__countdown-wrap animate-fade-in">
                    <h2 className="mi-estudio__countdown-number">{countdown}</h2>
                    <p className="mi-estudio__countdown-text">Intenta recordar la teoría antes de ver la pregunta...</p>
                  </div>
                ) : (
                  <div className="mi-estudio__question-inner animate-fade-in">
                    <QuestionCard
                      key={`${repasoQuizActivo
                        ? "repaso-" + repasoQuizPos
                        : isLevelMode
                          ? "nivel-" + nivelIndex
                          : isFlipQuiz
                            ? "flip-" + cardIndex + "-" + quizPos
                            : "teoria-" + cardIndex
                        }-${attemptKey}`}
                      pregunta={preguntaActual}
                      onRespondido={manejarRespuesta}
                      onRendirse={rendirsePregunta}
                      onReintentar={reintentarPregunta}
                      onSiguiente={avanzarCard}
                      vidas={vidas}
                    />
                  </div>
                )}
              </div>
            )}
            {stage === "question" && !modoExamenTema && (
              <div className="mi-estudio__nav">
                <button
                  onClick={retrocederCard}
                  disabled={isLevelMode ? nivelIndex === 0 : isFlipQuiz ? quizPos === 0 : cardIndex === 0}
                  className={`mi-estudio__nav-btn ${(isLevelMode ? nivelIndex === 0 : isFlipQuiz ? quizPos === 0 : cardIndex === 0) ? "" : "is-active"}`}
                  title="Anterior"
                >
                  <i className="fas fa-caret-left" />
                </button>
                <div className="mi-estudio__nav-right">
                  {(() => {
                    const esUltimo = repasoQuizActivo
                      ? repasoQuizPos === repasoQuizBatch.length - 1
                      : isLevelMode
                        ? nivelIndex === examenPreguntas.length - 1
                        : isFlipQuiz
                          ? quizPos === quizBatch.length - 1
                          : cardIndex === flatPuntos.length - 1;
                    const bloqueado = !canAdvance;
                    return (
                      <>
                        <button
                          onClick={() => {
                            if (bloqueado) {
                              mostrarHintBloqueo();
                              return;
                            }
                            avanzarCard();
                          }}
                          aria-disabled={bloqueado}
                          className={`mi-estudio__nav-btn ${bloqueado ? "" : "is-active"}`}
                          title="Siguiente"
                        >
                          {esUltimo && canAdvance ? (
                            <i className="fas fa-flag-checkered" />
                          ) : (
                            <i className="fas fa-caret-right" />
                          )}
                        </button>
                        {!canAdvance && !esUltimo && hintBloqueoVisible && (
                          <span className="aviso-bloqueo aviso-bloqueo--wrap">
                            ¡Supera la pregunta para avanzar!
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            {stage === "question" && !modoExamenTema && questionResult && (
              <div className="mi-estudio__explanation-wrap">
                <ExplanationPanel
                  pregunta={preguntaActual}
                  isCorrect={questionResult.isCorrect}
                  onSiguiente={avanzarCard}
                  onReintentar={reintentarPregunta}
                  rendido={questionResult.rendido}
                  onRendirse={rendirsePregunta}
                  vidas={questionResult.vidasEnEsteIntento ?? vidas}
                  vidasActuales={vidas}
                />
              </div>
            )}
          </div>
        )}
        {stage === "finished" && (
          <div className="mi-estudio__finished">
            {confirmGuardarRepasoFinal ? (
              <>
                <div className="mi-estudio__finished-emoji animate-bounce">
                  <i className="fas fa-thumbtack" />
                </div>
                <h2 className="mi-estudio__finished-title">¿Guardar este tema en tus repasos?</h2>
                <p className="mi-estudio__finished-sub">
                  Así te va a aparecer en la sección de Repasos para reforzarlo más adelante.
                </p>
                <div className="mi-estudio__finished-btn-row">
                  <button onClick={() => confirmarGuardarRepasoFinal(true)} className="mi-estudio__finished-btn is-inline">
                    Sí, guardar
                  </button>
                  <button onClick={() => confirmarGuardarRepasoFinal(false)} className="mi-estudio__finished-btn is-outline is-inline">
                    No, gracias
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mi-estudio__finished-emoji animate-bounce">
                  <i className="fas fa-trophy" />
                </div>
                <h2 className="mi-estudio__finished-title">
                  {nombreUsuario ? `¡Tema completado, ${nombreUsuario}!` : "¡Tema completado!"}
                </h2>
                <p className="mi-estudio__finished-sub">Excelente trabajo leyendo toda la teoría.</p>
                <button onClick={() => setTemasOpen(true)} className="mi-estudio__finished-btn">
                  Elegir otro tema
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {topicData && (
        <SeenQuestionsModal
          open={seenQuestionsOpen}
          onClose={() => setSeenQuestionsOpen(false)}
          preguntasVistas={preguntasVistas}
          flatPuntos={flatPuntos}
        />
      )}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={seleccionarItem}
        contenidoTema={stage === "theory" ? puntosTeoria : []}
      />
      {nombreCursoActivo && (
        <TopicsModal
          open={temasOpen}
          onClose={() => setTemasOpen(false)}
          curso={nombreCursoActivo}
          temaActual={topicData ? topicData.tema : null}
          listaTemas={temasDelCurso}
          onSelectTema={(temaItem) => {
            pedirAbrirTema({ curso: nombreCursoActivo, tema: temaItem.tema, archivo: temaItem.archivo });
          }}
        />
      )}
      <audio ref={vidaPerderRef} src={`${import.meta.env.BASE_URL}sonidos/vida-perder.mp3`} preload="auto" />
      <audio ref={ceroVidasRef} src={`${import.meta.env.BASE_URL}sonidos/cero-vidas.mp3`} preload="auto" />
      <audio ref={alertaNotificacionRef} src={`${import.meta.env.BASE_URL}sonidos/notificacion.mp3`} preload="auto" />
      {alertaVidas === "tres" && (
        <div className="vidas-fullscreen animate-fade-in">
          <div className="vidas-fullscreen__content">
            <h2 className="vidas-fullscreen__title is-tres"><i className="fas fa-triangle-exclamation" /> 3 vidas</h2>
            {renderCorazonesVidas()}
            <p className="vidas-fullscreen__sub">No te confíes.</p>
          </div>
        </div>
      )}
      {alertaVidas === "una" && (
        <div className="vidas-fullscreen animate-fade-in">
          <div className="vidas-fullscreen__content">
            <h2 className="vidas-fullscreen__title is-una"><i className="fas fa-fire" /> 1 vida</h2>
            {renderCorazonesVidas()}
            <p className="vidas-fullscreen__sub">Última oportunidad.</p>
          </div>
        </div>
      )}
      {alertaVidas === "cero" && (
        <div className="vidas-fullscreen animate-fade-in">
          <div className="vidas-fullscreen__content">
            <h1 className="vidas-fullscreen__title-big">GAME OVER</h1>
            {renderCorazonesVidas()}
            <p className="vidas-fullscreen__sub is-muted">Progreso reiniciado.</p>
          </div>
        </div>
      )}
      <CongratulationsAlert visible={mostrarCongratulations} onClose={() => setMostrarCongratulations(false)} />
      <ConfirmacionSalida
        open={mostrarConfirmacionSalida}
        onConfirm={handleGuardarYSalir}
        onSalirSinGuardar={handleSalirSinGuardar}
        onCancel={handleCancelarSalida}
      />
    </div>
  );
}