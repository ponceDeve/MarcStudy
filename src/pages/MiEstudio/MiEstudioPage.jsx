import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import manifest from "../../data/manifest.json";
import { registrarCursoCompletado } from "../../lib/repasoStorage";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import AppHeader from "../../components/AppHeader";
import QuestionCard from "./QuestionCard";
import ExplanationPanel from "./ExplanationPanel";
import GlossaryText from "./Glossarytext";
import TopBar from "./TopBar";
import TheorySearchBar from "./TheorySearchBar";
import Hud from "./Hud";
import LevelsModal from "./LevelsModal";
import SearchModal from "../../components/SearchModal";
import WelcomeModal from "./WelcomeModal";
import ModoEstudioModal from "./ModoEstudioModal";
import PomodoroAlarmModal from "./PomodoroAlarmModal";
import PomodoroWidget from "../../components/PomodoroWidget";
import TopicsModal from "./TopicsModal";
import { leerPomodoroCompartido, guardarRetorno, limpiarPomodoroCompartido } from "../../lib/pomodoroShared";
import { buscarConPuntaje, normalizarTexto } from "../../lib/buscador";
import 'katex/dist/katex.min.css';

const OPCIONES_BUSQUEDA = [
  ...manifest.cursos.map((c) => ({
    type: "curso",
    nombre: c.nombre
  })),
  ...manifest.cursos.flatMap((c) =>
    c.temas.map((t) => ({
      type: "tema",
      curso: c.nombre,
      tema: t.tema,
      archivo: t.archivo
    }))
  ),
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MiEstudioPage() {
  const [query, setQuery] = useState("");
  const [topicData, setTopicData] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flatPuntos, setFlatPuntos] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [maxUnlocked, setMaxUnlocked] = useState(0);
  const [stage, setStage] = useState("theory"); // 'theory' | 'question' | 'finished'
  const [isLevelMode, setIsLevelMode] = useState(false);

  // ESTADO PARA EL CRONÓMETRO
  const [countdown, setCountdown] = useState(0);

  // ESTADOS DEL MODO HARDCORE
  const [vidas, setVidas] = useState(5);
  const [alertaVidas, setAlertaVidas] = useState(null);

  // Niveles de examen: independientes de las tarjetas de teoría (flatPuntos)
  const [examenPreguntas, setExamenPreguntas] = useState([]);
  const [nivelIndex, setNivelIndex] = useState(0);
  const [nivelMaxUnlocked, setNivelMaxUnlocked] = useState(0);
  const [nivelCompletions, setNivelCompletions] = useState({});

  const [levelsOpen, setLevelsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pomodoroMiniOpen, setPomodoroMiniOpen] = useState(false);
  const [temasOpen, setTemasOpen] = useState(false);

  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [questionResult, setQuestionResult] = useState(null);
  const [attemptKey, setAttemptKey] = useState(0);
  const [googleQuery, setGoogleQuery] = useState("");
  const [levelCompletions, setLevelCompletions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [configOpen, setConfigOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Nombre del usuario, pedido una sola vez en WelcomeModal y reutilizado
  // en los mensajes de felicitación/derrota de toda la app.
  const [nombreUsuario, setNombreUsuario] = useLocalStorage("miEstudio_nombreUsuario", null);

  // Modal "¿Quieres ver la teoría?": aparece ENCIMA del tema recién
  // abierto (que ya carga y se ve de fondo), no antes de abrirlo.
  const [preguntaModoAbierta, setPreguntaModoAbierta] = useState(false);
  const [modoEstudio, setModoEstudio] = useState("completo"); // 'completo' | 'solo_preguntas'

  // Aviso de "se acabó el pomodoro": Pomodoro corre en su propia
  // pestaña/página, así que acá se revisa cada segundo si ya terminó
  // (comparando la hora de fin guardada en localStorage) para avisar
  // sin depender de estar mirando esa otra pestaña.
  const [pomodoroAlarmaAbierta, setPomodoroAlarmaAbierta] = useState(false);
  const [pomodoroAlarmaLabel, setPomodoroAlarmaLabel] = useState("");
  const pomodoroAlertadoRef = useRef(null);

  useEffect(() => {
    // Si el pomodoro terminó hace más de esto, ya no es un aviso útil:
    // es basura vieja de una pestaña que se cerró sin pausar/terminar.
    const UMBRAL_AVISO_VENCIDO_MS = 2 * 60 * 1000; // 2 minutos

    const intervalo = setInterval(() => {
      const estado = leerPomodoroCompartido();
      if (!estado || !estado.running) return;

      const msDesdeQueTermino = Date.now() - estado.endTimestamp;
      if (msDesdeQueTermino < 0) return; // todavía no termina

      if (msDesdeQueTermino > UMBRAL_AVISO_VENCIDO_MS) {
        // Estado abandonado de una sesión pasada: se descarta sin avisar.
        limpiarPomodoroCompartido();
        return;
      }

      if (pomodoroAlertadoRef.current !== estado.endTimestamp) {
        pomodoroAlertadoRef.current = estado.endTimestamp;
        setPomodoroAlarmaLabel(estado.label || "");
        setPomodoroAlarmaAbierta(true);
        limpiarPomodoroCompartido();
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  function irAPomodoroDesdeAlarma() {
    setPomodoroAlarmaAbierta(false);
    if (topicData?.tema) guardarRetorno(topicData.tema);
    window.location.href = `${window.location.origin}/cont_crono/pomodoro`;
  }

  const [busquedaEnfocada, setBusquedaEnfocada] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return buscarConPuntaje(
      OPCIONES_BUSQUEDA.filter((item) => item.type === "curso"),
      query,
      (item) => item.nombre,
    ).slice(0, 8);
  }, [query]);

  // Si no hay nada escrito pero el buscador está enfocado, se listan
  // todos los cursos (igual que el buscador de temas dentro del mapa),
  // para que el usuario no tenga que adivinar el nombre.
  const todosLosCursos = useMemo(
    () => OPCIONES_BUSQUEDA.filter((item) => item.type === "curso"),
    [],
  );
  const resultsVisibles = query.trim() ? results : todosLosCursos;

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Recuerda en qué tarjeta de teoría te quedaste en este tema, para
  // retomarla ahí la próxima vez (en vez de reiniciar siempre en la 0).
  useEffect(() => {
    if (!topicData || stage !== "theory") return;
    localStorage.setItem(`ultimaCard_${topicData.curso}_${topicData.tema}`, cardIndex);
  }, [topicData, stage, cardIndex]);

  // EFECTO PARA EL CRONÓMETRO
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

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error al entrar en pantalla completa:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  async function abrirTema(item) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(item.archivo);
      if (!res.ok) throw new Error("No se encontró el archivo del tema");
      const data = await res.json();
      const puntos = (data.theory || []).flatMap((seccion) =>
        seccion.puntos.map((p) => ({ ...p, seccionTitulo: seccion.titulo })),
      );
      const examenList = data.examen || [];

      const storageCompletionsKey = `completions_${item.curso}_${item.tema}`;
      const storedCompletions = JSON.parse(
        localStorage.getItem(storageCompletionsKey) || "{}",
      );
      setLevelCompletions(storedCompletions);

      const storageMaxUnlKey = `maxUnlocked_${item.curso}_${item.tema}`;
      const storedMax = parseInt(
        localStorage.getItem(storageMaxUnlKey) || "0",
        10,
      );
      setMaxUnlocked(storedMax);

      const storageNivelCompletionsKey = `examenCompletions_${item.curso}_${item.tema}`;
      const storedNivelCompletions = JSON.parse(
        localStorage.getItem(storageNivelCompletionsKey) || "{}",
      );
      setNivelCompletions(storedNivelCompletions);

      const storageNivelMaxKey = `examenMaxUnlocked_${item.curso}_${item.tema}`;
      const storedNivelMax = parseInt(
        localStorage.getItem(storageNivelMaxKey) || "0",
        10,
      );
      setNivelMaxUnlocked(storedNivelMax);
      setExamenPreguntas(examenList);
      setNivelIndex(0);

      const storageUltimaCardKey = `ultimaCard_${item.curso}_${item.tema}`;
      const storedUltimaCard = parseInt(localStorage.getItem(storageUltimaCardKey) || "0", 10);
      const cardInicial = Math.min(Math.max(storedUltimaCard, 0), Math.max(puntos.length - 1, 0));

      setTopicData({ ...data, curso: item.curso, tema: item.tema });
      setFlatPuntos(puntos);
      setCardIndex(cardInicial);
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

      // Reset de vidas y alertas al iniciar
      setVidas(5);
      setAlertaVidas(null);

      // El tema ya está abierto (se ve de fondo) — recién ahora se
      // pregunta si quiere ver la teoría o saltar directo a preguntas.
      setPreguntaModoAbierta(true);
    } catch (e) {
      console.error("Error en abrirTema:", e);
      setError(`No pude cargar "${item.tema}". (${e.message})`);
    } finally {
      setLoading(false);
    }
  }

  function seleccionarItem(item) {
    if (item.type === "curso") {
      setCursoSeleccionado(item.nombre);
      setTemasOpen(true);
      setSearchOpen(false);
      setQuery("");
    } else {
      setCursoSeleccionado(item.curso);
      setTemasOpen(false);
      abrirTema(item);
    }
  }

  function elegirModoEstudio(modo) {
    setPreguntaModoAbierta(false);
    if (modo === "solo_preguntas") {
      setModoEstudio("solo_preguntas");
      setStage("question");
      setCountdown(0);
    }
  }

  // Si se llega con ?q=nombre-del-tema (ej. desde el link "Repasar en
  // Mi Estudio" de la página de Repaso), se busca y abre directo.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    const qNorm = normalizarTexto(q);

    const temaMatch = OPCIONES_BUSQUEDA.find(
      (item) => item.type === "tema" && normalizarTexto(item.tema) === qNorm,
    );
    const cursoMatch = OPCIONES_BUSQUEDA.find(
      (item) => item.type === "curso" && normalizarTexto(item.nombre) === qNorm,
    );

    if (temaMatch) {
      seleccionarItem(temaMatch);
    } else if (cursoMatch) {
      seleccionarItem(cursoMatch);
    }

    // Limpia el parámetro de la URL para no reabrir en cada recarga.
    // Se usa el API nativo del navegador (no setSearchParams de React
    // Router) porque ese, combinado con el basename "/cont_crono",
    // dejaba la URL rota (duplicaba o perdía el prefijo).
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { focusedIdx: focusedInicial, handleKeyDown: handleKeyDownInicial } =
    useArrowKeyList(resultsVisibles, seleccionarItem);

  function toggleStage() {
    setIsLevelMode(false);
    if (stage === "theory") {
      setCountdown(10); // Iniciamos el cronómetro estricto
      setStage("question");
    } else {
      setCountdown(0);
      setQuestionResult(null);
      setAttemptKey((k) => k + 1);
      setStage("theory");
    }
  }

  function irANivel(idx) {
    setNivelIndex(idx);
    setIsLevelMode(true);
    setStage("question");
    setQuestionResult(null);
    setAttemptKey(0);
    setLevelsOpen(false);
    setCountdown(0);
  }

  function avanzarCard() {
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
    if (cardIndex < flatPuntos.length - 1) {
      setCardIndex(cardIndex + 1);
      const siguienteStage = modoEstudio === "solo_preguntas" ? "question" : "theory";
      setStage(siguienteStage);
      setIsLevelMode(false);
      setQuestionResult(null);
      setAttemptKey(0);
      setCountdown(0);
    } else {
      finalizarTema();
    }
  }

  function retrocederCard() {
    if (isLevelMode) {
      if (nivelIndex > 0) {
        setNivelIndex(nivelIndex - 1);
        setQuestionResult(null);
        setAttemptKey(0);
      }
      return;
    }
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
      const anteriorStage = modoEstudio === "solo_preguntas" ? "question" : "theory";
      setStage(anteriorStage);
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
    setStage("finished");
    if (topicData) {
      registrarCursoCompletado({
        subject: topicData.curso,
        tema: topicData.tema,
      });
    }
  }

  // Guardar el tema para repasarlo después SIN necesidad de terminarlo
  // (por si el usuario se queda a medias pero igual lo quiere repasar).
  const [repasoGuardadoMsg, setRepasoGuardadoMsg] = useState(false);
  function guardarParaRepaso() {
    if (!topicData) return;
    registrarCursoCompletado({
      subject: topicData.curso,
      tema: topicData.tema,
    });
    setRepasoGuardadoMsg(true);
    setTimeout(() => setRepasoGuardadoMsg(false), 2200);
  }

  // NUEVA FUNCIÓN: Game Over y Limpieza de Disco
  function gameOver() {
    if (!topicData) return;

    // 1. Borrar progreso del localStorage
    localStorage.removeItem(`completions_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`maxUnlocked_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`examenCompletions_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`examenMaxUnlocked_${topicData.curso}_${topicData.tema}`);
    localStorage.removeItem(`ultimaCard_${topicData.curso}_${topicData.tema}`);

    // 2. Limpiar estados para forzar inicio en nivel 1
    setLevelCompletions({});
    setMaxUnlocked(0);
    setNivelCompletions({});
    setNivelMaxUnlocked(0);
    setCardIndex(0);
    setNivelIndex(0);

    // 3. Regresar a la pantalla de teoría y reiniciar variables de intento
    setStage("theory");
    setIsLevelMode(false);
    setScore(0);
    setWrongCount(0);
    setQuestionResult(null);
    setAttemptKey(0);
    setCountdown(0);
  }

  function manejarRespuesta(correcto) {
    setQuestionResult({ isCorrect: correcto });
    if (correcto) {
      setScore((s) => s + 1);

      if (isLevelMode) {
        setNivelCompletions((prev) => {
          const newCompletions = { ...prev, [nivelIndex]: (prev[nivelIndex] || 0) + 1 };
          if (topicData) {
            localStorage.setItem(
              `examenCompletions_${topicData.curso}_${topicData.tema}`,
              JSON.stringify(newCompletions),
            );
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
            localStorage.setItem(
              `completions_${topicData.curso}_${topicData.tema}`,
              JSON.stringify(newCompletions),
            );
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

      // Las vidas son un mecanismo exclusivo del modo niveles (examen).
      // Fallar durante la teoría ya no cuesta vidas.
      if (isLevelMode) {
        setVidas((prevVidas) => {
          const nuevasVidas = prevVidas - 1;

          if (nuevasVidas === 3) {
            setAlertaVidas("tres");
          } else if (nuevasVidas === 1) {
            setAlertaVidas("una");
          } else if (nuevasVidas <= 0) {
            setAlertaVidas("cero");
            gameOver();
          }

          return nuevasVidas;
        });
      }
    }
  }

  function abandonarJuego() {
    // Si estamos en modo niveles, al abandonar regresamos a la teoría inicial del tema (cardIndex 0)
    setStage("theory");
    setIsLevelMode(false);
    setCardIndex(0);
    setConfigOpen(false);
    setConfirmLeave(false);
    setCountdown(0);
  }

  function buscarEnGoogle() {
    const q = googleQuery.trim();
    if (!q) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
  }

  const current = isLevelMode ? examenPreguntas[nivelIndex] : flatPuntos[cardIndex];
  const preguntaActual = isLevelMode ? current : current ? current.pregunta : null;
  // En el estudio normal (no en modo nivel/examen) se puede avanzar
  // libremente sin haber respondido — el examen por niveles sí exige
  // ir superando cada pregunta para desbloquear la siguiente.
  const canAdvance = isLevelMode ? nivelIndex < nivelMaxUnlocked : true;

  useEffect(() => {
    function onKeyDown(e) {
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;
      if (levelsOpen || searchOpen || configOpen || temasOpen || !topicData) return;

      // Ignorar teclas si el cronómetro está activo
      if (stage === "question" && countdown > 0) return;

      if (e.key === "Enter") {
        if (stage === "theory" && !isLevelMode) {
          e.preventDefault();
          toggleStage();
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
        retrocederCard();
      } else if (e.key === "ArrowRight") {
        if (canAdvance) avanzarCard();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, questionResult, levelsOpen, searchOpen, configOpen, temasOpen, topicData, cardIndex, flatPuntos, maxUnlocked, nivelIndex, examenPreguntas, nivelMaxUnlocked, canAdvance, isLevelMode, countdown]);

  const wrapClass = ["mi-estudio__wrap", topicData && !isLevelMode ? "has-topbar" : ""].join(" ");

  const nombreCursoActivo = cursoSeleccionado || (topicData ? topicData.curso : null);
  const cursoEncontrado = manifest.cursos.find(c => c.nombre === nombreCursoActivo);
  const temasDelCurso = cursoEncontrado ? cursoEncontrado.temas : [];

  return (
    <div className="mi-estudio">
      <WelcomeModal open={!nombreUsuario} onSubmit={(n) => setNombreUsuario(n)} />
      <ModoEstudioModal open={preguntaModoAbierta} onElegir={elegirModoEstudio} />
      <PomodoroAlarmModal
        open={pomodoroAlarmaAbierta}
        label={pomodoroAlarmaLabel}
        onIrAPomodoro={irAPomodoroDesdeAlarma}
        onClose={() => setPomodoroAlarmaAbierta(false)}
      />

      {/* El TopBar solo se muestra si hay tema y NO estamos en modo niveles */}
      {topicData && !isLevelMode && (
        <TopBar
          tema={topicData.tema}
          curso={topicData.curso}
          onAbrirNiveles={() => setLevelsOpen(true)}
          onAbrirBuscador={() => setSearchOpen(true)}
          onTogglePomodoroMini={() => setPomodoroMiniOpen((o) => !o)}
          onAbrirTemas={() => setTemasOpen(true)}
          onGuardarRepaso={guardarParaRepaso}
        />
      )}

      {repasoGuardadoMsg && (
        <div className="repaso-toast">
          <i className="fas fa-bookmark" /> Guardado para repasar
        </div>
      )}

      <PomodoroWidget open={pomodoroMiniOpen} onClose={() => setPomodoroMiniOpen(false)} />

      {configOpen && (
        <div className="config-overlay">
          {confirmLeave && (
            <div className="config-overlay__confirm animate-bounce">
              Confirmar. Eres un perdedor.
            </div>
          )}
          <div className="config-overlay__row">
            <div className="config-overlay__item">
              <button
                onClick={() => {
                  if (confirmLeave) abandonarJuego();
                  else setConfirmLeave(true);
                }}
                className="config-overlay__btn is-danger"
              >
                <i className="fas fa-door-open" />
              </button>
              <span className="config-overlay__label">Abandonar</span>
            </div>

            <div className="config-overlay__item">
              <button onClick={toggleFullscreen} className="config-overlay__btn is-primary">
                <i className={`fas ${isFullscreen ? "fa-compress" : "fa-expand"}`} />
              </button>
              <span className="config-overlay__label">
                {isFullscreen ? "Minimizar" : "Pantalla Completa"}
              </span>
            </div>

            <div className="config-overlay__item">
              <button
                onClick={() => {
                  setConfigOpen(false);
                  setConfirmLeave(false);
                }}
                className="config-overlay__btn is-success"
              >
                <i className="fas fa-play" />
              </button>
              <span className="config-overlay__label">Continuar</span>
            </div>
          </div>
        </div>
      )}

      <div className={wrapClass}>
        {!topicData && (
          <>
            <AppHeader onAbrirBuscador={() => setSearchOpen(true)} />
            <div className="mi-estudio__intro">
              <div>
                <p className="mi-estudio__intro-eyebrow">Mi Estudio</p>
                <h1 className="mi-estudio__intro-title">
                  {nombreUsuario ? `¿Qué tema quieres repasar, ${nombreUsuario}?` : "¿Qué tema quieres repasar?"}
                </h1>
                {error && (
                  <p style={{ color: "var(--danger, #e74c3c)", fontWeight: 700, marginTop: "10px" }}>
                    ⚠️ {error}
                  </p>
                )}
              </div>
            <div className="home-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setBusquedaEnfocada(true)}
                onBlur={() => setTimeout(() => setBusquedaEnfocada(false), 150)}
                onKeyDown={handleKeyDownInicial}
                placeholder="Buscar tema o curso..."
                className="home-search-input"
              />
              {busquedaEnfocada && resultsVisibles.length > 0 && (
                <div className="home-search-results">
                  {resultsVisibles.map((r, i) => (
                    <button
                      key={r.nombre}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        seleccionarItem(r);
                      }}
                      className={`home-search-result is-curso ${i === focusedInicial ? "is-focused" : ""}`}
                    >
                      <p>{r.nombre}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {topicData && (stage === "theory" || stage === "question") && current && (
          <div className="mi-estudio__stage">
            {stage === "question" && isLevelMode && (
              <div className="mi-estudio__hud-wrap animate-fade-in">
                <Hud current={nivelIndex + 1} total={examenPreguntas.length} correct={score} wrong={wrongCount} vidas={vidas} />
              </div>
            )}

            {stage === "theory" && (
              <TheorySearchBar
                flatPuntos={flatPuntos}
                onSelect={(index) => {
                  setCardIndex(index);
                  setQuestionResult(null);
                  setAttemptKey((k) => k + 1);
                }}
              />
            )}

            {stage === "theory" && (
              <div className="arcade-game-container mi-estudio__theory">
                <div className="arcade-grid" />
                <div className="mi-estudio__theory-inner">
                  <p className="mi-estudio__theory-badge">
                    Nivel {cardIndex + 1}: {current.seccionTitulo}
                  </p>
                  <p className="mi-estudio__theory-text">
                    <GlossaryText text={current.texto} glosario={topicData?.glosario} />
                  </p>

                  <div className="mi-estudio__google">
                    <div className="mi-estudio__google-input-wrap">
                      <input
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
                </div>
              </div>
            )}

            {stage === "question" && (
              <div className="mi-estudio__question-stage">
                {isLevelMode && (
                  <button
                    onClick={() => { setConfigOpen(true); setConfirmLeave(false); }}
                    className="mi-estudio__config-btn"
                  >
                    <i className="fas fa-cog" />
                  </button>
                )}

                {/* LOGICA DE RENDERIZADO DEL CRONOMETRO ESTRICTO */}
                {countdown > 0 ? (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '300px' }}>
                    <h2 style={{ fontSize: '5rem', margin: '0', color: 'var(--ink)' }}>{countdown}</h2>
                    <p style={{ fontSize: '1.2rem', opacity: 0.8, marginTop: '10px', textAlign: 'center' }}>
                      Intenta recordar la teoría antes de ver la pregunta...
                    </p>
                  </div>
                ) : (
                  <div className="mi-estudio__question-inner animate-fade-in">
                    <QuestionCard
                      key={`${isLevelMode ? "nivel-" + nivelIndex : "teoria-" + cardIndex}-${attemptKey}`}
                      pregunta={preguntaActual}
                      onRespondido={manejarRespuesta}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mi-estudio__nav">
              <button
                onClick={retrocederCard}
                disabled={isLevelMode ? nivelIndex === 0 : cardIndex === 0}
                className={`mi-estudio__nav-btn ${(isLevelMode ? nivelIndex === 0 : cardIndex === 0) ? "" : "is-active"}`}
                title="Anterior"
              >
                <i className="fas fa-caret-left" />
              </button>

              {!isLevelMode && modoEstudio !== "solo_preguntas" && (
                <button onClick={toggleStage} className="mi-estudio__nav-flip" title="Voltear Tarjeta">
                  <i className="fas fa-sync-alt" />
                </button>
              )}

              <div className="mi-estudio__nav-right">
                {(() => {
                  const esUltimo = isLevelMode
                    ? nivelIndex === examenPreguntas.length - 1
                    : cardIndex === flatPuntos.length - 1;
                  const bloqueado = !canAdvance || esUltimo;
                  return (
                    <>
                      <button
                        onClick={avanzarCard}
                        disabled={bloqueado}
                        className={`mi-estudio__nav-btn ${bloqueado ? "" : "is-active"}`}
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

            {stage === "question" && questionResult && (
              <div className="mi-estudio__explanation-wrap">
                <ExplanationPanel
                  pregunta={preguntaActual}
                  isCorrect={questionResult.isCorrect}
                  onSiguiente={avanzarCard}
                  onReintentar={reintentarPregunta}
                />
              </div>
            )}
          </div>
        )}

        {stage === "finished" && (
          <div className="mi-estudio__finished">
            <div className="mi-estudio__finished-emoji animate-bounce">🏆</div>
            <h2 className="mi-estudio__finished-title">
              {nombreUsuario ? `¡Tema completado, ${nombreUsuario}!` : "¡Tema completado!"}
            </h2>
            <p className="mi-estudio__finished-sub">Excelente trabajo leyendo toda la teoría.</p>
            <button onClick={() => setSearchOpen(true)} className="mi-estudio__finished-btn">
              Elegir otro tema
            </button>
          </div>
        )}
      </div>

      {topicData && (
        <LevelsModal
          open={levelsOpen}
          onClose={() => setLevelsOpen(false)}
          flatPuntos={examenPreguntas}
          maxUnlocked={nivelMaxUnlocked}
          current={nivelIndex}
          levelCompletions={nivelCompletions}
          onSelect={irANivel}
        />
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={seleccionarItem} />

      {nombreCursoActivo && (
        <TopicsModal
          open={temasOpen}
          onClose={() => setTemasOpen(false)}
          curso={nombreCursoActivo}
          temaActual={topicData ? topicData.tema : null}
          listaTemas={temasDelCurso}
          onSelectTema={(temaItem) => {
            abrirTema({
              curso: nombreCursoActivo,
              tema: temaItem.tema,
              archivo: temaItem.archivo,
            });
          }}
        />
      )}

      {/* ================= MODALES HARDCORE ================= */}
      {alertaVidas === "tres" && (
        <div className="config-overlay animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="config-overlay__row vidas-alert" style={{ flexDirection: 'column', gap: '20px', background: '#222', padding: '30px', borderRadius: '15px', border: '2px solid #f39c12' }}>
            <h2 style={{ color: '#f39c12', margin: 0, fontSize: '2rem' }}>⚠️ 3 vidas</h2>
            <p style={{ color: '#fff', fontSize: '1rem', textAlign: 'center' }}>No te confíes.</p>
            <button className="vidas-alert__btn is-warning" onClick={() => setAlertaVidas(null)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {alertaVidas === "una" && (
        <div className="config-overlay animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="config-overlay__row vidas-alert" style={{ flexDirection: 'column', gap: '20px', background: '#331111', padding: '30px', borderRadius: '15px', border: '2px solid #e74c3c' }}>
            <h2 style={{ color: '#e74c3c', margin: 0, fontSize: '2rem', animation: 'pulse 1s infinite' }}>🔥 1 vida</h2>
            <p style={{ color: '#fff', fontSize: '1rem', textAlign: 'center' }}>Última oportunidad.</p>
            <button className="vidas-alert__btn is-danger" onClick={() => setAlertaVidas(null)}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {alertaVidas === "cero" && (
        <div className="config-overlay animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="config-overlay__row vidas-alert" style={{ flexDirection: 'column', gap: '20px', background: '#000', padding: '40px', borderRadius: '15px', border: '3px solid red' }}>
            <h1 style={{ color: 'red', margin: 0, fontSize: '3rem', textShadow: '0 0 10px red' }}>GAME OVER</h1>
            <p style={{ color: '#aaa', fontSize: '1rem', textAlign: 'center' }}>Progreso reiniciado.</p>
            <button className="vidas-alert__btn is-critical" onClick={() => { setAlertaVidas(null); setVidas(5); }} style={{ marginTop: '10px' }}>
              Reiniciar desde cero
            </button>
          </div>
        </div>
      )}
    </div>
  );
}