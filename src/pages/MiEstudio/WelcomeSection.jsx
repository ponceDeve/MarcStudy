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

  function idTema(curso, tema) {
    return `${curso.nombre}_${tema.tema}`;
  }

  // Primer tema del curso que aún no está completado (null si ya los hizo todos).
  function siguienteTema(curso) {
    return (
      curso.temas.find(
        (tema) => !temasCompletadosLista.includes(idTema(curso, tema))
      ) || null
    );
  }

  function empezarCurso(curso) {
    const tema = siguienteTema(curso) || curso.temas[0];

    if (!tema) {
      return;
    }

    onSelectTema?.({
      type: "tema",
      curso: curso.nombre,
      tema: tema.tema,
      archivo: tema.archivo
    });
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
    const total = curso.temas.length;
    const hechos = logrosDelCurso(curso);
    const porcentaje = total > 0 ? Math.min(100, (hechos / total) * 100) : 0;

    let textoBoton = "Empezar";

    if (total > 0 && hechos >= total) {
      textoBoton = "Repasar";
    } else if (hechos > 0) {
      textoBoton = "Continuar";
    }

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
                {total} tema{total !== 1 ? "s" : ""}
              </span>

              <span className="welcome-section__curso-logros">
                <span
                  className="welcome-section__trophy"
                  aria-hidden="true"
                >
                  <i className="bi bi-trophy-fill" />
                </span>

                {hechos}/{total}
              </span>
            </div>
          </div>

          <div
            className="welcome-section__progreso"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={hechos}
            aria-label={`Progreso de ${curso.nombre}`}
          >
            <div
              className="welcome-section__progreso-barra"
              style={{ width: `${porcentaje}%` }}
            />
          </div>

          <div className="welcome-section__curso-acciones">
            <button
              type="button"
              className="welcome-section__ver-temas"
              onClick={() => abrirMapaDeTemas(curso)}
            >
              <span>Ver temas</span>
            </button>

            <button
              type="button"
              className="welcome-section__empezar"
              onClick={() => empezarCurso(curso)}
              disabled={total === 0}
            >
              {textoBoton}
            </button>
          </div>
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
                <i
                  className="bi bi-trophy-fill welcome-section__logros-icon"
                  aria-hidden="true"
                />

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