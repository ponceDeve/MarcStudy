import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Muestra el reloj del header solo unos segundos y luego lo oculta
 * (opacidad 0, sigue contando por debajo). En su lugar aparece el
 * texto "Tocar" con un icono. Al tocar el header el reloj se queda
 * visible hasta que se haga clic fuera del header.
 *
 * @param {object}   contenedorRef - ref del header (zona "dentro")
 * @param {any}      clave         - al cambiar (nueva pregunta) vuelve a mostrarse
 * @param {number}   ms            - tiempo visible (3000 por defecto)
 */
export default function RelojOculto({
  contenedorRef,
  clave,
  ms = 3000,
  children,
}) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const programarOcultar = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => setVisible(false),
      ms
    );
  }, [ms]);

  // Al entrar / cambiar de pregunta: visible 3 s y luego se oculta.
  useEffect(() => {
    setVisible(true);
    programarOcultar();
    return () => window.clearTimeout(timerRef.current);
  }, [clave, programarOcultar]);

  // Clic dentro del header: queda visible (no se vuelve a ocultar solo).
  // Clic fuera: ocultar.
  useEffect(() => {
    const onPointerDown = (e) => {
      const dentro =
        contenedorRef?.current &&
        contenedorRef.current.contains(e.target);
      if (dentro) {
        // Tocar el header lo deja visible y cancela el auto-ocultado.
        window.clearTimeout(timerRef.current);
        setVisible(true);
      } else {
        window.clearTimeout(timerRef.current);
        setVisible(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown);
  }, [contenedorRef, programarOcultar]);

  return (
    <div
      className={`reloj-oculto${visible ? " is-visible" : ""}`}
    >
      <div className="reloj-oculto__reloj">{children}</div>
      <span className="reloj-oculto__hint" aria-hidden="true">
        <i className="fa-solid fa-hand-pointer" />
        Tocar
      </span>
    </div>
  );
}