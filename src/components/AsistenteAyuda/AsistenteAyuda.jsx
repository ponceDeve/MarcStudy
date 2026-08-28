import { useEffect, useRef, useState } from "react";

import {
  precargarConocimientoAsistente,
  responderPreguntaAsistente,
  sugerenciasIniciales,
} from "../../lib/asistente";

import { useLocalStorage } from "../../hooks/useLocalStorage";

import AsistenteIconoPrincipal, {
  AsistenteIconosFila,
} from "./AsistenteIconos";

let idMensaje = 0;

function nuevoId() {
  idMensaje += 1;
  return idMensaje;
}

function mensajeBienvenida() {
  return {
    id: nuevoId(),
    de: "asistente",
    texto:
      "Hola, soy el asistente de Mi Estudio. Pregúntame cómo funciona cualquier parte de la app, por ejemplo:",
    sugerencias: sugerenciasIniciales(4),
  };
}

function mensajeNoEncontrado() {
  return {
    id: nuevoId(),
    de: "asistente",
    texto:
      "No encontré una respuesta exacta para eso. Prueba a preguntarlo de otra forma, o elige un tema:",
    sugerencias: sugerenciasIniciales(4),
  };
}

export default function AsistenteAyuda() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState(() => [
    mensajeBienvenida(),
  ]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const listaRef = useRef(null);
  const inputRef = useRef(null);
  const yaPrecargado = useRef(false);

  const [nombreUsuario] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  useEffect(() => {
    if (!abierto) return;

    if (!yaPrecargado.current) {
      yaPrecargado.current = true;
      precargarConocimientoAsistente();
    }

    const t = setTimeout(
      () => inputRef.current?.focus(),
      150
    );

    return () => clearTimeout(t);
  }, [abierto]);

  useEffect(() => {
    if (!listaRef.current) return;

    listaRef.current.scrollTop =
      listaRef.current.scrollHeight;
  }, [mensajes, pensando, abierto]);

  async function enviarPregunta(preguntaTexto) {
    const limpio = String(preguntaTexto || "").trim();

    if (!limpio || pensando) return;

    const contexto = mensajes.slice(-6);

    setMensajes((prev) => [
      ...prev,
      {
        id: nuevoId(),
        de: "usuario",
        texto: limpio,
      },
    ]);

    setTexto("");
    setPensando(true);

    let entrada = null;

    try {
      entrada = await responderPreguntaAsistente(
        limpio,
        contexto
      );
    } catch {
      entrada = null;
    }

    setPensando(false);

    setMensajes((prev) => [
      ...prev,
      entrada
        ? {
          id: nuevoId(),
          de: "asistente",
          texto: elegirRespuesta(
            entrada.respuestas
          ),
          icono: entrada.icono,
          iconos: entrada.iconos,
        }
        : mensajeNoEncontrado(),
    ]);
  }

  function elegirRespuesta(respuestas) {
    if (
      !Array.isArray(respuestas) ||
      respuestas.length === 0
    ) {
      return "";
    }

    const i = Math.floor(
      Math.random() * respuestas.length
    );

    return respuestas[i];
  }

  function onSubmit(e) {
    e.preventDefault();
    enviarPregunta(texto);
  }

  function alternarChat() {
    setAbierto((v) => {
      const siguiente = !v;

      if (!siguiente) {
        setMensajes([mensajeBienvenida()]);
        setTexto("");
      }

      return siguiente;
    });
  }

  return (
    <>
      <button
        type="button"
        className={`asistente-boton ${abierto ? "is-activo" : ""
          }`}
        onClick={alternarChat}
        aria-label={
          abierto
            ? "Cerrar asistente de ayuda"
            : "Abrir asistente de ayuda"
        }
        title="Asistente de ayuda"
      >
        <i
          className={
            abierto
              ? "fa-solid fa-xmark"
              : "fa-solid fa-robot"
          }
        />
      </button>

      <div
        className={`asistente-chatbox ${abierto ? "" : "is-cerrado"
          }`}
        role="dialog"
        aria-label="Asistente de ayuda de Mi Estudio"
        aria-hidden={!abierto}
      >
        <div className="asistente-chatbox__header">
          <div className="asistente-chatbox__header-info">
            <span className="asistente-chatbox__header-icono">
              <i className="fa-solid fa-robot" />
            </span>

            <span className="asistente-chatbox__header-titulo">
              Asistente de {nombreUsuario || "Mi Estudio"}
            </span>
          </div>

          <button
            type="button"
            className="asistente-chatbox__cerrar"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div
          className="asistente-chatbox__mensajes"
          ref={listaRef}
        >
          {mensajes.map((m) => (
            <div
              key={m.id}
              className={`asistente-msg asistente-msg--${m.de === "usuario"
                  ? "usuario"
                  : "asistente"
                }`}
            >
              {m.de === "asistente" && (
                <AsistenteIconoPrincipal
                  icono={m.icono}
                />
              )}

              <div className="asistente-msg__burbuja">
                <p className="asistente-msg__texto">
                  {m.texto}
                </p>

                {m.de === "asistente" && (
                  <AsistenteIconosFila
                    iconos={m.iconos}
                  />
                )}

                {m.sugerencias &&
                  m.sugerencias.length > 0 && (
                    <div className="asistente-msg__sugerencias">
                      {m.sugerencias.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          className="asistente-msg__sugerencia"
                          onClick={() =>
                            enviarPregunta(s)
                          }
                          disabled={pensando}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {pensando && (
            <div className="asistente-msg asistente-msg--asistente">
              <div className="asistente-msg__burbuja asistente-msg__burbuja--pensando">
                <span className="asistente-typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
        </div>

        <form
          className="asistente-chatbox__form"
          onSubmit={onSubmit}
        >
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={texto}
            onChange={(e) =>
              setTexto(e.target.value)
            }
            placeholder="Escribe tu pregunta..."
            className="asistente-chatbox__input"
          />

          <button
            type="submit"
            className="asistente-chatbox__enviar"
            disabled={!texto.trim() || pensando}
            aria-label="Enviar pregunta"
          >
            <i className="fa-solid fa-paper-plane" />
          </button>
        </form>
      </div>
    </>
  );
}