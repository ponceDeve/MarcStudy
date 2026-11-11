
import { useMemo, useState, useRef, useEffect, useLayoutEffect } from "react";
import manifest from "../../data/manifest.json";

// Cada categoría es una diapositiva del carrusel: título, íconos y cursos.
const CATEGORIAS = [
  {
    id: "letras",
    titulo: "Letras",
    iconoIzquierdo: "bi-book",
    iconoDerecho: "bi-feather",
    cursos: ["RMV", "LEN", "LIT", "HIS", "HPE", "FIL", "ING"]
  },
  {
    id: "ciencias",
    titulo: "Ciencias",
    iconoIzquierdo: "bi-beaker",
    iconoDerecho: "bi-eyedropper",
    cursos: ["BIO", "FIS", "QUI", "GEO", "CIV", "PSI"]
  },
  {
    id: "matematica",
    titulo: "Matemática",
    iconoIzquierdo: "bi-calculator",
    iconoDerecho: "bi-rulers",
    cursos: ["RMA", "ARI", "ALG", "GEM", "TRI", "ECO"]
  }
];

const UMBRAL_CAMBIO = 0.18;
const DISTANCIA_ARRASTRE = 6;
// Debe coincidir con la transición de la pista en _welcome-section.scss (0.45s).
const TRANSICION_MS = 480;

function FlechaDerecha() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9.5 5L16 12L9.5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeSection({
  onSelectTema,
  temasCompletadosLista = []
}) {
  const [indice, setIndice] = useState(0);

  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const gestoRef = useRef(null);
  const bloquearClickRef = useRef(false);

  const total = CATEGORIAS.length;
  // Posición real de la pista: 0 y total+1 son copias (última y primera categoría)
  // que permiten girar sin fin; 1..total son las categorías reales.
  const posRef = useRef(1);
  const temporizadorRef = useRef(null);

  function anchoSlide() {
    const track = trackRef.current;
    return track?.firstElementChild?.getBoundingClientRect().width || 0;
  }

  // Desplaza el carrusel según el ancho real de cada diapositiva.
  function posicionar(i, desfase = 0, animado = true) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.style.transition = animado ? "" : "none";
    track.style.transform = `translate3d(${-i * anchoSlide() + desfase}px, 0, 0)`;
  }

  // Ajusta la altura de la ventana a la diapositiva activa.
  function ajustarAltura() {
    const viewport = viewportRef.current;
    const slide = trackRef.current?.children[posRef.current];

    if (!viewport || !slide) {
      return;
    }

    const estilo = getComputedStyle(viewport);
    const padding =
      parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom);

    viewport.style.height = `${slide.offsetHeight + padding}px`;
  }

  useLayoutEffect(() => {
    posicionar(posRef.current, 0, false);
  }, []);

  useLayoutEffect(() => {
    ajustarAltura();
  }, [indice]);

  useEffect(() => () => clearTimeout(temporizadorRef.current), []);

  useEffect(() => {
    const alCambiarTamano = () => {
      posicionar(posRef.current, 0, false);
      ajustarAltura();
    };

    window.addEventListener("resize", alCambiarTamano);

    return () => window.removeEventListener("resize", alCambiarTamano);
  }, []);

  // Recalcula la altura si cambia el contenido o el tamaño de una diapositiva.
  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return undefined;
    }

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", ajustarAltura);

      return () => window.removeEventListener("resize", ajustarAltura);
    }

    const observador = new ResizeObserver(() => ajustarAltura());

    Array.from(track.children).forEach((slide) => {
      observador.observe(slide);
    });

    return () => observador.disconnect();
  }, []);

  const cursos = useMemo(
    () =>
      Array.isArray(manifest.cursos)
        ? manifest.cursos.map((curso) => ({
            ...curso,
            temas: Array.isArray(curso.temas) ? curso.temas : []
          }))
        : [],
    []
  );

  const totalTemas = useMemo(
    () => cursos.reduce((total, curso) => total + curso.temas.length, 0),
    [cursos]
  );

  const cursosPorCategoria = useMemo(() => {
    const resultado = {};

    CATEGORIAS.forEach((categoria) => {
      resultado[categoria.id] = categoria.cursos
        .map((codigo) => cursos.find((item) => item.codigo === codigo))
        .filter(Boolean);
    });

    return resultado;
  }, [cursos]);

  function logrosDelCurso(curso) {
    return temasCompletadosLista.filter((id) =>
      id.startsWith(`${curso.nombre}_`)
    ).length;
  }

  function abrirMapaDeTemas(curso) {
    onSelectTema?.({ type: "curso", nombre: curso.nombre });
  }

  // Categoría real (0..total-1) que corresponde a una posición de la pista.
  function realDe(pos) {
    return (pos - 1 + total) % total;
  }

  // Si la pista quedó sobre una copia, salta sin animación a la categoría real.
  function normalizar() {
    clearTimeout(temporizadorRef.current);

    if (posRef.current === 0) {
      posRef.current = total;
    } else if (posRef.current === total + 1) {
      posRef.current = 1;
    } else {
      return;
    }

    posicionar(posRef.current, 0, false);
  }

  // Mueve la pista a una posición (con animación) y actualiza la categoría activa.
  function irA(destino) {
    const pos = Math.max(0, Math.min(total + 1, destino));

    clearTimeout(temporizadorRef.current);
    posRef.current = pos;
    posicionar(pos, 0, true);
    setIndice(realDe(pos));

    if (pos === 0 || pos === total + 1) {
      temporizadorRef.current = setTimeout(normalizar, TRANSICION_MS);
    }
  }

  // Gesto de arrastre con mouse o pantalla táctil.
  function manejarPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }

    normalizar();

    gestoRef.current = {
      id: e.pointerId,
      x: e.clientX,
      base: posRef.current,
      movido: false
    };
  }

  function manejarPointerMove(e) {
    const gesto = gestoRef.current;

    if (!gesto || gesto.id !== e.pointerId) {
      return;
    }

    const dx = e.clientX - gesto.x;

    if (!gesto.movido) {
      if (Math.abs(dx) < DISTANCIA_ARRASTRE) {
        return;
      }

      gesto.movido = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    posicionar(gesto.base, dx, false);
  }

  function finalizarGesto(e, cancelado) {
    const gesto = gestoRef.current;

    if (!gesto || gesto.id !== e.pointerId) {
      return;
    }

    gestoRef.current = null;

    if (!gesto.movido) {
      return;
    }

    const dx = cancelado ? 0 : e.clientX - gesto.x;
    const umbral = anchoSlide() * UMBRAL_CAMBIO;

    let siguiente = gesto.base;

    if (dx < -umbral) {
      siguiente = gesto.base + 1;
    } else if (dx > umbral) {
      siguiente = gesto.base - 1;
    }

    irA(siguiente);

    bloquearClickRef.current = true;

    setTimeout(() => {
      bloquearClickRef.current = false;
    }, 250);
  }

  function clickPunto(i) {
    if (bloquearClickRef.current) {
      return;
    }

    normalizar();

    // Entre la primera y la última se toma el camino corto, pasando por la copia.
    const actual = realDe(posRef.current);
    let destino = i + 1;

    if (actual === 0 && i === total - 1) {
      destino = 0;
    } else if (actual === total - 1 && i === 0) {
      destino = total + 1;
    }

    irA(destino);
  }

  function renderCurso(curso) {
    return (
      <article
        key={curso.codigo}
        className="welcome-section__curso"
      >
        <div className="welcome-section__curso-top">
          <div className="welcome-section__curso-info">
            <span className="welcome-section__curso-nombre">
              {curso.nombre}
            </span>

            <div className="box-nombre-logros">
              <span className="welcome-section__curso-count">
                {curso.temas.length} tema
                {curso.temas.length !== 1 ? "s" : ""}
              </span>

              <span className="welcome-section__curso-logros">
                <span
                  className="welcome-section__trophy"
                  aria-hidden="true"
                >
                  <i className="bi bi-trophy" />
                </span>

                {logrosDelCurso(curso)}/{curso.temas.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="welcome-section__ver-temas"
            onClick={() => abrirMapaDeTemas(curso)}
          >
            <span>Ver temas</span>

            <span
              className="welcome-section__ver-temas-icon"
              aria-hidden="true"
            >
              <FlechaDerecha />
            </span>
          </button>
        </div>
      </article>
    );
  }

  function renderCategoria(categoria, clave, esClon) {
    const cursosCategoria = cursosPorCategoria[categoria.id] || [];

    return (
      <section
        key={clave}
        className={`welcome-section__slide welcome-section__category welcome-section__category--${categoria.id}`}
        style={{ flex: `0 0 ${100 / (total + 2)}%` }}
        aria-hidden={esClon || CATEGORIAS[indice]?.id !== categoria.id}
      >
        <h3 className="welcome-section__category-title">
          <i
            className={`bi ${categoria.iconoIzquierdo}`}
            aria-hidden="true"
          />

          <span>{categoria.titulo}</span>

          <i
            className={`bi ${categoria.iconoDerecho}`}
            aria-hidden="true"
          />
        </h3>

        <div className="welcome-section__carousel-row">
          {cursosCategoria.map((curso) => renderCurso(curso))}
        </div>
      </section>
    );
  }

  return (
    <div className="welcome-section">
      <section className="welcome-section__courses">

        {/* CAJA INDEPENDIENTE: INTRODUCCIÓN Y LOGROS GENERALES */}
        <div className="welcome-section__intro">
          <div className="mi-estudio__intro-background">
            <div className="mi-estudio__intro-container">
              <h2 className="welcome-section__title">
                Qué encontrarás en Mi Estudio
              </h2>

              <div className="welcome-section__logros">
                <svg
                  className="welcome-section__logros-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <defs>
                    <linearGradient
                      id="oroBrillante"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#EBD9A8" />
                      <stop offset="30%" stopColor="#D6B875" />
                      <stop offset="70%" stopColor="#C9AA62" />
                      <stop offset="100%" stopColor="#9C8444" />
                    </linearGradient>

                    <linearGradient
                      id="oroReflejo"
                      x1="100%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#F5ECD2" />
                      <stop offset="50%" stopColor="#D6B875" />
                      <stop offset="100%" stopColor="#8A7438" />
                    </linearGradient>

                    <linearGradient
                      id="baseDegradado"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#3E4A58" />
                      <stop offset="100%" stopColor="#303A46" />
                    </linearGradient>

                    <filter
                      id="sombraPremium"
                      x="-10%"
                      y="-10%"
                      width="130%"
                      height="130%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="8"
                        stdDeviation="6"
                        floodColor="#000"
                        floodOpacity="0.25"
                      />
                    </filter>
                  </defs>

                  <g filter="url(#sombraPremium)">
                    <path
                      d="M160,140 C90,140 80,240 160,260 C140,220 140,180 160,140 Z"
                      fill="url(#oroReflejo)"
                    />

                    <path
                      d="M352,140 C422,140 432,240 352,260 C372,220 372,180 352,140 Z"
                      fill="url(#oroBrillante)"
                    />

                    <path
                      d="M160,110 L352,110 C352,240 320,290 256,290 C192,290 160,240 160,110 Z"
                      fill="url(#oroBrillante)"
                    />

                    <path
                      d="M180,120 L240,120 C220,190 200,240 256,275 C200,260 180,210 180,120 Z"
                      fill="url(#oroReflejo)"
                      opacity="0.4"
                    />

                    <ellipse
                      cx="256"
                      cy="110"
                      rx="96"
                      ry="15"
                      fill="#8A7438"
                    />

                    <ellipse
                      cx="256"
                      cy="107"
                      rx="92"
                      ry="12"
                      fill="url(#oroReflejo)"
                      opacity="0.8"
                    />

                    <path
                      d="M236,285 L276,285 L286,360 L226,360 Z"
                      fill="url(#oroBrillante)"
                    />

                    <ellipse
                      cx="256"
                      cy="330"
                      rx="35"
                      ry="10"
                      fill="url(#oroReflejo)"
                    />

                    <path
                      d="M200,360 L312,360 L332,420 L180,420 Z"
                      fill="url(#baseDegradado)"
                    />

                    <rect
                      x="160"
                      y="420"
                      width="192"
                      height="20"
                      rx="5"
                      fill="#303A46"
                    />

                    <rect
                      x="216"
                      y="380"
                      width="80"
                      height="25"
                      rx="2"
                      fill="url(#oroBrillante)"
                    />

                    <line
                      x1="226"
                      y1="392"
                      x2="286"
                      y2="392"
                      stroke="#8A7438"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                </svg>

                <div className="welcome-section__logros-text">
                  <span className="welcome-section__logros-num">
                    {temasCompletadosLista.length} / {totalTemas}
                  </span>

                  <span className="welcome-section__logros-label">
                    temas completados
                  </span>
                </div>
              </div>

              <p className="welcome-section__lead">
                Poco a poco, cada tema te acerca a tu meta.
                <br />
                Tienes <strong>{cursos.length} cursos</strong> y{" "}
                <strong>{totalTemas} temas</strong> para seguir avanzando.
              </p>
            </div>
          </div>
        </div>

        {/* CAJA INDEPENDIENTE: CARRUSEL DE CURSOS */}
        <div
          className="welcome-section__carousel"
          onPointerDown={manejarPointerDown}
          onPointerMove={manejarPointerMove}
          onPointerUp={(e) => finalizarGesto(e, false)}
          onPointerCancel={(e) => finalizarGesto(e, true)}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className="welcome-section__stage">
            <div
              className="welcome-section__viewport"
              ref={viewportRef}
            >
              <div
                className="welcome-section__track"
                ref={trackRef}
                style={{ width: `${(total + 2) * 100}%` }}
              >
                {renderCategoria(
                  CATEGORIAS[total - 1],
                  `${CATEGORIAS[total - 1].id}-copia-inicio`,
                  true
                )}

                {CATEGORIAS.map((categoria) =>
                  renderCategoria(categoria, categoria.id, false)
                )}

                {renderCategoria(
                  CATEGORIAS[0],
                  `${CATEGORIAS[0].id}-copia-final`,
                  true
                )}
              </div>
            </div>
          </div>

          <div
            className="welcome-section__carousel-dots"
            role="tablist"
            aria-label="Categorías"
          >
            {CATEGORIAS.map((categoria, posicion) => (
              <button
                key={`${categoria.id}-dot`}
                type="button"
                role="tab"
                className={`welcome-section__carousel-dot${
                  posicion === indice
                    ? " welcome-section__carousel-dot--active"
                    : ""
                }`}
                onClick={() => clickPunto(posicion)}
                aria-label={`Ver categoría ${categoria.titulo}`}
                aria-selected={posicion === indice}
                title={categoria.titulo}
              />
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
