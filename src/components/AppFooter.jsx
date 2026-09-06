import { useRef } from "react";

export default function AppFooter() {
  const anio = new Date().getFullYear();

  // Gesto secreto: tocar "MarcStudy" 7 veces seguidas (en menos de
  // 2.5s entre cada toque) dispara un evento global que activa o
  // desactiva el modo de prueba (avanzar de pregunta sin responder).
  // No hay ningún botón ni indicio visible de esto en la interfaz.
  const toquesRef = useRef(0);
  const ultimoToqueRef = useRef(0);

  function manejarToqueSecreto() {
    const ahora = Date.now();

    if (ahora - ultimoToqueRef.current > 2500) {
      toquesRef.current = 0;
    }

    ultimoToqueRef.current = ahora;
    toquesRef.current += 1;

    if (toquesRef.current >= 7) {
      toquesRef.current = 0;
      window.dispatchEvent(new Event("mp-toggle"));
    }
  }

  return (
    <footer className="app-footer">
      <p
        className="app-footer__brand"
        onClick={manejarToqueSecreto}
      >
        MarcStudy — Plataforma de aprendizaje
      </p>
      <p className="app-footer__copyright">
        © {anio} Junior Niño Ponce. Todos los derechos reservados.
      </p>
    </footer>
  );
}