import React, { useEffect, useRef, useState } from "react";
import Texto from "./InglesTexto";
import { revisar } from "../lib/inglesRespuestas";
import { decir } from "../lib/inglesAudio";
const ESPERA_SEG = 15; // hueco entre leer la teoría y la primera pregunta
// Mensaje "Correcto" / "Incorrecto" debajo de la pregunta (apagado).
const MOSTRAR_FEEDBACK = false;
// Panel de teoría de esta sesión.
function Teoria({ seccion }) {
  const [verEs, setVerEs] = useState(false);
  const lineas = (seccion.teoria || "").split("\n");
  return (
    <aside className="arcade-game-container teoria-card-unica ses__teoria-arcade">
      <div className="arcade-grid" />
      <div className="teoria-card-unica__inner ses__teoria-cont">
        {lineas.map((l, i) =>
          l ? (
            <p key={i}>
              <Texto>{l}</Texto>
            </p>
          ) : null
        )}
        {seccion.ejemplos && seccion.ejemplos.length > 0 && (
          <ul className="ses__ejemplos">
            {seccion.ejemplos.map((x, k) => (
              <li key={k}>
                <button
                  type="button"
                  className="ing-audio"
                  onClick={() => decir(x.en)}
                  aria-label="Escuchar"
                >
                  <i
                    className="bi bi-volume-up-fill"
                    aria-hidden="true"
                  />
                </button>{" "}
                <span lang="en">{x.en}</span>{" "}
                <small>— {x.es}</small>
              </li>
            ))}
          </ul>
        )}
        {seccion.texto && (
          <>
            <p lang="en" className="ses__lectura">
              {seccion.texto.en}
            </p>
            <button
              type="button"
              className="ing-btn ing-btn--suave"
              onClick={() => decir(seccion.texto.en)}
              aria-label="Escuchar"
            >
              <i
                className="bi bi-volume-up-fill"
                aria-hidden="true"
              />
            </button>{" "}
            <button
              type="button"
              className="ing-btn ing-btn--suave"
              onClick={() => setVerEs(!verEs)}
            >
              {verEs ? "Ocultar" : "Traducir"}
            </button>
            {verEs && (
              <p className="ses__trad">
                {seccion.texto.es}
              </p>
            )}
          </>
        )}
        {seccion.textosReferencia &&
          seccion.textosReferencia.map((t, k) => (
            <details key={k}>
              <summary>{t.titulo}</summary>
              <p lang="en">{t.en}</p>
            </details>
          ))}
      </div>
    </aside>
  );
}
// Consigna que dice qué hay que escribir.
// Se deduce del tipo de ejercicio y del enunciado,
// sin tocar los JSON.
function consignaDe(ej) {
  if (ej.consigna) return ej.consigna;
  const enun = ej.enunciado || "";
  switch (ej.tipo) {
    case "completar":
      if (enun.includes("(en español)")) {
        return "Escribe en español el significado de la palabra";
      }
      if (enun.includes(" = ___")) {
        return "Escribe en inglés la palabra que corresponde";
      }
      return "Completa la frase con la palabra que falta, en inglés";
    case "traducir":
      return "Traduce la frase al inglés";
    case "dictado":
      return "Escucha y escribe en inglés lo que oyes";
    case "responder_texto":
      return "Lee el texto y responde en inglés con una frase corta";
    case "verdadero_falso":
      return "Lee el texto y elige True o False";
    default:
      return null;
  }
}
// Frase con palabras en inglés tocables
// y un hueco.
function Frase({ partes, hueco }) {
  const [abierta, setAbierta] = useState(null);
  return partes.map((p, k) => {
    if (typeof p === "string") {
      return <span key={k}>{p}</span>;
    }
    if (p.hueco) {
      return (
        <span key={k} className="ses__hueco">
          {hueco(p)}
        </span>
      );
    }
    if (p.marca) {
      return (
        <mark
          key={k}
          lang="en"
          className="ses__marca"
        >
          {p.en}
        </mark>
      );
    }
    return (
      <button
        key={k}
        type="button"
        lang="en"
        className={`ses__en ${
          abierta === k ? "abierta" : ""
        }`}
        onClick={() => {
          decir(p.en);
          setAbierta(abierta === k ? null : k);
        }}
      >
        {p.en}
        {abierta === k && (
          <span className="ses__en-es">
            {p.es}
          </span>
        )}
      </button>
    );
  });
}
function BotonAudio({ audio }) {
  if (!audio) return null;
  return (
    <button
      type="button"
      className="ing-audio"
      onClick={() => decir(audio.texto, audio.idioma)}
      aria-label="Escuchar"
    >
      <i
        className="bi bi-volume-up-fill"
        aria-hidden="true"
      />
    </button>
  );
}
// Texto corto con sentido:
// mezcla español + palabras en inglés y un hueco.
function TextoMixto({
  ej,
  texto,
  setTexto,
  res,
  onEnter,
  inputRef,
}) {
  const largo = Math.max(
    ...ej.respuestas.map((r) => r.length),
    4
  );
  // Ejercicios de "significado":
  // la frase no trae hueco, el input va debajo.
  if (ej.modo === "significado") {
    return (
      <>
        <p className="ses__consigna">
          {ej.consigna}
        </p>
        <p className="ses__mixto">
          <BotonAudio audio={ej.audio} />{" "}
          <Frase
            partes={ej.partes}
            hueco={() => null}
          />
        </p>
        <div className="ses__sig">
          <input
            ref={inputRef}
            className={`ses__campo ${
              res ? (res.ok ? "ok" : "mal") : ""
            }`}
            value={texto}
            disabled={!!res}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onEnter}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder="En español…"
            aria-label="Significado en español"
          />
        </div>
      </>
    );
  }
  return (
    <>
      <p>
        {ej.consigna}
      </p>
      <p className="ses__mixto">
        <BotonAudio audio={ej.audio} />{" "}
        <Frase
          partes={ej.partes}
          hueco={(p) => (
            <>
              <input
                ref={inputRef}
                className={`ses__campo ${
                  res ? (res.ok ? "ok" : "mal") : ""
                }`}
                style={{
                  minWidth: `${Math.min(largo, 24) + 2}ch`,
                }}
                value={texto}
                maxLength={largo}
                disabled={!!res}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={onEnter}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                aria-label="Palabra que falta"
              />
              {p.pista && (
                <small className="ses__pista">
                  {" "}
                  ({p.pista})
                </small>
              )}
            </>
          )}
        />
      </p>
    </>
  );
}
// Opciones tocables.
// Primero se selecciona y luego se confirma.
function Elegir({
  ej,
  res,
  elegida,
  alElegir,
  alResponder,
}) {
  return (
    <>
      {ej.partes ? (
        <p className="ses__mixto">
          <Frase
            partes={ej.partes}
            hueco={(p) => (
              <>
                <span className="ses__vacio">
                  {elegida ||
                    "\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0"}
                </span>
                {p.pista && (
                  <small className="ses__pista">
                    {" "}
                    ({p.pista})
                  </small>
                )}
              </>
            )}
          />
        </p>
      ) : (
        <p className="ses__enun">
          <BotonAudio audio={ej.audio} />{" "}
          {ej.enunciado}
        </p>
      )}
      <div className="ses__opciones">
        {ej.opciones.map((o) => {
          const seleccionada =
            !res && elegida === o;
          const incorrecta =
            res && !res.ok && elegida === o;
          return (
            <button
              key={o}
              type="button"
              disabled={!!res}
              className={`ses__opcion ${
                seleccionada ? "seleccionada" : ""
              } ${incorrecta ? "mal" : ""}`}
              onClick={() => alElegir(o)}
            >
              {o}
            </button>
          );
        })}
      </div>
      {!res && (
        <button
          type="button"
          className="ing-btn ing-btn--principal ing-btn--ancho"
          disabled={!elegida}
          onClick={alResponder}
        >
          Responder
        </button>
      )}
    </>
  );
}
// Ordenar palabras (estilo Duolingo): se tocan las fichas para armar la frase en inglés.
// Algunas fichas sobran a propósito (distractores).
function Ordenar({ ej, res, alResponder }) {
  const [elegidas, setElegidas] = useState([]); // índices de ej.palabras, en el orden tocado
  // Al repetir el ejercicio se empieza de cero.
  useEffect(() => {
    if (!res) setElegidas([]);
  }, [res]);
  const usadas = new Set(elegidas);
  const frase = elegidas.map((i) => ej.palabras[i]);
  return (
    <>
      <p className="ses__consigna">{ej.consigna}</p>
      <p className="ses__enun">{ej.pista}</p>
      <div
        className={`ses__armada ${res ? (res.ok ? "ok" : "mal") : ""}`}
        aria-label="Tu frase"
      >
        {frase.map((w, k) => (
          <button
            key={k}
            type="button"
            lang="en"
            className="ses__ficha"
            disabled={!!res}
            onClick={() =>
              setElegidas((e) => e.filter((_, n) => n !== k))
            }
          >
            {w}
          </button>
        ))}
      </div>
      <div className="ses__fichas">
        {ej.palabras.map((w, i) => (
          <button
            key={i}
            type="button"
            lang="en"
            className={`ses__ficha ${usadas.has(i) ? "usada" : ""}`}
            disabled={!!res || usadas.has(i)}
            onClick={() => setElegidas((e) => [...e, i])}
          >
            {w}
          </button>
        ))}
      </div>
      {res && (
        <p className="ses__correcta" lang="en">
          <BotonAudio audio={ej.audio} /> {ej.respuestas[0]}
        </p>
      )}
      {!res && (
        <button
          type="button"
          className="ing-btn ing-btn--principal ing-btn--ancho"
          disabled={elegidas.length === 0}
          onClick={() => alResponder(frase.join(" "))}
        >
          Responder
        </button>
      )}
    </>
  );
}
// Emparejar (estilo Duolingo): se toca una palabra de la izquierda y su pareja de la derecha.
// Se permiten hasta 2 errores; con más, el ejercicio se repite al final.
function Emparejar({ ej, res, alResponder }) {
  const [izq, setIzq] = useState(null);
  const [hechos, setHechos] = useState([]);
  const [fallo, setFallo] = useState(null);
  const [errores, setErrores] = useState(0);
  useEffect(() => {
    if (!res) {
      setIzq(null);
      setHechos([]);
      setFallo(null);
      setErrores(0);
    }
  }, [res]);
  const orden = ej.ordenDer || ej.pares.map((_, i) => i);
  function tocarDer(j) {
    if (res || izq === null || hechos.includes(j)) return;
    if (izq === j) {
      const nuevos = [...hechos, j];
      setHechos(nuevos);
      setIzq(null);
      decir(ej.pares[j].izq);
      if (nuevos.length === ej.pares.length) {
        alResponder(errores <= 2 ? "listo" : "con errores");
      }
    } else {
      setErrores((e) => e + 1);
      setFallo(j);
      setIzq(null);
      setTimeout(() => setFallo(null), 500);
    }
  }
  return (
    <>
      <p className="ses__consigna">{ej.consigna}</p>
      <div className="ses__pares">
        <div className="ses__col">
          {ej.pares.map((p, i) => (
            <button
              key={i}
              type="button"
              lang="en"
              className={`ses__par ${hechos.includes(i) ? "hecho" : ""} ${
                izq === i ? "seleccionada" : ""
              }`}
              disabled={!!res || hechos.includes(i)}
              onClick={() => setIzq(i)}
            >
              {p.izq}
            </button>
          ))}
        </div>
        <div className="ses__col">
          {orden.map((j) => (
            <button
              key={j}
              type="button"
              className={`ses__par ${hechos.includes(j) ? "hecho" : ""} ${
                fallo === j ? "mal" : ""
              }`}
              disabled={!!res || hechos.includes(j)}
              onClick={() => tocarDer(j)}
            >
              {ej.pares[j].der}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
function Pregunta({
  ej,
  texto,
  setTexto,
  res,
  onEnter,
  inputRef,
  elegida,
  alElegir,
  alResponder,
  alResponderValor,
}) {
  if (ej.tipo === "ordenar") {
    return <Ordenar key={ej.id} ej={ej} res={res} alResponder={alResponderValor} />;
  }
  if (ej.tipo === "emparejar") {
    return <Emparejar key={ej.id} ej={ej} res={res} alResponder={alResponderValor} />;
  }
  if (ej.tipo === "elegir") {
    return (
      <Elegir
        ej={ej}
        res={res}
        elegida={elegida}
        alElegir={alElegir}
        alResponder={alResponder}
      />
    );
  }
  if (ej.tipo === "texto_mixto") {
    return (
      <TextoMixto
        ej={ej}
        texto={texto}
        setTexto={setTexto}
        res={res}
        onEnter={onEnter}
        inputRef={inputRef}
      />
    );
  }
  const partes = ej.enunciado.split("___");
  const largo = Math.max(
    ...(ej.respuestas && ej.respuestas.length
      ? ej.respuestas.map((r) => r.length)
      : [12])
  );
  const enLinea =
    partes.length === 2 &&
    ej.tipo !== "verdadero_falso" &&
    ej.tipo !== "oracion_libre" &&
    largo <= 28;
  const ancho = Math.min(
    Math.max(largo, 4),
    40
  );
  const consigna = consignaDe(ej);
  const campo = (extra = "") => (
    <input
      ref={inputRef}
      className={`ses__campo ${extra} ${
        res ? (res.ok ? "ok" : "mal") : ""
      }`}
      style={
        extra
          ? undefined
          : {
              minWidth: `${ancho + 2}ch`,
            }
      }
      value={texto}
      maxLength={largo}
      disabled={!!res}
      onChange={(e) => setTexto(e.target.value)}
      onKeyDown={onEnter}
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck="false"
      aria-label="Tu respuesta"
    />
  );
  const audio = ej.audio && (
    <button
      type="button"
      className="ing-audio"
      onClick={() =>
        decir(
          ej.audio.texto,
          ej.audio.idioma
        )
      }
      aria-label="Escuchar"
    >
      <i
        className="bi bi-volume-up-fill"
        aria-hidden="true"
      />
    </button>
  );
  if (enLinea) {
    return (
      <p className="ses__enun ses__enun--linea">
        {audio} {partes[0]}
        {campo()}
        {partes[1]}
      </p>
    );
  }
  return (
    <>
      {consigna && (
        <p className="ses__consigna">
          {consigna}
        </p>
      )}
      <p className="ses__enun">
        {audio}{" "}
        {ej.enunciado.replace(/___/g, "…")}
      </p>
      {ej.tipo !== "verdadero_falso" &&
        campo("ancho")}
    </>
  );
}
export default function Leccion({
  seccion,
  esUltima,
  alTerminar,
  alSiguiente,
  alRepetir,
  alAnterior,
  alSaltar,
}) {
  const ejercicios = seccion.ejercicios;
  const [cola, setCola] = useState(() =>
    ejercicios.map((_, k) => k)
  );
  const [pos, setPos] = useState(0);
  const [texto, setTexto] = useState("");
  const [elegida, setElegida] = useState(null);
  const [res, setRes] = useState(null);
  const [aciertos, setAciertos] = useState(0);
  const [fallados, setFallados] = useState([]);
  const [fin, setFin] = useState(null);
  const conEstudio =
    !seccion.texto &&
    !seccion.textosReferencia &&
    !["Evaluación", "Repaso", "Texto"].includes(
      seccion.titulo
    );
  // inicio = teoría + botón
  // espera = cuenta regresiva
  // preguntas = ejercicios
  const [fase, setFase] = useState(
    conEstudio ? "inicio" : "preguntas"
  );
  const [seg, setSeg] = useState(ESPERA_SEG);
  useEffect(() => {
    if (fase !== "espera") return undefined;
    if (seg <= 0) {
      setFase("preguntas");
      return undefined;
    }
    const t = setTimeout(
      () => setSeg((x) => x - 1),
      1000
    );
    return () => clearTimeout(t);
  }, [fase, seg]);
  const inputRef = useRef(null);
  const idx = cola[pos];
  const ej = ejercicios[idx];
  const esRepaso =
    fallados.includes(idx) &&
    pos >= ejercicios.length;
  useEffect(() => {
    if (fase !== "preguntas") return;
    setTexto("");
    setElegida(null);
    setRes(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (
      ej.audio &&
      (
        ej.tipo === "dictado" ||
        ej.tipo === "deletrear" ||
        ej.autoaudio
      )
    ) {
      decir(
        ej.audio.texto,
        ej.audio.idioma
      );
    }
  }, [pos, fase]);
  function iniciar() {
    setSeg(ESPERA_SEG);
    setFase("espera");
  }
  function volverTeoria() {
    setFase("inicio");
  }
  function comprobar(valor) {
    if (res) return;
    const v =
      valor !== undefined
        ? valor
        : texto;
    if (!String(v).trim()) return;
    const r = revisar(ej, v);
    setRes(r);
    if (r.ok) {
      if (!fallados.includes(idx)) {
        setAciertos((a) => a + 1);
      }
    } else if (!fallados.includes(idx)) {
      setFallados((f) => [
        ...f,
        idx,
      ]);
      setCola((c) => [
        ...c,
        idx,
      ]);
    }
  }
  function siguiente() {
    if (pos + 1 < cola.length) {
      setPos(pos + 1);
      return;
    }
    const total = ejercicios.length;
    const dom = seccion.dominio || {};
    const dominada =
      aciertos / total >=
      (dom.umbralAciertos || 0.8);
    const r = {
      aciertos,
      total,
      dominada,
    };
    setFin(r);
    alTerminar(r);
  }
  function repetirPregunta() {
    setRes(null);
    setElegida(null);
    setTexto("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }
  const onEnter = (e) => {
    if (e.key !== "Enter") return;
    if (res) {
      if (res.ok) {
        siguiente();
      } else {
        repetirPregunta();
      }
    } else {
      comprobar();
    }
  };
  return (
    <div
      className={`ses ${
        conEstudio && fase !== "inicio"
          ? "ses--preguntas"
          : ""
      }`}
    >
      {/* TEORÍA */}
      {conEstudio && fase === "inicio" && (
        <>
          <Teoria seccion={seccion} />
          <div className="teoria-nav-botones">
            <button
              type="button"
              className="teoria-nav-btn"
              onClick={alAnterior}
              disabled={!alAnterior}
              title="Sesión anterior"
              aria-label="Sesión anterior"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>
            <button
              type="button"
              className="teoria-nav-btn teoria-nav-btn--game"
              onClick={iniciar}
              title="Ir a las preguntas"
              aria-label="Ir a las preguntas"
            >
              <i className="fa-solid fa-gamepad" />
            </button>
            <button
              type="button"
              className="teoria-nav-btn"
              onClick={alSaltar}
              disabled={!alSaltar}
              title="Siguiente sesión"
              aria-label="Siguiente sesión"
            >
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </>
      )}
      {/* EJERCICIOS */}
      {(!conEstudio || fase !== "inicio") && (
        <section
          className="ses__pregunta"
          aria-live="polite"
        >
          {fase === "espera" ? (
            <div className="ses__espera">
              <p className="ses__espera-num">
                {seg}
              </p>
            </div>
          ) : fin ? (
            <div>
              {conEstudio && (
                <button
                  type="button"
                  className="ses__volver"
                  onClick={volverTeoria}
                  aria-label="Volver a teoría"
                >
                  <i
                    className="bi bi-arrow-left"
                    aria-hidden="true"
                  />
                </button>
              )}
              <p className="ses__enun">
                {fin.dominada
                  ? "Sesión completada"
                  : "Repite la sesión"}
              </p>
              <p className="ses__nota">
                {fin.aciertos} / {fin.total}
              </p>
              <p className="ses__err">
                Aciertos a la primera. Lo que fallaste ya lo repetiste al final.
              </p>
              {fin.dominada ? (
                <button
                  type="button"
                  className="ing-btn ing-btn--principal ing-btn--ancho"
                  onClick={alSiguiente}
                >
                  {esUltima
                    ? "Terminar nivel"
                    : "Siguiente sesión"}
                </button>
              ) : (
                <button
                  type="button"
                  className="ing-btn ing-btn--principal ing-btn--ancho"
                  onClick={alRepetir}
                >
                  Repetir
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="ses__pregunta-barra">
                {conEstudio && (
                  <button
                    type="button"
                    className="ses__volver"
                    onClick={volverTeoria}
                    aria-label="Volver a teoría"
                  >
                    <i
                      className="bi bi-arrow-left"
                      aria-hidden="true"
                    />
                  </button>
                )}
                <p className="ses__cuenta">
                  {pos + 1} / {cola.length}
                  {esRepaso &&
                    " · repaso de un error"}
                </p>
              </div>
              <Pregunta
                ej={ej}
                texto={texto}
                setTexto={setTexto}
                res={res}
                onEnter={onEnter}
                inputRef={inputRef}
                elegida={elegida}
                alElegir={(o) => {
                  setElegida(o);
                }}
                alResponder={() => {
                  comprobar(elegida);
                }}
                alResponderValor={(v) => comprobar(v)}
              />
              {ej.tipo === "verdadero_falso" && (
                <div className="ses__vf">
                  {["True", "False"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={!!res}
                      className="ing-btn ing-btn--principal"
                      onClick={() => {
                        setTexto(v);
                        comprobar(v);
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {MOSTRAR_FEEDBACK && res && (
                <div
                  className={`ses__fb ${
                    res.ok ||
                    ej.tipo === "elegir"
                      ? ""
                      : "mal"
                  }`}
                  role="status"
                >
                  {res.ok ? (
                    <>
                      <i
                        className="bi bi-check-lg"
                        aria-hidden="true"
                      />{" "}
                      Correcto
                    </>
                  ) : (
                    <>
                      <div>
                        <i
                          className="bi bi-x-lg"
                          aria-hidden="true"
                        />{" "}
                        Incorrecto
                      </div>
                      {pos < ejercicios.length && (
                        <div className="ses__err">
                          Volverá al final para que lo intentes otra vez.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {!res &&
                ej.tipo !== "verdadero_falso" &&
                ej.tipo !== "elegir" &&
                ej.tipo !== "ordenar" &&
                ej.tipo !== "emparejar" && (
                  <button
                    type="button"
                    className="ing-btn ing-btn--principal ing-btn--ancho"
                    disabled={!texto.trim()}
                    onClick={() => comprobar()}
                  >
                    Comprobar
                  </button>
                )}
              {res && (
                <button
                  type="button"
                  className={`ing-btn ing-btn--ancho ${
                    res.ok ||
                    ej.tipo === "elegir"
                      ? "ing-btn--principal"
                      : "ing-btn--danger"
                  }`}
                  onClick={
                    res.ok
                      ? siguiente
                      : repetirPregunta
                  }
                >
                  <i
                    className={`bi ${
                      res.ok
                        ? "bi-arrow-right"
                        : "bi-arrow-repeat"
                    }`}
                    aria-hidden="true"
                  />{" "}
                  {res.ok
                    ? "Continuar"
                    : "Repetir"}
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}