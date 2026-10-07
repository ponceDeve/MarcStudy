import { useId, useLayoutEffect, useRef } from "react";

// Reloj de pared analógico. Marca la hora del sistema y se mueve solo.
// Las manecillas se giran directamente en el DOM (sin estado de React),
// así que el reloj no vuelve a renderizar nada ni a la página que lo
// contiene.

const CENTRO = 100;

const MARCAS = Array.from({ length: 60 }, (_, i) => {
  const grande = i % 5 === 0;
  const rad = (i * 6 * Math.PI) / 180;
  const r1 = 88;
  const r2 = grande ? 77 : 83;
  return {
    i,
    grande,
    x1: CENTRO + r1 * Math.sin(rad),
    y1: CENTRO - r1 * Math.cos(rad),
    x2: CENTRO + r2 * Math.sin(rad),
    y2: CENTRO - r2 * Math.cos(rad),
  };
});

const NUMEROS = Array.from({ length: 12 }, (_, k) => {
  const n = k + 1;
  const rad = (n * 30 * Math.PI) / 180;
  return {
    n,
    x: CENTRO + 65 * Math.sin(rad),
    y: CENTRO - 65 * Math.cos(rad),
  };
});

function girar(el, grados) {
  if (el) {
    el.setAttribute(
      "transform",
      `rotate(${grados} ${CENTRO} ${CENTRO})`
    );
  }
}

export default function RelojPared() {
  const id = useId().replace(/:/g, "");
  const horaRef = useRef(null);
  const minutoRef = useRef(null);
  const segundoRef = useRef(null);

  useLayoutEffect(() => {
    const reducirMovimiento =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches === true;
    let raf = 0;
    let intervalo = 0;

    function pintar() {
      const ahora = new Date();
      // Con movimiento reducido el segundero salta de segundo en
      // segundo; si no, barre de forma continua como un reloj real.
      const seg =
        ahora.getSeconds() +
        (reducirMovimiento ? 0 : ahora.getMilliseconds() / 1000);
      const min = ahora.getMinutes() + seg / 60;
      const hor = (ahora.getHours() % 12) + min / 60;
      girar(segundoRef.current, seg * 6);
      girar(minutoRef.current, min * 6);
      girar(horaRef.current, hor * 30);
    }

    pintar();
    if (reducirMovimiento) {
      intervalo = window.setInterval(pintar, 1000);
    } else {
      const bucle = () => {
        pintar();
        raf = requestAnimationFrame(bucle);
      };
      raf = requestAnimationFrame(bucle);
    }
    return () => {
      window.clearInterval(intervalo);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg
      className="reloj-pared"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Reloj analógico con la hora actual"
    >
      <defs>
        <linearGradient id={`${id}-aro`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a4a4a" />
          <stop offset="0.45" stopColor="#151515" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={`${id}-bisel`} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#5b5b5b" />
          <stop offset="0.5" stopColor="#1b1b1b" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <radialGradient id={`${id}-esfera`} cx="0.4" cy="0.35" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f6f5f1" />
          <stop offset="1" stopColor="#e4e2dc" />
        </radialGradient>
        <linearGradient id={`${id}-borde`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.38" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-tapa`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#8a8a8a" />
          <stop offset="0.5" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
        <linearGradient id={`${id}-brillo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-vidrio`}>
          <circle cx={CENTRO} cy={CENTRO} r="91.5" />
        </clipPath>
        <filter
          id={`${id}-sombra`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="1.4"
            dy="2.4"
            stdDeviation="1.3"
            floodColor="#000"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      {/* Marco */}
      <circle cx={CENTRO} cy={CENTRO} r="99" fill={`url(#${id}-aro)`} />
      <circle cx={CENTRO} cy={CENTRO} r="95.5" fill={`url(#${id}-bisel)`} />

      {/* Esfera */}
      <circle cx={CENTRO} cy={CENTRO} r="91.5" fill={`url(#${id}-esfera)`} />
      <circle
        cx={CENTRO}
        cy={CENTRO}
        r="90.4"
        fill="none"
        stroke={`url(#${id}-borde)`}
        strokeWidth="2.4"
      />

      {/* Marcas de minutos y de horas */}
      {MARCAS.map((m) => (
        <line
          key={m.i}
          x1={m.x1}
          y1={m.y1}
          x2={m.x2}
          y2={m.y2}
          stroke={m.grande ? "#161616" : "#4a4a4a"}
          strokeWidth={m.grande ? 2.4 : 0.9}
          strokeLinecap="butt"
        />
      ))}

      {/* Números */}
      {NUMEROS.map((n) => (
        <text
          key={n.n}
          x={n.x}
          y={n.y}
          dy="0.35em"
          textAnchor="middle"
          fontSize="17"
          fontWeight="500"
          fill="#1b1b1b"
          fontFamily='Inter, "Helvetica Neue", Arial, sans-serif'
        >
          {n.n}
        </text>
      ))}

      {/* Manecillas (la sombra queda fija mientras giran) */}
      <g filter={`url(#${id}-sombra)`}>
        <g ref={horaRef}>
          <path
            d="M100 36 L105.6 62 L103.4 112 L96.6 112 L94.4 62 Z"
            fill="#383838"
          />
        </g>
        <g ref={minutoRef}>
          <path
            d="M100 14 L102.8 70 L101.8 114 L98.2 114 L97.2 70 Z"
            fill="#1c1c1c"
          />
        </g>
        <g ref={segundoRef}>
          <rect
            x="98.4"
            y="104"
            width="3.2"
            height="20"
            rx="1.4"
            fill="#111"
          />
          <line
            x1={CENTRO}
            y1="108"
            x2={CENTRO}
            y2="12"
            stroke="#111"
            strokeWidth="1.1"
          />
        </g>
      </g>

      {/* Tapa central */}
      <circle cx={CENTRO} cy={CENTRO} r="5.6" fill={`url(#${id}-tapa)`} />
      <circle cx="98.8" cy="98.6" r="1.4" fill="#fff" opacity="0.35" />

      {/* Reflejo del vidrio */}
      <g clipPath={`url(#${id}-vidrio)`}>
        <ellipse
          cx="70"
          cy="44"
          rx="52"
          ry="26"
          transform="rotate(-30 70 44)"
          fill={`url(#${id}-brillo)`}
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
