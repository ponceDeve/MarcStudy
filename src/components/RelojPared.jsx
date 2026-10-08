import { useEffect, useRef, useState } from "react";

/*
  ============================================================
  RELOJ DE PARED - CUENTA REGRESIVA (FLIP CLOCK)
  ============================================================

  Cuenta regresiva hasta el 15 de marzo de 2027.
  Formato: HHHH : MM : SS  (horas totales que faltan)

  Cada dígito es una "hoja" de papel con dos mitades:

    1. La mitad de ARRIBA de la cifra anterior se dobla hacia
       abajo. Detrás de ella ya aparece la cifra NUEVA.
    2. Cuando la hoja llega al centro, la mitad de ABAJO de la
       cifra nueva termina de caer y tapa la cifra anterior.

  Toda la animación está en CSS (_reloj-pared.scss). React solo
  decide cuándo cambia cada dígito.
*/

const OBJETIVO = new Date(2027, 2, 15, 0, 0, 0);

const DIA_SEG = 24 * 60 * 60;

// Suma n meses de calendario conservando la hora; si el día no existe
// en el mes de destino (31 -> 30, 29 feb...) se usa el último día.
function sumarMeses(fecha, n) {
  const f = new Date(
    fecha.getFullYear(),
    fecha.getMonth() + n,
    1,
    fecha.getHours(),
    fecha.getMinutes(),
    fecha.getSeconds()
  );
  const ultimoDia = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
  f.setDate(Math.min(fecha.getDate(), ultimoDia));
  return f;
}

/*
  UN SOLO CÁLCULO para todo.

  - Texto: meses de calendario + semanas + días (el día en curso
    cuenta como un día, igual que un calendario).
  - Reloj: TODO el tiempo que falta convertido a horas:minutos:segundos.
    Las horas NO se reinician cada 24 h:  1 día = 24:00:00,
    2 días = 48:00:00, 5 meses y 8 días = unas 3800 horas.
*/
function calcularRestante(ahoraMs) {
  if (ahoraMs >= OBJETIVO.getTime()) {
    return {
      meses: 0,
      semanas: 0,
      dias: 0,
      horas: "00",
      minutos: "00",
      segundos: "00",
    };
  }

  const ahora = new Date(ahoraMs);

  // ----- Reloj: tiempo total en horas -----
  const total = Math.floor((OBJETIVO.getTime() - ahoraMs) / 1000);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  // ----- Texto: meses + semanas + días -----
  let meses =
    (OBJETIVO.getFullYear() - ahora.getFullYear()) * 12 +
    (OBJETIVO.getMonth() - ahora.getMonth());

  while (meses > 0 && sumarMeses(ahora, meses) > OBJETIVO) meses--;

  const base = sumarMeses(ahora, meses);
  const resto = Math.floor((OBJETIVO.getTime() - base.getTime()) / 1000);
  const diasTotales = Math.ceil(resto / DIA_SEG);

  return {
    meses,
    semanas: Math.floor(diasTotales / 7),
    dias: diasTotales % 7,
    horas: String(horas).padStart(2, "0"),
    minutos: String(minutos).padStart(2, "0"),
    segundos: String(segundos).padStart(2, "0"),
  };
}

/*
  ------------------------------------------------------------
  DÍGITO
  ------------------------------------------------------------
  Capas (de atrás hacia adelante):

  - mitad superior fija  -> cifra NUEVA   (queda "detrás")
  - mitad inferior fija  -> cifra ANTERIOR
  - hoja de arriba       -> cifra ANTERIOR, cae hacia abajo
  - hoja de abajo        -> cifra NUEVA, llega desde arriba

  Cada cambio incrementa `clave`; al cambiar la key de las hojas,
  React las vuelve a crear y la animación CSS arranca limpia
  (sin timeouts ni lecturas de offsetWidth).
*/

function Digito({ valor }) {
  const [estado, setEstado] = useState({
    actual: valor,
    anterior: valor,
    clave: 0,
  });

  // Ajustar el estado durante el render cuando llega un valor nuevo.
  if (valor !== estado.actual) {
    setEstado({
      actual: valor,
      anterior: estado.actual,
      clave: estado.clave + 1,
    });
  }

  const { actual, anterior, clave } = estado;

  return (
    <div className="reloj-flap__digito" aria-hidden="true">
      <div className="reloj-flap__mitad reloj-flap__mitad--superior">
        <span>{actual}</span>
      </div>

      <div className="reloj-flap__mitad reloj-flap__mitad--inferior">
        <span>{anterior}</span>
      </div>

      {clave > 0 && (
        <>
          <div
            key={`arriba-${clave}`}
            className="reloj-flap__mitad reloj-flap__mitad--superior reloj-flap__hoja reloj-flap__hoja--arriba"
          >
            <span>{anterior}</span>
          </div>

          <div
            key={`abajo-${clave}`}
            className="reloj-flap__mitad reloj-flap__mitad--inferior reloj-flap__hoja reloj-flap__hoja--abajo"
          >
            <span>{actual}</span>
          </div>
        </>
      )}
    </div>
  );
}


/*
  ============================================================
  CRONÓMETRO (cuánto tardas en responder)
  ============================================================

  Empieza en 00 y va creciendo:

    - menos de 1 minuto  ->  SS            (00, 01, 02 ...)
    - desde 1 minuto     ->  MM : SS       (01:00 ...)
    - desde 1 hora       ->  HH : MM : SS

  Se reinicia a 00 cada vez que cambia `clave` (nueva pregunta) y se
  congela mientras `pausado` sea true (p. ej. ya respondiste).
*/

export function partesCronometro(totalSegundos) {
  const s = Math.max(0, Math.floor(totalSegundos));
  return {
    horas: Math.floor(s / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
    verMinutos: s >= 60,
    verHoras: s >= 3600,
  };
}

const dos = (n) => String(n).padStart(2, "0");

// Bloque HH : MM : SS de hojas, compartido por Cronometro y RelojRegresivo.
// Las horas y los minutos pueden ocultarse (Cronometro los muestra solo
// cuando hacen falta).
function BloqueTiempo({
  horas,
  minutos,
  segundos,
  verHoras = true,
  verMinutos = true,
}) {
  return (
    <div className="reloj-flap">
      {verHoras && (
        <div className="reloj-flap__grupo">
          <Digito key="h1" valor={horas[0]} />
          <Digito key="h0" valor={horas[1]} />
          <span className="reloj-flap__separador" aria-hidden="true">
            :
          </span>
        </div>
      )}

      {verMinutos && (
        <div className="reloj-flap__grupo">
          <Digito key="m1" valor={minutos[0]} />
          <Digito key="m0" valor={minutos[1]} />
          <span className="reloj-flap__separador" aria-hidden="true">
            :
          </span>
        </div>
      )}

      <div className="reloj-flap__grupo">
        <Digito key="s1" valor={segundos[0]} />
        <Digito key="s0" valor={segundos[1]} />
      </div>
    </div>
  );
}

export function Cronometro({ clave, pausado = false }) {
  const [total, setTotal] = useState(0);
  const acumuladoRef = useRef(0); // ms ya contados antes de la última pausa
  const inicioRef = useRef(null); // marca de inicio del tramo en curso

  // Nueva pregunta -> volver a 00.
  useEffect(() => {
    acumuladoRef.current = 0;
    setTotal(0);
  }, [clave]);

  // Correr / pausar. El cleanup guarda lo que ya corrió el tramo.
  useEffect(() => {
    inicioRef.current = pausado ? null : Date.now();

    const leer = () =>
      acumuladoRef.current +
      (inicioRef.current ? Date.now() - inicioRef.current : 0);

    // Al pausar, mostrar el valor exacto en que se congeló.
    if (pausado) setTotal(Math.floor(acumuladoRef.current / 1000));

    const intervalo = pausado
      ? null
      : window.setInterval(() => {
          setTotal(Math.floor(leer() / 1000));
        }, 200);

    return () => {
      if (intervalo) window.clearInterval(intervalo);
      if (inicioRef.current) {
        acumuladoRef.current += Date.now() - inicioRef.current;
        inicioRef.current = null;
      }
    };
  }, [pausado, clave]);

  const p = partesCronometro(total);
  const sec = dos(p.segundos);
  const min = dos(p.minutos);
  const hor = dos(p.horas);

  return (
    <div
      className="reloj-pared reloj-pared--compacto"
      role="timer"
      aria-label="Tiempo en esta pregunta"
    >
      <BloqueTiempo
        horas={hor}
        minutos={min}
        segundos={sec}
        verHoras={p.verHoras}
        verMinutos={p.verMinutos}
      />
    </div>
  );
}

/*
  ============================================================
  RELOJ REGRESIVO (cuenta atrás del simulacro)
  ============================================================

  Mismo reloj de hojas que el Cronometro, pero SIN tiempo propio:
  solo dibuja los `segundos` que le pasan (el simulacro ya los
  calcula a partir de su hora de fin, así hay una sola fuente de
  tiempo). Siempre muestra HH : MM : SS. Con `urgente` los dígitos
  se ponen en rojo.
*/

export function RelojRegresivo({ segundos, urgente = false }) {
  const p = partesCronometro(segundos);

  return (
    <div
      className={`reloj-pared reloj-pared--compacto${
        urgente ? " reloj-pared--urgente" : ""
      }`}
      role="timer"
      aria-label="Tiempo restante del simulacro"
    >
      <BloqueTiempo
        horas={dos(p.horas)}
        minutos={dos(p.minutos)}
        segundos={dos(p.segundos)}
      />
    </div>
  );
}

/*
  ------------------------------------------------------------
  COMPONENTE
  ------------------------------------------------------------
*/

export default function RelojPared({ compacto = false }) {
  // Segundo actual (entero). Solo cambia una vez por segundo.
  const [segundoActual, setSegundoActual] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setSegundoActual(Math.floor(Date.now() / 1000));
    }, 200);

    return () => window.clearInterval(intervalo);
  }, []);

  const { meses, semanas, dias, horas, minutos, segundos } =
    calcularRestante(segundoActual * 1000);

  // Las horas pueden tener 2, 3 o 4 cifras (p. ej. 3796).
  const cifrasHoras = horas.split("");
  const largo = cifrasHoras.length > 2;

  return (
    <>
      {!compacto && (
      <div className="mi-estudio__recomendados-fecha">
        {`${meses} ${meses === 1 ? "mes" : "meses"} · ${semanas} ${
          semanas === 1 ? "semana" : "semanas"
        } · ${dias} ${dias === 1 ? "día" : "días"}`}
      </div>
      )}

      <div
        className={`reloj-pared${largo ? " reloj-pared--largo" : ""}${
          compacto ? " reloj-pared--compacto" : ""
        }`}
        role="timer"
        aria-label="Cuenta regresiva hasta el 15 de marzo de 2027"
      >
        <div className="reloj-flap">
          {/* HORAS (totales) */}
          <div className="reloj-flap__grupo">
            {cifrasHoras.map((c, i) => (
              // La key cuenta desde la derecha: si aparece o desaparece una
              // cifra a la izquierda, las demás conservan su animación.
              <Digito key={`h${cifrasHoras.length - 1 - i}`} valor={c} />
            ))}
            <span className="reloj-flap__separador" aria-hidden="true">
              :
            </span>
          </div>

          {/* MINUTOS */}
          <div className="reloj-flap__grupo">
            <Digito key="m1" valor={minutos[0]} />
            <Digito key="m0" valor={minutos[1]} />
            <span className="reloj-flap__separador" aria-hidden="true">
              :
            </span>
          </div>

          {/* SEGUNDOS */}
          <div className="reloj-flap__grupo">
            <Digito key="s1" valor={segundos[0]} />
            <Digito key="s0" valor={segundos[1]} />
          </div>
        </div>

        {!compacto && (
          <div
            className="reloj-flap__etiquetas"
            style={{
              gridTemplateColumns: `${cifrasHoras.length}fr 2fr 2fr`,
            }}
          >
            <span>HORAS</span>
            <span>MINUTOS</span>
            <span>SEGUNDOS</span>
          </div>
        )}
      </div>
    </>
  );
}