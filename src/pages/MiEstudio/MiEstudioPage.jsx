import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import manifest from "../../data/manifest.json";
import { registrarCursoCompletado } from "../../lib/repasoStorage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";
import { useSearchHistory } from "../../hooks/useSearchHistory";
import AppHeader from "../../components/AppHeader";
import { useFooterVisibility } from "../../context/FooterVisibilityContext";
import WelcomeSection from "../../components/WelcomeSection";
import AvisosInicio from "../../components/AvisosInicio";
import QuestionCard from "./QuestionCard";
import ExplanationPanel from "./ExplanationPanel";
import GlossaryText from "./Glossarytext";
import TopBar from "./TopBar";
import Hud from "./Hud";
import SeenQuestionsModal from "./SeenQuestionsModal";
import SearchModal from "../../components/SearchModal";
import WelcomeModal from "./WelcomeModal";
import Modal from "../../components/Modal";
import ModoEstudioModal from "./ModoEstudioModal";
import PomodoroAlarmModal from "./PomodoroAlarmModal";
import PomodoroWidget from "../../components/PomodoroWidget";
import TopicsModal from "./TopicsModal";
import TheorySearchBar from "./TheorySearchBar";
import {
  leerPomodoroCompartido,
  guardarRetorno,
  limpiarPomodoroCompartido
} from "../../lib/pomodoroShared";
import { shuffle } from "../../lib/shuffle";
import "katex/dist/katex.min.css";

const CURSOS_ITEMS = manifest.cursos.map((c) => ({
  type: "curso",
  nombre: c.nombre
}));

const TEMAS_ITEMS = manifest.cursos.flatMap((c) =>
  c.temas.map((t) => ({
    type: "tema",
    curso: c.nombre,
    tema: t.tema,
    archivo: t.archivo
  }))
);

const OPCIONES_BUSQUEDA = [
  ...CURSOS_ITEMS,
  ...TEMAS_ITEMS
];

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buscarFuertes(query) {
  const q = normalizarTexto(query);

  if (!q) {
    return {
      cursos: [],
      temas: []
    };
  }

  const palabras = q
    .split(/\s+/)
    .filter(Boolean);

  function puntuar(texto) {
    const nombre = normalizarTexto(texto);
    let score = 0;

    if (nombre === q) score += 1000;
    if (nombre.startsWith(q)) score += 500;
    if (nombre.includes(q)) score += 300;

    for (const palabra of palabras) {
      if (nombre.includes(palabra)) score += 100;
      if (nombre.startsWith(palabra)) score += 50;
    }

    return score;
  }

  const cursos = CURSOS_ITEMS
    .map((curso) => ({
      ...curso,
      _score: puntuar(curso.nombre)
    }))
    .filter((curso) => curso._score > 0)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...curso }) => curso);

  const temas = TEMAS_ITEMS
    .map((tema) => ({
      ...tema,
      _score: puntuar(tema.tema)
    }))
    .filter((tema) => tema._score > 0)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...tema }) => tema);

  return {
    cursos,
    temas
  };
}

function agruparResultados({ cursos, temas }) {
  const nombresCursosFuertes = new Set(
    cursos.map((c) => c.nombre)
  );

  const grupos = cursos.map((c) => ({
    curso: c.nombre,
    temas:
      manifest.cursos
        .find((x) => x.nombre === c.nombre)
        .temas.map((t) => ({
          type: "tema",
          curso: c.nombre,
          tema: t.tema,
          archivo: t.archivo
        }))
  }));

  const temasPorCurso = new Map();

  for (const t of temas) {
    if (nombresCursosFuertes.has(t.curso)) {
      continue;
    }

    if (!temasPorCurso.has(t.curso)) {
      temasPorCurso.set(t.curso, []);
    }

    temasPorCurso.get(t.curso).push(t);
  }

  for (const [curso, temasDelCurso] of temasPorCurso) {
    grupos.push({
      curso,
      temas: temasDelCurso
    });
  }

  return grupos;
}

function limpiarParaVoz(texto) {
  if (!texto) return "";

  return texto
    .replace(/\\\[|\\\]|\\\(|\\\)|\$\$|\$/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}^_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let vocesListasPromise = null;

function obtenerVocesListas() {
  if (vocesListasPromise) {
    return vocesListasPromise;
  }

  vocesListasPromise = new Promise((resolve) => {
    const voces =
      window.speechSynthesis.getVoices();

    if (voces.length > 0) {
      resolve(voces);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(
        window.speechSynthesis.getVoices()
      );
    };

    setTimeout(() => {
      resolve(
        window.speechSynthesis.getVoices()
      );
    }, 1200);
  });

  return vocesListasPromise;
}

function useLecturaTeoriaVoz(texto, activo) {
  useEffect(() => {
    if (
      !activo ||
      !texto ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    let cancelado = false;

    window.speechSynthesis.cancel();

    obtenerVocesListas().then((voces) => {
      if (cancelado) return;

      const utter =
        new SpeechSynthesisUtterance(
          limpiarParaVoz(texto)
        );

      utter.lang = "es-PE";
      utter.pitch = 0.55;
      utter.rate = 0.92;

      const nombresMachoAlfa = [
        "jorge",
        "diego",
        "pablo",
        "carlos",
        "miguel",
        "juan",
        "male"
      ];

      const vozGrave =
        voces.find(
          (v) =>
            v.lang
              ?.toLowerCase()
              .startsWith("es") &&
            nombresMachoAlfa.some((n) =>
              v.name
                .toLowerCase()
                .includes(n)
            )
        ) ||
        voces.find((v) =>
          v.lang
            ?.toLowerCase()
            .startsWith("es")
        );

      if (vozGrave) {
        utter.voice = vozGrave;
      }

      window.speechSynthesis.speak(utter);
    });

    return () => {
      cancelado = true;

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [texto, activo]);
}

export default function MiEstudioPage() {
  const [query, setQuery] = useState("");
  const [topicData, setTopicData] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flatPuntos, setFlatPuntos] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [ordenPreguntas, setOrdenPreguntas] =
    useState([]);
  const [posOrden, setPosOrden] = useState(0);
  const [maxUnlocked, setMaxUnlocked] =
    useState(0);
  const [stage, setStage] = useState("theory");
  const [isLevelMode, setIsLevelMode] =
    useState(false);
  const [textosSeleccionados, setTextosSeleccionados] = useState([]);

  const { setFooterHidden } =
    useFooterVisibility();

  useEffect(() => {
    const ocultar =
      Boolean(topicData) &&
      (stage === "theory" ||
        stage === "question");

    setFooterHidden(ocultar);

    return () => setFooterHidden(false);
  }, [
    topicData,
    stage,
    setFooterHidden
  ]);

  const [countdown, setCountdown] =
    useState(0);
  const [vidas, setVidas] = useState(5);
  const [alertaVidas, setAlertaVidas] =
    useState(null);

  const vidaPerderRef = useRef(null);
  const ceroVidasRef = useRef(null);
  const alertaNotificacionRef =
    useRef(null);

  useEffect(() => {
    if (!alertaVidas) return;

    const delay =
      alertaVidas === "cero"
        ? 4200
        : 3200;

    const t = setTimeout(() => {
      setAlertaVidas(null);

      if (alertaVidas === "cero") {
        setVidas(5);
      }
    }, delay);

    return () => clearTimeout(t);
  }, [alertaVidas]);

  const [corazonRoto, setCorazonRoto] =
    useState(false);

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
        {Array.from({ length: 5 }).map(
          (_, i) => {
            if (i < vidas) {
              return (
                <i
                  key={i}
                  className="bi bi-heart-fill vidas-fullscreen__heart is-full"
                />
              );
            }

            if (i === vidas) {
              return (
                <i
                  key={i}
                  className={`vidas-fullscreen__heart ${corazonRoto
                    ? "bi bi-heartbreak is-roto"
                    : "bi bi-heart-fill is-a-punto"
                    }`}
                />
              );
            }

            return (
              <i
                key={i}
                className="bi bi-heartbreak vidas-fullscreen__heart is-roto"
              />
            );
          }
        )}
      </div>
    );
  }

  const [examenPreguntas, setExamenPreguntas] =
    useState([]);
  const [nivelIndex, setNivelIndex] =
    useState(0);
  const [nivelMaxUnlocked, setNivelMaxUnlocked] =
    useState(0);
  const [nivelCompletions, setNivelCompletions] =
    useState({});
  const [ultimoFlipIndex, setUltimoFlipIndex] =
    useState(0);
  const [isFlipQuiz, setIsFlipQuiz] =
    useState(false);
  const [quizBatch, setQuizBatch] =
    useState([]);
  const [quizPos, setQuizPos] =
    useState(0);
  const [preguntasVistas, setPreguntasVistas] =
    useState({});
  const [seenQuestionsOpen, setSeenQuestionsOpen] =
    useState(false);
  const [repasoQuizActivo, setRepasoQuizActivo] =
    useState(false);
  const [repasoQuizBatch, setRepasoQuizBatch] =
    useState([]);
  const [repasoQuizPos, setRepasoQuizPos] =
    useState(0);
  const [repasoDesdeTeoria, setRepasoDesdeTeoria] =
    useState(false);
  const [searchOpen, setSearchOpen] =
    useState(false);
  const [pomodoroMiniOpen, setPomodoroMiniOpen] =
    useState(false);
  const [temasOpen, setTemasOpen] =
    useState(false);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] =
    useState(0);
  const [questionResult, setQuestionResult] =
    useState(null);
  const [attemptKey, setAttemptKey] =
    useState(0);
  const [googleQuery, setGoogleQuery] =
    useState("");
  const [levelCompletions, setLevelCompletions] =
    useState({});
  const [isFullscreen, setIsFullscreen] =
    useState(false);
  const [configOpen, setConfigOpen] =
    useState(false);
  const [confirmLeave, setConfirmLeave] =
    useState(false);

  const [nombreUsuario, setNombreUsuario] =
    useLocalStorage(
      "miEstudio_nombreUsuario",
      null
    );

  const [preguntaModoAbierta, setPreguntaModoAbierta] =
    useState(false);

  const [modoEstudio, setModoEstudio] =
    useState("completo");

  const [pomodoroAlarmaAbierta, setPomodoroAlarmaAbierta] =
    useState(false);

  const [pomodoroAlarmaLabel, setPomodoroAlarmaLabel] =
    useState("");

  const pomodoroAlertadoRef =
    useRef(null);

  const [
    mostrarModalSugerencia,
    setMostrarModalSugerencia
  ] = useState(false);

  const [textoSugerencia, setTextoSugerencia] =
    useState("");

  const [
    sugerenciaMsg,
    setSugerenciaMsg
  ] = useState(null);

  const [
    sugerenciaMsgSaliendo,
    setSugerenciaMsgSaliendo
  ] = useState(false);

  const sugerenciaTimers =
    useRef([]);

  useEffect(() => {
    const UMBRAL_AVISO_VENCIDO_MS =
      2 * 60 * 1000;

    const intervalo = setInterval(() => {
      const estado =
        leerPomodoroCompartido();

      if (!estado || !estado.running) {
        return;
      }

      const msDesdeQueTermino =
        Date.now() -
        estado.endTimestamp;

      if (msDesdeQueTermino < 0) {
        return;
      }

      if (
        msDesdeQueTermino >
        UMBRAL_AVISO_VENCIDO_MS
      ) {
        limpiarPomodoroCompartido();
        return;
      }

      if (
        pomodoroAlertadoRef.current !==
        estado.endTimestamp
      ) {
        pomodoroAlertadoRef.current =
          estado.endTimestamp;

        setPomodoroAlarmaLabel(
          estado.label || ""
        );

        setPomodoroAlarmaAbierta(true);
      }
    }, 1000);

    return () =>
      clearInterval(intervalo);
  }, []);

  function irAPomodoroDesdeAlarma() {
    setPomodoroAlarmaAbierta(false);
    limpiarPomodoroCompartido();

    if (topicData?.tema) {
      guardarRetorno(topicData.tema);
    }

    navigate("/pomodoro");
  }

  const [busquedaEnfocada, setBusquedaEnfocada] =
    useState(false);

  const [
    paginaHistorialInicio,
    setPaginaHistorialInicio
  ] = useState(1);

  const HISTORIAL_INICIO_POR_PAGINA = 5;

  const {
    historial: historialInicio,
    guardarBusqueda:
    guardarBusquedaInicio,
    eliminarHistorial:
    eliminarHistorialInicio
  } = useSearchHistory();

  const [
    repasoGuardadoMsg,
    setRepasoGuardadoMsg
  ] = useState(false);

  const [
    repasoGuardadoSaliendo,
    setRepasoGuardadoSaliendo
  ] = useState(false);

  const repasoGuardadoTimers =
    useRef([]);

  const [
    sinPreguntaAlerta,
    setSinPreguntaAlerta
  ] = useState(false);

  const [
    sinPreguntaSaliendo,
    setSinPreguntaSaliendo
  ] = useState(false);

  const sinPreguntaTimers =
    useRef([]);

  const [
    confirmGuardarRepasoFinal,
    setConfirmGuardarRepasoFinal
  ] = useState(false);

  useEffect(() => {
    if (
      sinPreguntaAlerta &&
      alertaNotificacionRef.current
    ) {
      alertaNotificacionRef.current.currentTime = 0;

      alertaNotificacionRef.current
        .play()
        .catch((err) => {
          console.error(
            "Error al reproducir sonido de alerta:",
            err
          );
        });
    }
  }, [sinPreguntaAlerta]);

  useEffect(() => {
    return () => {
      repasoGuardadoTimers.current.forEach(
        clearTimeout
      );

      sinPreguntaTimers.current.forEach(
        clearTimeout
      );

      sugerenciaTimers.current.forEach(
        clearTimeout
      );
    };
  }, []);

  const hayQuery =
    query.trim() !== "";

  const fuertes = useMemo(() => {
    if (!hayQuery) {
      return {
        cursos: [],
        temas: []
      };
    }

    return buscarFuertes(query);
  }, [query, hayQuery]);

  const grupos = useMemo(
    () => agruparResultados(fuertes),
    [fuertes]
  );

  const itemsPlanos = useMemo(
    () =>
      grupos.flatMap((g) => [
        {
          type: "curso",
          nombre: g.curso
        },
        ...g.temas
      ]),
    [grupos]
  );

  const historialInicioVisible =
    useMemo(() => {
      const inicio =
        (paginaHistorialInicio - 1) *
        HISTORIAL_INICIO_POR_PAGINA;

      return historialInicio.slice(
        inicio,
        inicio +
        HISTORIAL_INICIO_POR_PAGINA
      );
    }, [
      historialInicio,
      paginaHistorialInicio
    ]);

  const hayMasHistorialInicio =
    paginaHistorialInicio *
    HISTORIAL_INICIO_POR_PAGINA <
    historialInicio.length;

  const hayMenosHistorialInicio =
    paginaHistorialInicio > 1;

  const mostrarHistorialInicio =
    busquedaEnfocada &&
    !hayQuery &&
    historialInicio.length > 0;

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(
        !!document.fullscreenElement
      );
    }

    document.addEventListener(
      "fullscreenchange",
      onFullscreenChange
    );

    return () =>
      document.removeEventListener(
        "fullscreenchange",
        onFullscreenChange
      );
  }, []);

  useEffect(() => {
    let timer = null;

    if (
      stage === "question" &&
      countdown > 0
    ) {
      timer = setInterval(() => {
        setCountdown(
          (prev) => prev - 1
        );
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [stage, countdown]);

  useEffect(() => {
    if (topicData) {
      localStorage.setItem(
        `ultimaCard_${topicData.curso}_${topicData.tema}`,
        cardIndex.toString()
      );
    }
  }, [cardIndex, topicData]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => {
          console.error(
            "Error al entrar en pantalla completa:",
            err
          );
        });
    } else if (
      document.exitFullscreen
    ) {
      document.exitFullscreen();
    }
  }

  async function abrirTema(item) {
    setLoading(true);
    setError("");

    localStorage.setItem(
      "ultimoTemaAbierto",
      JSON.stringify({
        curso: item.curso,
        tema: item.tema,
        archivo: item.archivo
      })
    );

    try {
      const res = await fetch(
        import.meta.env.BASE_URL +
        item.archivo
      );

      if (!res.ok) {
        throw new Error(
          "No se encontró el archivo del tema"
        );
      }

      const data = await res.json();

      const puntos =
        (data.theory || []).flatMap(
          (seccion, idxSeccion) =>
            seccion.puntos.map((p, idxPunto) => ({
              ...p,
              id: `${idxSeccion}-${idxPunto}`,
              seccionTitulo:
                seccion.titulo
            }))
        );

      const examenList =
        data.examen || [];

      const storageCompletionsKey =
        `completions_${item.curso}_${item.tema}`;

      const storedCompletions =
        JSON.parse(
          localStorage.getItem(
            storageCompletionsKey
          ) || "{}"
        );

      setLevelCompletions(
        storedCompletions
      );

      const storageMaxUnlKey =
        `maxUnlocked_${item.curso}_${item.tema}`;

      const storedMax = parseInt(
        localStorage.getItem(
          storageMaxUnlKey
        ) || "0",
        10
      );

      setMaxUnlocked(storedMax);

      const storageNivelCompletionsKey =
        `examenCompletions_${item.curso}_${item.tema}`;

      const storedNivelCompletions =
        JSON.parse(
          localStorage.getItem(
            storageNivelCompletionsKey
          ) || "{}"
        );

      setNivelCompletions(
        storedNivelCompletions
      );

      const storageNivelMaxKey =
        `examenMaxUnlocked_${item.curso}_${item.tema}`;

      const storedNivelMax =
        parseInt(
          localStorage.getItem(
            storageNivelMaxKey
          ) || "0",
          10
        );

      setNivelMaxUnlocked(
        storedNivelMax
      );

      setExamenPreguntas(
        examenList
      );

      setNivelIndex(0);

      const storageUltimaCardKey =
        `ultimaCard_${item.curso}_${item.tema}`;

      let cardInicial = parseInt(
        localStorage.getItem(
          storageUltimaCardKey
        ) || "0",
        10
      );

      if (
        cardInicial >= puntos.length
      ) {
        cardInicial = 0;
      }

      const storagePreguntasVistasKey =
        `preguntasVistas_${item.curso}_${item.tema}`;

      const storedPreguntasVistas =
        JSON.parse(
          localStorage.getItem(
            storagePreguntasVistasKey
          ) || "{}"
        );

      setPreguntasVistas(
        storedPreguntasVistas
      );

      setTextosSeleccionados([]);

      setTopicData({
        ...data,
        curso: item.curso,
        tema: item.tema,
        archivo: item.archivo
      });

      setFlatPuntos(puntos);
      setCardIndex(cardInicial);
      setUltimoFlipIndex(
        cardInicial
      );
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
      setQuestionResult(null);
      setAttemptKey(0);
      setQuery("");
      setSearchOpen(false);
      setCountdown(0);
      setVidas(5);
      setAlertaVidas(null);
      setSinPreguntaAlerta(false);
      setPreguntaModoAbierta(true);

      setTextoSugerencia("");
      setMostrarModalSugerencia(false);
      setSugerenciaMsg(null);
      setSugerenciaMsgSaliendo(false);
    } catch (e) {
      console.error(
        "Error en abrirTema:",
        e
      );

      setError(
        `No pude cargar "${item.tema}". (${e.message})`
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // SUGERIR EXAMEN — FORM SUBMIT
  // ============================================================

  async function enviarSugerenciaExamen() {
    if (!topicData) return;

    sugerenciaTimers.current.forEach(
      clearTimeout
    );

    setSugerenciaMsg(null);
    setSugerenciaMsgSaliendo(false);

    const datos = {
      _subject: `Sugerencia de examen — ${topicData.tema ||
        "Tema sin nombre"
        }`,
      curso: topicData.curso || "",
      tema: topicData.tema || "",
      comentario:
        textoSugerencia.trim() ||
        "Sin comentario adicional.",
      _captcha: "false"
    };

    try {
      const respuesta = await fetch(
        "https://formsubmit.co/ajax/7f233465b329341d11f0a1b54466dea1",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify(datos)
        }
      );

      const resultado =
        await respuesta.json();

      console.log(
        "Respuesta de FormSubmit:",
        resultado
      );

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
          "FormSubmit rechazó el envío."
        );
      }

      setTextoSugerencia("");
      setMostrarModalSugerencia(false);

      setSugerenciaMsg(
        "Tu sugerencia fue enviada correctamente."
      );

      setSugerenciaMsgSaliendo(false);

      sugerenciaTimers.current = [
        setTimeout(() => {
          setSugerenciaMsgSaliendo(true);
        }, 4600),

        setTimeout(() => {
          setSugerenciaMsg(null);
          setSugerenciaMsgSaliendo(false);
        }, 5000)
      ];
    } catch (error) {
      console.error(
        "Error al enviar sugerencia:",
        error
      );

      setSugerenciaMsg(
        "No se pudo enviar la sugerencia. Inténtalo nuevamente."
      );

      setSugerenciaMsgSaliendo(false);

      sugerenciaTimers.current = [
        setTimeout(() => {
          setSugerenciaMsgSaliendo(true);
        }, 3000),
        setTimeout(() => {
          setSugerenciaMsg(null);
          setSugerenciaMsgSaliendo(false);
        }, 3400)
      ];
    }
  }

  function seleccionarItem(item) {
    setQuery("");
    guardarBusquedaInicio(item);
    setPaginaHistorialInicio(1);

    if (item.type === "curso") {
      setCursoSeleccionado(
        item.nombre
      );
      setTemasOpen(true);
      setSearchOpen(false);
    } else {
      setCursoSeleccionado(
        item.curso
      );
      setTemasOpen(false);
      abrirTema(item);
    }
  }

  function elegirModoEstudio(modo) {
    setPreguntaModoAbierta(false);

    if (modo === "solo_preguntas") {
      const originalExamen = topicData?.examen || [];

      // Extraemos preguntas vinculadas a la teoría 1/1 (de los textos marcados con check)
      const preguntasVinculadasTeoria = flatPuntos
        .filter(p => p.pregunta && textosSeleccionados.includes(p.id))
        .map(p => p.pregunta);

      let preguntasFinales = [];

      if (preguntasVinculadasTeoria.length > 0) {
        preguntasFinales = [...preguntasVinculadasTeoria];
      } else if (originalExamen.length > 0) {
        preguntasFinales = originalExamen;
      }

      if (preguntasFinales.length === 0) {
        setSinPreguntaAlerta(true);
        return;
      }

      setExamenPreguntas(preguntasFinales);

      const orden = shuffle(
        Array.from(
          {
            length: preguntasFinales.length
          },
          (_, i) => i
        )
      );

      setOrdenPreguntas(orden);
      setPosOrden(0);
      setCardIndex(
        orden[0] ?? 0
      );
      setModoEstudio(
        "solo_preguntas"
      );
      setStage("question");
      setIsFlipQuiz(false);
      setCountdown(0);
    }
  }

  const [searchParams] =
    useSearchParams();

  const navigate = useNavigate();

  useEffect(() => {
    const q =
      searchParams.get("q");

    if (!q) return;

    const qNorm =
      normalizarTexto(q);

    const temaMatch =
      OPCIONES_BUSQUEDA.find(
        (item) =>
          item.type === "tema" &&
          normalizarTexto(
            item.tema
          ) === qNorm
      );

    const cursoMatch =
      OPCIONES_BUSQUEDA.find(
        (item) =>
          item.type === "curso" &&
          normalizarTexto(
            item.nombre
          ) === qNorm
      );

    if (temaMatch) {
      seleccionarItem(
        temaMatch
      );
    } else if (cursoMatch) {
      seleccionarItem(
        cursoMatch
      );
    }

    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );
  }, []);

  const {
    focusedIdx: focusedInicial,
    handleKeyDown:
    handleKeyDownInicial
  } = useArrowKeyList(
    itemsPlanos,
    seleccionarItem
  );

  function avanzarCard() {
    if (stage === "theory") {
      return; // La teoría ahora se desplaza (scroll), no usa paginación.
    }

    if (repasoQuizActivo) {
      if (
        repasoQuizPos <
        repasoQuizBatch.length -
        1
      ) {
        setRepasoQuizPos(
          repasoQuizPos + 1
        );

        setQuestionResult(null);
        setAttemptKey(
          (k) => k + 1
        );
      } else {
        salirDeRepaso();
      }

      return;
    }

    if (isLevelMode) {
      if (
        nivelIndex <
        examenPreguntas.length -
        1
      ) {
        setNivelIndex(
          nivelIndex + 1
        );

        setQuestionResult(null);
        setAttemptKey(0);
      } else {
        finalizarTema();
      }

      return;
    }

    if (isFlipQuiz) {
      if (
        quizPos <
        quizBatch.length - 1
      ) {
        setQuizPos(
          quizPos + 1
        );

        setQuestionResult(null);
        setAttemptKey(
          (k) => k + 1
        );
      } else {
        setIsFlipQuiz(false);

        setUltimoFlipIndex(
          cardIndex + 1
        );

        setQuestionResult(null);
        setAttemptKey(
          (k) => k + 1
        );

        setCountdown(0);

        if (
          cardIndex <
          flatPuntos.length - 1
        ) {
          setCardIndex(
            cardIndex + 1
          );

          setStage("theory");
        } else {
          finalizarTema();
        }
      }

      return;
    }

    if (
      modoEstudio ===
      "solo_preguntas"
    ) {
      if (
        posOrden <
        ordenPreguntas.length -
        1
      ) {
        const siguientePos =
          posOrden + 1;

        setPosOrden(
          siguientePos
        );

        setCardIndex(
          ordenPreguntas[
          siguientePos
          ]
        );

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

    if (
      cardIndex <
      flatPuntos.length - 1
    ) {
      setCardIndex(
        cardIndex + 1
      );

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
    if (stage === "theory") {
      return; // Deshabilitado en vista teoría (scroll libre)
    }

    if (repasoQuizActivo) {
      if (
        repasoQuizPos > 0
      ) {
        setRepasoQuizPos(
          repasoQuizPos - 1
        );

        setQuestionResult(null);
        setAttemptKey(
          (k) => k + 1
        );
      }

      return;
    }

    if (isLevelMode) {
      if (nivelIndex > 0) {
        setNivelIndex(
          nivelIndex - 1
        );

        setQuestionResult(null);
        setAttemptKey(0);
      }

      return;
    }

    if (isFlipQuiz) {
      if (quizPos > 0) {
        setQuizPos(
          quizPos - 1
        );

        setQuestionResult(null);
        setAttemptKey(
          (k) => k + 1
        );
      }

      return;
    }

    if (
      modoEstudio ===
      "solo_preguntas"
    ) {
      if (posOrden > 0) {
        const anteriorPos =
          posOrden - 1;

        setPosOrden(
          anteriorPos
        );

        setCardIndex(
          ordenPreguntas[
          anteriorPos
          ]
        );

        setStage("question");
        setIsLevelMode(false);
        setQuestionResult(null);
        setAttemptKey(0);
        setCountdown(0);
      }

      return;
    }

    if (cardIndex > 0) {
      setCardIndex(
        cardIndex - 1
      );

      setStage("theory");
      setIsLevelMode(false);
      setQuestionResult(null);
      setAttemptKey(0);
      setCountdown(0);
    }
  }

  function reintentarPregunta() {
    setQuestionResult(null);
    setAttemptKey(
      (k) => k + 1
    );
  }

  function finalizarTema() {
    setStage("finished");
    setConfirmGuardarRepasoFinal(
      true
    );

    if (topicData) {
      const completados = JSON.parse(
        localStorage.getItem(
          "temasCompletados"
        ) || "[]"
      );

      const id = `${topicData.curso}_${topicData.tema}`;

      if (!completados.includes(id)) {
        completados.push(id);

        localStorage.setItem(
          "temasCompletados",
          JSON.stringify(completados)
        );
      }
    }
  }

  function confirmarGuardarRepasoFinal(
    guardar
  ) {
    if (
      guardar &&
      topicData
    ) {
      registrarCursoCompletado({
        subject:
          topicData.curso,
        tema:
          topicData.tema
      });
    }

    setConfirmGuardarRepasoFinal(
      false
    );
  }

  const [
    botonArmado,
    setBotonArmado
  ] = useState(null);

  function manejarBotonConfig(
    key,
    accion
  ) {
    if (botonArmado === key) {
      accion();
      setBotonArmado(null);
    } else {
      setBotonArmado(key);
    }
  }

  function guardarParaRepaso() {
    if (!topicData) return;

    registrarCursoCompletado({
      subject: topicData.curso,
      tema: topicData.tema
    });

    repasoGuardadoTimers.current.forEach(
      clearTimeout
    );

    setRepasoGuardadoSaliendo(
      false
    );

    setRepasoGuardadoMsg(
      true
    );

    repasoGuardadoTimers.current = [
      setTimeout(
        () =>
          setRepasoGuardadoSaliendo(
            true
          ),
        1800
      ),
      setTimeout(() => {
        setRepasoGuardadoMsg(
          false
        );
        setRepasoGuardadoSaliendo(
          false
        );
      }, 2100)
    ];
  }

  function gameOver() {
    if (!topicData) return;

    localStorage.removeItem(
      `completions_${topicData.curso}_${topicData.tema}`
    );

    localStorage.removeItem(
      `maxUnlocked_${topicData.curso}_${topicData.tema}`
    );

    localStorage.removeItem(
      `examenCompletions_${topicData.curso}_${topicData.tema}`
    );

    localStorage.removeItem(
      `examenMaxUnlocked_${topicData.curso}_${topicData.tema}`
    );

    localStorage.removeItem(
      `ultimaCard_${topicData.curso}_${topicData.tema}`
    );

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
    setQuestionResult(null);
    setAttemptKey(0);
    setCountdown(0);
  }

  function manejarRespuesta(
    correcto
  ) {
    setQuestionResult({
      isCorrect: correcto
    });

    let vistaKey = null;
    let vistaPregunta = null;

    if (isFlipQuiz) {
      const item =
        quizBatch[quizPos];

      if (item) {
        vistaKey =
          `ex-${item.puntoIndex}`;

        vistaPregunta =
          item.pregunta;
      }
    } else if (isLevelMode) {
      vistaKey =
        `ex-${nivelIndex}`;

      vistaPregunta =
        examenPreguntas[
        nivelIndex
        ] || null;
    } else if (
      modoEstudio ===
      "solo_preguntas"
    ) {
      vistaKey =
        `ex-${cardIndex}`;

      vistaPregunta =
        examenPreguntas[
        cardIndex
        ] || null;
    } else {
      vistaKey =
        `pt-${cardIndex}`;

      vistaPregunta =
        flatPuntos[
          cardIndex
        ]?.pregunta || null;
    }

    if (
      vistaKey &&
      vistaPregunta &&
      topicData
    ) {
      setPreguntasVistas(
        (prev) => {
          if (prev[vistaKey]) {
            return prev;
          }

          const next = {
            ...prev,
            [vistaKey]: {
              pregunta:
                vistaPregunta
            }
          };

          localStorage.setItem(
            `preguntasVistas_${topicData.curso}_${topicData.tema}`,
            JSON.stringify(next)
          );

          return next;
        }
      );
    }

    if (correcto) {
      setScore(
        (s) => s + 1
      );

      if (isLevelMode) {
        setNivelCompletions(
          (prev) => {
            const newCompletions = {
              ...prev,
              [nivelIndex]:
                (prev[nivelIndex] ||
                  0) + 1
            };

            if (topicData) {
              localStorage.setItem(
                `examenCompletions_${topicData.curso}_${topicData.tema}`,
                JSON.stringify(
                  newCompletions
                )
              );
            }

            return newCompletions;
          }
        );

        setNivelMaxUnlocked(
          (m) => {
            const nextMax =
              nivelIndex === m
                ? m + 1
                : m;

            if (topicData) {
              localStorage.setItem(
                `examenMaxUnlocked_${topicData.curso}_${topicData.tema}`,
                nextMax
              );
            }

            return nextMax;
          }
        );
      } else {
        setLevelCompletions(
          (prev) => {
            const newCompletions = {
              ...prev,
              [cardIndex]:
                (prev[cardIndex] ||
                  0) + 1
            };

            if (topicData) {
              localStorage.setItem(
                `completions_${topicData.curso}_${topicData.tema}`,
                JSON.stringify(
                  newCompletions
                )
              );
            }

            return newCompletions;
          }
        );

        setMaxUnlocked(
          (m) => {
            const nextMax =
              cardIndex === m
                ? m + 1
                : m;

            if (topicData) {
              localStorage.setItem(
                `maxUnlocked_${topicData.curso}_${topicData.tema}`,
                nextMax
              );
            }

            return nextMax;
          }
        );
      }
    } else {
      setWrongCount(
        (w) => w + 1
      );

      setVidas(
        (prevVidas) => {
          const nuevasVidas =
            prevVidas - 1;

          if (
            nuevasVidas === 3
          ) {
            setAlertaVidas(
              "tres"
            );
          } else if (
            nuevasVidas === 1
          ) {
            setAlertaVidas(
              "una"
            );
          } else if (
            nuevasVidas <= 0
          ) {
            setAlertaVidas(
              "cero"
            );

            if (
              ceroVidasRef.current
            ) {
              ceroVidasRef.current.currentTime = 0;

              ceroVidasRef.current
                .play()
                .catch(() => { });
            }

            gameOver();
          }

          if (
            nuevasVidas > 0 &&
            vidaPerderRef.current
          ) {
            vidaPerderRef.current.currentTime = 0;

            vidaPerderRef.current
              .play()
              .catch(() => { });
          }

          return nuevasVidas;
        }
      );
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
    setConfirmGuardarRepasoFinal(
      false
    );
    setBotonArmado(null);
  }

  function verPreguntasVistas() {
    const lote =
      Object.entries(
        preguntasVistas
      )
        .map(([key, val]) => {
          if (
            val &&
            typeof val ===
            "object" &&
            val.pregunta
          ) {
            return {
              key,
              pregunta:
                val.pregunta
            };
          }

          const i = Number(key);

          const pregunta =
            flatPuntos[i]
              ?.pregunta;

          return pregunta
            ? {
              key,
              pregunta
            }
            : null;
        })
        .filter(Boolean);

    if (lote.length === 0) {
      sinPreguntaTimers.current.forEach(
        clearTimeout
      );

      setSinPreguntaSaliendo(
        false
      );

      setSinPreguntaAlerta(
        true
      );

      sinPreguntaTimers.current = [
        setTimeout(
          () =>
            setSinPreguntaSaliendo(
              true
            ),
          1950
        ),
        setTimeout(() => {
          setSinPreguntaAlerta(
            false
          );

          setSinPreguntaSaliendo(
            false
          );
        }, 2250)
      ];

      return;
    }

    setRepasoQuizBatch(
      shuffle(lote)
    );

    setRepasoQuizPos(0);
    setRepasoQuizActivo(true);
    setQuestionResult(null);
    setAttemptKey(
      (k) => k + 1
    );

    if (
      stage !== "question"
    ) {
      setRepasoDesdeTeoria(
        true
      );
      setStage("question");
    } else {
      setRepasoDesdeTeoria(
        false
      );
    }
  }

  function salirDeRepaso() {
    setRepasoQuizActivo(false);
    setQuestionResult(null);
    setAttemptKey(
      (k) => k + 1
    );

    if (repasoDesdeTeoria) {
      setStage("theory");
      setRepasoDesdeTeoria(
        false
      );
    }
  }

  const [confirmSalirApp, setConfirmSalirApp] =
    useState(false);

  function pedirSalirApp() {
    setConfirmSalirApp(true);
  }

  function cancelarSalirApp() {
    setConfirmSalirApp(false);
  }

  function confirmarSalirApp() {
    if (
      typeof window !== "undefined" &&
      window.Capacitor?.isNativePlatform?.()
    ) {
      const AppPlugin =
        window.Capacitor.Plugins?.App;

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
    setConfirmGuardarRepasoFinal(
      false
    );
    setBotonArmado(null);
    setCountdown(0);
  }

  function buscarEnGoogle() {
    const q =
      googleQuery.trim();

    if (!q) return;

    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(
        q
      )}`,
      "_blank"
    );
  }

  const current = isLevelMode
    ? examenPreguntas[
    nivelIndex
    ]
    : flatPuntos[cardIndex];

  const [
    lecturaTeoriaOn,
    setLecturaTeoriaOn
  ] = useState(false);

  const [puntoVozId, setPuntoVozId] = useState(null);

  useEffect(() => {
    setLecturaTeoriaOn(false);
    setPuntoVozId(null);
  }, [
    topicData?.tema,
    topicData?.curso
  ]);

  // Por defecto lee solo el primer título del tema. En cuanto el
  // usuario clickea un texto de teoría, la lectura pasa a ese texto
  // (más su explicación, que aparece justo debajo).
  const puntoVozActual = puntoVozId
    ? flatPuntos.find((p) => p.id === puntoVozId)
    : null;

  const textoParaVoz =
    stage === "theory" && !isLevelMode
      ? puntoVozActual
        ? [
          puntoVozActual.seccionTitulo,
          puntoVozActual.texto,
          puntoVozActual.explicacion
        ]
          .filter(Boolean)
          .join(". ")
        : topicData?.theory?.[0]?.titulo || null
      : null;

  useLecturaTeoriaVoz(
    textoParaVoz,
    lecturaTeoriaOn &&
    stage === "theory" &&
    !isLevelMode
  );

  const preguntaActual =
    repasoQuizActivo
      ? repasoQuizBatch[
        repasoQuizPos
      ]?.pregunta || null
      : isLevelMode
        ? current
        : isFlipQuiz
          ? quizBatch[quizPos]
            ?.pregunta || null
          : modoEstudio ===
            "solo_preguntas"
            ? examenPreguntas[
            cardIndex
            ] || null
            : null;

  const canAdvance =
    stage !== "question" ||
    Boolean(
      questionResult &&
      questionResult.isCorrect
    );

  useEffect(() => {
    function onKeyDown(e) {
      const tagActivo =
        document.activeElement &&
        document.activeElement
          .tagName;

      if (
        tagActivo === "INPUT" ||
        tagActivo === "BUTTON" ||
        tagActivo === "TEXTAREA"
      ) {
        return;
      }

      if (
        searchOpen ||
        configOpen ||
        temasOpen ||
        !topicData
      ) {
        return;
      }

      if (
        stage === "question" &&
        countdown > 0
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (
          stage === "theory" &&
          !isLevelMode
        ) {
          e.preventDefault();
          if (examenPreguntas.length > 0) {
            elegirModoEstudio("solo_preguntas");
          } else {
            finalizarTema();
          }
        } else if (
          stage === "question" &&
          questionResult &&
          questionResult.isCorrect
        ) {
          e.preventDefault();
          avanzarCard();
        } else if (
          stage === "question" &&
          questionResult &&
          !questionResult.isCorrect
        ) {
          e.preventDefault();
          reintentarPregunta();
        }
      } else if (
        e.key === " " ||
        e.code === "Space"
      ) {
        if (
          stage === "question"
        ) {
          e.preventDefault();

          if (canAdvance) {
            avanzarCard();
          }
        }
      } else if (
        e.key === "ArrowLeft"
      ) {
        if (stage === "question") {
          retrocederCard();
        }
      } else if (
        e.key === "ArrowRight"
      ) {
        if (stage === "question" && canAdvance) {
          avanzarCard();
        }
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [
    stage,
    questionResult,
    searchOpen,
    configOpen,
    temasOpen,
    topicData,
    cardIndex,
    flatPuntos,
    maxUnlocked,
    nivelIndex,
    examenPreguntas,
    nivelMaxUnlocked,
    canAdvance,
    isLevelMode,
    countdown,
    modoEstudio,
    ordenPreguntas,
    posOrden,
    isFlipQuiz,
    quizBatch,
    quizPos,
    repasoQuizActivo,
    repasoQuizBatch,
    repasoQuizPos
  ]);

  let ultimoTemaInicio = null;
  try {
    ultimoTemaInicio = JSON.parse(
      localStorage.getItem("ultimoTemaAbierto")
    );
  } catch {
    ultimoTemaInicio = null;
  }

  const wrapClass = [
    "mi-estudio__wrap",
    stage === "question"
      ? "is-question"
      : topicData
        ? "has-topbar"
        : "is-home"
  ].join(" ");

  const progresoPregunta =
    repasoQuizActivo
      ? {
        current:
          repasoQuizPos + 1,
        total:
          repasoQuizBatch.length
      }
      : isLevelMode
        ? {
          current:
            nivelIndex + 1,
          total:
            examenPreguntas.length
        }
        : isFlipQuiz
          ? {
            current:
              quizPos + 1,
            total:
              quizBatch.length
          }
          : modoEstudio ===
            "solo_preguntas"
            ? {
              current:
                posOrden + 1,
              total:
                ordenPreguntas.length
            }
            : {
              current:
                cardIndex + 1,
              total:
                flatPuntos.length
            };

  const nombreCursoActivo =
    cursoSeleccionado ||
    (topicData
      ? topicData.curso
      : null);

  const cursoEncontrado =
    manifest.cursos.find(
      (c) =>
        c.nombre ===
        nombreCursoActivo
    );

  const temasDelCurso =
    cursoEncontrado
      ? cursoEncontrado.temas
      : [];

  return (
    <div className="mi-estudio">
      <WelcomeModal
        open={!nombreUsuario}
        onSubmit={(n) =>
          setNombreUsuario(n)
        }
      />

      <ModoEstudioModal
        open={preguntaModoAbierta}
        onElegir={elegirModoEstudio}
      />

      <PomodoroAlarmModal
        open={
          pomodoroAlarmaAbierta
        }
        label={
          pomodoroAlarmaLabel
        }
        onIrAPomodoro={
          irAPomodoroDesdeAlarma
        }
        onClose={() => {
          setPomodoroAlarmaAbierta(
            false
          );
          limpiarPomodoroCompartido();
        }}
      />

      {/* ============================================================
          NOTIFICACIÓN PERSONALIZADA — SUGERENCIA
          ============================================================ */}

      {sugerenciaMsg && (
        <div
          className={`repaso-toast is-success ${sugerenciaMsgSaliendo
            ? " is-saliendo"
            : ""
            }`}
        >
          <i
            className={
              sugerenciaMsg.startsWith(
                "Tu sugerencia"
              )
                ? "fas fa-circle-check"
                : "fas fa-circle-exclamation"
            }
          />

          <span>
            {sugerenciaMsg}
          </span>
        </div>
      )}

      {topicData && (
        <TopBar
          stage={stage}
          tema={topicData.tema}
          curso={topicData.curso}
          onAbrirBuscador={() =>
            setSearchOpen(true)
          }
          onTogglePomodoroMini={() =>
            setPomodoroMiniOpen(
              (o) => !o
            )
          }
          onAbrirTemas={() =>
            setTemasOpen(true)
          }
          onGuardarRepaso={
            guardarParaRepaso
          }
          isFullscreen={
            isFullscreen
          }
          onToggleFullscreen={
            toggleFullscreen
          }
          onVerPreguntasVistas={
            verPreguntasVistas
          }
          onAbandonar={
            pedirSalirApp
          }
          onIrInicio={
            irAInicio
          }
          onReiniciarTarjetas={
            reiniciarTarjetas
          }
        />
      )}

      {repasoGuardadoMsg && (
        <div
          className={`repaso-toast is-success${repasoGuardadoSaliendo
            ? " is-saliendo"
            : ""
            }`}
        >
          <i className="fas fa-bookmark" />{" "}
          Guardado para repasar
        </div>
      )}

      {sinPreguntaAlerta && (
        <div
          className={`repaso-toast is-top sin-pregunta-alerta${sinPreguntaSaliendo
            ? " is-saliendo"
            : ""
            }`}
        >
          <div className="sin-pregunta-alerta__contenido">
            <i className="fas fa-circle-info" />

            <span>
              No hay preguntas de "
              {topicData?.tema ||
                "este tema"}
              "
            </span>
          </div>

          <button
            type="button"
            className="sin-pregunta-alerta__close"
            onClick={() => {
              sinPreguntaTimers.current.forEach(
                clearTimeout
              );

              setSinPreguntaSaliendo(
                false
              );

              setSinPreguntaAlerta(
                false
              );
            }}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>
      )}

      <PomodoroWidget
        open={pomodoroMiniOpen}
        onClose={() =>
          setPomodoroMiniOpen(
            false
          )
        }
      />

      <Modal
        open={confirmSalirApp}
        onClose={cancelarSalirApp}
      >
        <h3 className="tema-modal-title">
          ¿Salir de la aplicación?
        </h3>

        <p className="tema-modal-subtitle">
          Vas a salir de la web/aplicación.
          Tu progreso ya quedó guardado.
        </p>

        <div className="tema-modal-actions">
          <button
            type="button"
            className="btn-solid"
            onClick={cancelarSalirApp}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={confirmarSalirApp}
          >
            Sí, salir
          </button>
        </div>
      </Modal>

      <div
        className={`config-overlay ${configOpen
          ? ""
          : "is-closed"
          }`}
        aria-hidden={!configOpen}
      >
        <div className="config-overlay__panel">
          {confirmLeave && (
            <div className="config-overlay__confirm animate-bounce">
              Confirmar. Eres un perdedor.
            </div>
          )}

          <div className="config-overlay__row">
            <div className="config-overlay__item">
              <button
                onClick={() =>
                  manejarBotonConfig(
                    "continuar",
                    () => {
                      setConfigOpen(
                        false
                      );

                      setConfirmLeave(
                        false
                      );

                      setBotonArmado(
                        null
                      );
                    }
                  )
                }
                className={`config-overlay__btn ${botonArmado ===
                  "continuar"
                  ? "is-armado"
                  : ""
                  }`}
              >
                <i className="fas fa-play" />
              </button>

              {botonArmado ===
                "continuar" && (
                  <span className="config-overlay__label">
                    Continuar
                  </span>
                )}
            </div>

            <div className="config-overlay__item">
              <button
                onClick={() =>
                  manejarBotonConfig(
                    "pantalla",
                    toggleFullscreen
                  )
                }
                className={`config-overlay__btn ${botonArmado ===
                  "pantalla"
                  ? "is-armado"
                  : ""
                  }`}
              >
                <i
                  className={`fas ${isFullscreen
                    ? "fa-compress"
                    : "fa-expand"
                    }`}
                />
              </button>

              {botonArmado ===
                "pantalla" && (
                  <span className="config-overlay__label">
                    {isFullscreen
                      ? "Minimizar"
                      : "Pantalla Completa"}
                  </span>
                )}
            </div>

            <div className="config-overlay__item">
              <button
                onClick={() =>
                  manejarBotonConfig(
                    "repasar",
                    verPreguntasVistas
                  )
                }
                className={`config-overlay__btn ${botonArmado ===
                  "repasar"
                  ? "is-armado"
                  : ""
                  }`}
              >
                <i className="fas fa-list-check" />
              </button>

              {botonArmado ===
                "repasar" && (
                  <span className="config-overlay__label">
                    Repasar
                  </span>
                )}
            </div>

            <div className="config-overlay__item">
              <button
                onClick={() => {
                  if (confirmLeave) {
                    abandonarJuego();
                  } else {
                    setConfirmLeave(
                      true
                    );
                  }
                }}
                className={`config-overlay__btn ${confirmLeave
                  ? "is-armado"
                  : ""
                  }`}
              >
                <i className="fas fa-door-open" />
              </button>

              {confirmLeave && (
                <span className="config-overlay__label">
                  Abandonar
                </span>
              )}
            </div>

            <div className="config-overlay__item">
              <button
                onClick={() =>
                  manejarBotonConfig(
                    "reiniciar",
                    reiniciarTarjetas
                  )
                }
                className={`config-overlay__btn ${botonArmado ===
                  "reiniciar"
                  ? "is-armado"
                  : ""
                  }`}
              >
                <i className="fas fa-rotate-left" />
              </button>

              {botonArmado ===
                "reiniciar" && (
                  <span className="config-overlay__label">
                    Reiniciar
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className={wrapClass}>
        {!topicData && (
          <>
            <AppHeader showHome />

            <div className="mi-estudio__home-screen container">
              <AvisosInicio />

              <div className="mi-estudio__intro">
                <div>
                  <p className="mi-estudio__intro-eyebrow">
                    Mi Estudio
                  </p>

                  <h1 className="mi-estudio__intro-title">
                    {nombreUsuario
                      ? `¿Qué tema quieres repasar, ${nombreUsuario}?`
                      : "¿Qué tema quieres repasar?"}
                  </h1>

                  {error && (
                    <p className="mi-estudio__error-msg">
                      <i className="fas fa-triangle-exclamation" />{" "}
                      {error}
                    </p>
                  )}
                </div>

                <div className="home-search">
                  <div
                    className={`search-input-row${mostrarHistorialInicio ||
                        (busquedaEnfocada && hayQuery)
                        ? " has-query"
                        : ""
                      }`}
                  >
                    <input
                      autoComplete="off"
                      type="search"
                      name="buscar-inicio"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPaginaHistorialInicio(1);
                      }}
                      onFocus={() =>
                        setBusquedaEnfocada(true)
                      }
                      onBlur={() =>
                        setTimeout(
                          () =>
                            setBusquedaEnfocada(false),
                          150
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          hayQuery &&
                          focusedInicial <= 0
                        ) {
                          e.preventDefault();

                          const mejorOpcion =
                            fuertes.cursos[0] ||
                            fuertes.temas[0];

                          if (mejorOpcion) {
                            seleccionarItem(mejorOpcion);
                            return;
                          }
                        }

                        handleKeyDownInicial(e);
                      }}
                      placeholder="Buscar tema o curso..."
                      className="search-input"
                    />

                    {hayQuery && (
                      <button
                        type="button"
                        className="search-input-clear"
                        aria-label="Limpiar búsqueda"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={() => {
                          setQuery("");
                          setPaginaHistorialInicio(1);
                        }}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    )}

                    <div
                      className="search-input-lupa"
                      onMouseDown={(e) => {
                        e.preventDefault();

                        if (hayQuery) {
                          const mejorOpcion =
                            fuertes.cursos[0] ||
                            fuertes.temas[0];

                          if (mejorOpcion) {
                            seleccionarItem(mejorOpcion);
                          }
                        }
                      }}
                    >
                      <i className="fa-solid fa-magnifying-glass" />
                    </div>
                  </div>

                  {/* ============================================================
      HISTORIAL DE BÚSQUEDA
      ============================================================ */}
                  {mostrarHistorialInicio && (
                    <div className="search-history">
                      {historialInicioVisible.map(
                        (item, index) => {
                          const texto =
                            item.type === "curso"
                              ? item.nombre
                              : item.tema;

                          const historialKey =
                            item.type === "curso"
                              ? `curso-${item.nombre}-${index}`
                              : `tema-${item.curso || ""}-${item.tema || ""}-${item.archivo || ""}-${index}`;

                          return (
                            <button
                              type="button"
                              key={historialKey}
                              className="search-history-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                              }}
                              onClick={() => {
                                seleccionarItem(item);
                              }}
                            >
                              <i className="fa-solid fa-clock-rotate-left" />

                              <span>
                                {texto}
                              </span>
                            </button>
                          );
                        }
                      )}

                      <div className="search-history-actions">
                        {hayMenosHistorialInicio && (
                          <button
                            type="button"
                            className="search-history-more"
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onClick={() => {
                              setPaginaHistorialInicio(
                                (actual) =>
                                  Math.max(1, actual - 1)
                              );
                            }}
                          >
                            <i className="fa-solid fa-chevron-up" />
                            Mostrar -
                          </button>
                        )}

                        {hayMasHistorialInicio && (
                          <button
                            type="button"
                            className="search-history-more"
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onClick={() => {
                              setPaginaHistorialInicio(
                                (actual) => actual + 1
                              );
                            }}
                          >
                            <i className="fa-solid fa-chevron-down" />
                            Mostrar +
                          </button>
                        )}

                        <button
                          type="button"
                          className="search-history-delete"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => {
                            eliminarHistorialInicio();
                            setPaginaHistorialInicio(1);
                          }}
                        >
                          <i className="fa-solid fa-trash" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================
      SUGERENCIAS DEL BUSCADOR
      ============================================================ */}
                  {busquedaEnfocada &&
                    hayQuery &&
                    grupos.length > 0 &&
                    (() => {
                      let idx = -1;

                      return (
                        <div className="home-search-results search-results">
                          {grupos.map((g) => {
                            const idxCurso = ++idx;

                            return (
                              <div
                                key={`grupo-${g.curso}`}
                              >
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();

                                    seleccionarItem({
                                      type: "curso",
                                      nombre: g.curso
                                    });
                                  }}
                                  className={`search-result-item is-curso ${idxCurso === focusedInicial
                                      ? "is-focused"
                                      : ""
                                    }`}
                                >
                                  <span className="curso-title">
                                    {g.curso}
                                  </span>
                                </button>

                                {g.temas.map((t) => {
                                  const idxTema = ++idx;

                                  return (
                                    <button
                                      key={`tema-${t.curso}-${t.tema}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();

                                        seleccionarItem(t);
                                      }}
                                      className={`search-result-item is-tema ${idxTema === focusedInicial
                                          ? "is-focused"
                                          : ""
                                        }`}
                                    >
                                      <p className="search-result-item__tema">
                                        {t.tema}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                  {/* ============================================================
      SIN RESULTADOS
      ============================================================ */}
                  {busquedaEnfocada &&
                    hayQuery &&
                    grupos.length === 0 && (
                      <div className="home-search-empty">
                        <p className="search-empty">
                          Sin resultados para "{query}"
                        </p>
                      </div>
                    )}
                </div>

                {/* ============================================================
    CONTINUAR ÚLTIMO TEMA
    FUERA DE .home-search
    ============================================================ */}
                {ultimoTemaInicio && (
                  <button
                    type="button"
                    className="welcome-section__continuar-btn"
                    onClick={() =>
                      seleccionarItem({
                        type: "tema",
                        curso: ultimoTemaInicio.curso,
                        tema: ultimoTemaInicio.tema,
                        archivo: ultimoTemaInicio.archivo
                      })
                    }
                  >
                    <i className="fa-solid fa-play welcome-section__continuar-icon" />

                    <span>
                      Continuar: {ultimoTemaInicio.tema}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="mi-estudio__below">
              <WelcomeSection
                onSelectTema={
                  seleccionarItem
                }
                temasCompletadosLista={(() => {
                  try {
                    return JSON.parse(
                      localStorage.getItem(
                        "temasCompletados"
                      ) || "[]"
                    );
                  } catch {
                    return [];
                  }
                })()}
              />
            </div>
          </>
        )}

        {topicData &&
          (stage === "theory" ||
            stage ===
            "question") && (
            <div className="mi-estudio__stage container">
              {stage ===
                "question" && (
                  <div className="mi-estudio__hud-wrap animate-fade-in">
                    <Hud
                      current={
                        progresoPregunta.current
                      }
                      total={
                        progresoPregunta.total
                      }
                      correct={score}
                      wrong={
                        wrongCount
                      }
                      vidas={vidas}
                    />
                  </div>
                )}

              {/* ============================================================
                  VISTA DE TEORÍA: TODO EN UNA SOLA PANTALLA
                  ============================================================ */}
              {stage === "theory" && flatPuntos.length > 0 && (
                <div className="mi-estudio__theory-wrap">
                  <div className="teoria-sticky-bar">
                    <TheorySearchBar
                      flatPuntos={flatPuntos}
                      onSelect={(puntoId) => {
                        setPuntoVozId(puntoId);
                        document
                          .getElementById(`punto-${puntoId}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setLecturaTeoriaOn((v) => !v)}
                      className={`mi-estudio__voz-btn ${lecturaTeoriaOn ? "is-on" : "is-off"}`}
                      title={lecturaTeoriaOn ? "Desactivar lectura en voz" : "Leer teoría en voz alta"}
                    >
                      <i className={`fa-solid ${lecturaTeoriaOn ? "fa-volume-high" : "fa-volume-xmark"}`} />
                    </button>
                  </div>

                  <div className="teoria-articulo-web">
                    {/* Estilos inyectados basados en la paleta y requerimientos del usuario */}
                    <style>{`
                      .teoria-articulo-web {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px 20px 80px 20px;
                      }
                      .teoria-top-actions {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 30px;
                      }
                      .teoria-seccion {
                        margin-bottom: 56px;
                      }
                      .teoria-etiqueta-wrap {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 16px;
                        border-bottom: 1px solid var(--border, #2A2A2A);
                        padding-bottom: 8px;
                        cursor: pointer;
                        user-select: none;
                      }
                      .teoria-etiqueta-checkbox {
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                        accent-color: var(--primary, #F7DF1E);
                      }
                      .teoria-etiqueta {
                        font-family: var(--font-display, "Raleway", sans-serif);
                        font-size: 1.8rem;
                        font-weight: 700;
                        color: var(--primary, #F7DF1E);
                        margin: 0;
                        line-height: 1.3;
                      }
                      .teoria-punto {
                        margin-bottom: 32px;
                      }
                      .teoria-punto.is-leyendo .teoria-contenido-principal {
                        color: var(--primary, #F7DF1E);
                      }
                      .teoria-contenido-principal {
                        font-family: var(--font-body, "Lato", sans-serif);
                        font-size: 1.15rem;
                        line-height: 1.8;
                        color: var(--ink, #FFFFFF);
                        margin-bottom: 24px;
                      }
                      .teoria-explicacion-extra {
                        background-color: var(--surface, #171717);
                        padding: 24px;
                        border-radius: var(--radius-md, 12px);
                        border-left: 4px solid var(--primary, #F7DF1E);
                        color: var(--ink-soft, #D4D4D8);
                        font-size: 1.05rem;
                        line-height: 1.7;
                      }
                      .teoria-explicacion-icon {
                        color: var(--primary, #F7DF1E);
                        font-size: 1.3rem;
                        margin-top: 4px;
                      }
                      .teoria-boton-examen {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        background-color: var(--primary, #F7DF1E);
                        color: var(--ink-on-primary, #000);
                        padding: 16px 36px;
                        font-size: 1.25rem;
                        font-family: var(--font-display, "Raleway", sans-serif);
                        font-weight: 700;
                        border-radius: var(--radius-full, 999px);
                        border: none;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        box-shadow: var(--shadow-md);
                      }
                      .teoria-boton-examen:hover {
                        background-color: var(--primary-light, #FCEF74);
                        transform: translateY(-2px);
                        box-shadow: var(--shadow-lg);
                      }
                      @media (max-width: 600px) {
                        .teoria-articulo-web {
                          padding: 10px 15px 40px 15px;
                        }
                        .teoria-etiqueta {
                          font-size: 1.5rem;
                        }
                        .teoria-contenido-principal {
                          font-size: 1.05rem;
                        }
                        .teoria-explicacion-extra {
                          padding: 16px;
                          font-size: 1rem;
                        }
                        .teoria-boton-examen {
                           width: 100%;
                           padding: 16px 20px;
                        }
                      }
                    `}</style>

                    {/* Mapeamos por sección y ponemos los checks a nivel de texto (punto) */}
                    {topicData?.theory?.map((seccion, idxSeccion) => (
                      <div key={idxSeccion} className="teoria-seccion">
                        <div className="teoria-etiqueta-wrap">
                          <h3 className="teoria-etiqueta">
                            {seccion.titulo}
                          </h3>
                        </div>

                        {/* El contenido siempre es visible, los checks definen qué irá al examen */}
                        <div className="teoria-puntos-lista animate-fade-in">
                          {seccion.puntos.map((punto, idxPunto) => {
                            const puntoId = `${idxSeccion}-${idxPunto}`;

                            return (
                              <div
                                key={idxPunto}
                                id={`punto-${puntoId}`}
                                className={`teoria-punto${puntoVozId === puntoId ? " is-leyendo" : ""}`}
                              >
                                <div
                                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}
                                  onClick={() => setPuntoVozId(puntoId)}
                                >
                                  <input
                                    type="checkbox"
                                    id={`checkbox-${puntoId}`}
                                    style={{ marginTop: '6px', width: '20px', height: '20px', accentColor: 'var(--primary, #F7DF1E)', flexShrink: 0, cursor: 'pointer' }}
                                    checked={textosSeleccionados.includes(puntoId)}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => {
                                      setTextosSeleccionados((prev) =>
                                        prev.includes(puntoId)
                                          ? prev.filter((t) => t !== puntoId)
                                          : [...prev, puntoId]
                                      );
                                    }}
                                  />
                                  <label htmlFor={`checkbox-${puntoId}`} className="teoria-contenido-principal" style={{ margin: 0, cursor: 'pointer' }}>
                                    <GlossaryText
                                      text={punto.texto}
                                      glosario={topicData?.glosario}
                                    />
                                  </label>
                                </div>

                                {punto.explicacion && (
                                  <div className="teoria-explicacion-extra">
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                      <i className="fa-solid fa-lightbulb teoria-explicacion-icon" />
                                      <div style={{ flex: 1 }}>
                                        <GlossaryText
                                          text={punto.explicacion}
                                          glosario={topicData?.glosario}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="mi-estudio__google" style={{ marginTop: '20px', marginBottom: '60px' }}>
                      <div className="mi-estudio__google-input-wrap">
                        <input
                          autoComplete="off"
                          type="search"
                          name="buscar-google"
                          value={googleQuery}
                          onChange={(e) => setGoogleQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && buscarEnGoogle()}
                          placeholder="Pregúntale a Google..."
                          className="mi-estudio__google-input"
                        />
                        <button onClick={buscarEnGoogle} className="mi-estudio__google-btn">
                          <i className="fab fa-google" />
                        </button>
                      </div>
                    </div>

                    {/* Botón final para transicionar a las preguntas */}
                    <div style={{ textAlign: 'center' }}>
                      {examenPreguntas.length > 0 ? (
                        <button
                          className="teoria-boton-examen"
                          onClick={() => elegirModoEstudio("solo_preguntas")}
                        >
                          <i className="fa-solid fa-gamepad"></i>
                          Ir al Examen
                        </button>
                      ) : (
                        <button
                          className="teoria-boton-examen"
                          onClick={finalizarTema}
                        >
                          <i className="fa-solid fa-check-circle"></i>
                          Completar Tema
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {stage ===
                "question" && (
                  <div className="mi-estudio__question-stage">
                    {countdown >
                      0 ? (
                      <div className="mi-estudio__countdown-wrap animate-fade-in">
                        <h2 className="mi-estudio__countdown-number">
                          {
                            countdown
                          }
                        </h2>

                        <p className="mi-estudio__countdown-text">
                          Intenta recordar
                          la teoría
                          antes de ver
                          la pregunta...
                        </p>
                      </div>
                    ) : (
                      <div className="mi-estudio__question-inner animate-fade-in">
                        <QuestionCard
                          key={`${repasoQuizActivo
                            ? "repaso-" +
                            repasoQuizPos
                            : isLevelMode
                              ? "nivel-" +
                              nivelIndex
                              : isFlipQuiz
                                ? "flip-" +
                                cardIndex +
                                "-" +
                                quizPos
                                : "teoria-" +
                                cardIndex
                            }-${attemptKey}`}
                          pregunta={
                            preguntaActual
                          }
                          onRespondido={
                            manejarRespuesta
                          }
                        />
                      </div>
                    )}
                  </div>
                )}

              {/* Los botones de navegación inferiores (Avanzar, Retroceder) 
                  sólo aparecen cuando estás en la fase de preguntas */}
              {stage === "question" && (
                <div className="mi-estudio__nav">
                  <button
                    onClick={retrocederCard}
                    disabled={
                      isLevelMode
                        ? nivelIndex === 0
                        : isFlipQuiz
                          ? quizPos === 0
                          : cardIndex === 0
                    }
                    className={`mi-estudio__nav-btn ${(
                      isLevelMode
                        ? nivelIndex === 0
                        : isFlipQuiz
                          ? quizPos === 0
                          : cardIndex === 0
                    )
                      ? ""
                      : "is-active"
                      }`}
                    title="Anterior"
                  >
                    <i className="fas fa-caret-left" />
                  </button>

                  <div className="mi-estudio__nav-right">
                    {(() => {
                      const esUltimo =
                        repasoQuizActivo
                          ? repasoQuizPos ===
                          repasoQuizBatch.length - 1
                          : isLevelMode
                            ? nivelIndex ===
                            examenPreguntas.length - 1
                            : isFlipQuiz
                              ? quizPos ===
                              quizBatch.length - 1
                              : cardIndex ===
                              flatPuntos.length - 1;

                      const bloqueado = !canAdvance;

                      return (
                        <>
                          <button
                            onClick={avanzarCard}
                            disabled={bloqueado}
                            className={`mi-estudio__nav-btn ${bloqueado
                              ? ""
                              : "is-active"
                              }`}
                            title="Siguiente"
                          >
                            {esUltimo && canAdvance ? (
                              <i className="fas fa-flag-checkered" />
                            ) : (
                              <i className="fas fa-caret-right" />
                            )}
                          </button>

                          {!canAdvance && !esUltimo && (
                            <span className="mi-estudio__nav-hint">
                              ¡Supera la pregunta para avanzar!
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {stage ===
                "question" &&
                questionResult && (
                  <div className="mi-estudio__explanation-wrap">
                    <ExplanationPanel
                      pregunta={
                        preguntaActual
                      }
                      isCorrect={
                        questionResult.isCorrect
                      }
                      onSiguiente={
                        avanzarCard
                      }
                      onReintentar={
                        reintentarPregunta
                      }
                    />
                  </div>
                )}

              {stage ===
                "theory" && (
                  <div className="mi-estudio__pdf-buttons">
                    <button
                      type="button"
                      className="mi-estudio__pdf-btn"
                      onClick={() => {
                        if (
                          !topicData?.archivo
                        ) {
                          return;
                        }

                        const pdfRelativo =
                          topicData.archivo
                            .replace(
                              /^temas\//i,
                              "PDFs/"
                            )
                            .replace(
                              /\.json$/i,
                              ".pdf"
                            );

                        const rutaPdf = `${window.location.origin}${import.meta.env.BASE_URL}${pdfRelativo}`;

                        window.open(
                          rutaPdf,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      <i className="fas fa-file-pdf" />{" "}
                      Ver PDF
                    </button>

                    <a
                      href={
                        topicData?.archivo
                          ? `${import.meta.env.BASE_URL}${topicData.archivo
                            .replace(
                              /^temas\//i,
                              "PDFs/"
                            )
                            .replace(
                              /\.json$/i,
                              ".pdf"
                            )}`
                          : "#"
                      }
                      download
                      className="mi-estudio__pdf-btn"
                    >
                      <i className="fas fa-download" />{" "}
                      Descargar PDF
                    </a>
                  </div>
                )}
            </div>
          )}

        {/* ============================================================
            SUGERIR EXAMEN
            ============================================================ */}

        {topicData &&
          stage === "theory" &&
          examenPreguntas.length ===
          0 && (
            <section className="mi-estudio__suggestion">
              <button
                type="button"
                className="mi-estudio__suggestion-btn"
                onClick={() =>
                  setMostrarModalSugerencia(
                    true
                  )
                }
              >
                <i className="fa-solid fa-file-circle-plus"></i>
                <span>
                  Sugerir examen
                </span>
              </button>
            </section>
          )}

        {/* ============================================================
            MODAL — SUGERIR EXAMEN
            ============================================================ */}

        {mostrarModalSugerencia && (
          <div
            className="mi-estudio__modal-overlay"
            onClick={() => setMostrarModalSugerencia(false)}
          >
            <div
              className="mi-estudio__modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mi-estudio__modal-header">
                <div>
                  <p className="suguerir__title">
                    Sugerir examen
                  </p>

                  <p className="mi-estudio__modal-desc">
                    Tema:{" "}
                    <strong>
                      {topicData.tema ||
                        topicData.nombre ||
                        "Tema actual"}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="mi-estudio__modal-close"
                  onClick={() => setMostrarModalSugerencia(false)}
                  aria-label="Cerrar"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="mi-estudio__modal-body">
                <label
                  className="mi-estudio__campo"
                  htmlFor="sugerencia-texto"
                >
                  <span className="mi-estudio__campo-label">
                    ¿Qué te gustaría que incluya?
                  </span>

                  <textarea
                    id="sugerencia-texto"
                    className="mi-estudio__textarea"
                    value={textoSugerencia}
                    onChange={(e) =>
                      setTextoSugerencia(e.target.value)
                    }
                    placeholder="Escribe tu sugerencia..."
                    rows={4}
                  />
                </label>
              </div>

              <div className="mi-estudio__modal-footer">
                <button
                  type="button"
                  className="mi-estudio__modal-cancel"
                  onClick={() => setMostrarModalSugerencia(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="mi-estudio__modal-submit"
                  onClick={enviarSugerenciaExamen}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  Enviar sugerencia
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "finished" && (
          <div className="mi-estudio__finished">
            {confirmGuardarRepasoFinal ? (
              <>
                <div className="mi-estudio__finished-emoji animate-bounce">
                  <i className="fas fa-thumbtack" />
                </div>

                <h2 className="mi-estudio__finished-title">
                  ¿Guardar este tema
                  en tus repasos?
                </h2>

                <p className="mi-estudio__finished-sub">
                  Así te va a aparecer
                  en la sección de
                  Repasos para
                  reforzarlo más
                  adelante.
                </p>

                <div className="mi-estudio__finished-btn-row">
                  <button
                    onClick={() =>
                      confirmarGuardarRepasoFinal(
                        true
                      )
                    }
                    className="mi-estudio__finished-btn is-inline"
                  >
                    Sí, guardar
                  </button>

                  <button
                    onClick={() =>
                      confirmarGuardarRepasoFinal(
                        false
                      )
                    }
                    className="mi-estudio__finished-btn is-outline is-inline"
                  >
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
                  {nombreUsuario
                    ? `¡Tema completado, ${nombreUsuario}!`
                    : "¡Tema completado!"}
                </h2>

                <p className="mi-estudio__finished-sub">
                  Excelente trabajo
                  leyendo toda la
                  teoría.
                </p>

                <button
                  onClick={() =>
                    setTemasOpen(
                      true
                    )
                  }
                  className="mi-estudio__finished-btn"
                >
                  Elegir otro tema
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {topicData && (
        <SeenQuestionsModal
          open={
            seenQuestionsOpen
          }
          onClose={() =>
            setSeenQuestionsOpen(
              false
            )
          }
          preguntasVistas={
            preguntasVistas
          }
          flatPuntos={
            flatPuntos
          }
        />
      )}

      <SearchModal
        open={searchOpen}
        onClose={() =>
          setSearchOpen(false)
        }
        onSelect={
          seleccionarItem
        }
      />

      {nombreCursoActivo && (
        <TopicsModal
          open={temasOpen}
          onClose={() =>
            setTemasOpen(false)
          }
          curso={
            nombreCursoActivo
          }
          temaActual={
            topicData
              ? topicData.tema
              : null
          }
          listaTemas={
            temasDelCurso
          }
          onSelectTema={(
            temaItem
          ) => {
            abrirTema({
              curso:
                nombreCursoActivo,
              tema:
                temaItem.tema,
              archivo:
                temaItem.archivo
            });
          }}
        />
      )}

      <audio
        ref={vidaPerderRef}
        src={`${import.meta.env.BASE_URL}sonidos/vida-perder.mp3`}
        preload="auto"
      />

      <audio
        ref={ceroVidasRef}
        src={`${import.meta.env.BASE_URL}sonidos/cero-vidas.mp3`}
        preload="auto"
      />

      <audio
        ref={
          alertaNotificacionRef
        }
        src={`${import.meta.env.BASE_URL}sonidos/notificacion.mp3`}
        preload="auto"
      />

      {alertaVidas ===
        "tres" && (
          <div className="vidas-fullscreen animate-fade-in">
            <div className="vidas-fullscreen__content">
              <h2 className="vidas-fullscreen__title is-tres">
                <i className="fas fa-triangle-exclamation" />{" "}
                3 vidas
              </h2>

              {renderCorazonesVidas()}

              <p className="vidas-fullscreen__sub">
                No te confíes.
              </p>
            </div>
          </div>
        )}

      {alertaVidas ===
        "una" && (
          <div className="vidas-fullscreen animate-fade-in">
            <div className="vidas-fullscreen__content">
              <h2 className="vidas-fullscreen__title is-una">
                <i className="fas fa-fire" />{" "}
                1 vida
              </h2>

              {renderCorazonesVidas()}

              <p className="vidas-fullscreen__sub">
                Última oportunidad.
              </p>
            </div>
          </div>
        )}

      {alertaVidas ===
        "cero" && (
          <div className="vidas-fullscreen animate-fade-in">
            <div className="vidas-fullscreen__content">
              <h1 className="vidas-fullscreen__title-big">
                GAME OVER
              </h1>

              {renderCorazonesVidas()}

              <p className="vidas-fullscreen__sub is-muted">
                Progreso reiniciado.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}