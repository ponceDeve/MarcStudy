export default function AppFooter() {
  const anio = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <p className="app-footer__brand">MarcStudy — Plataforma de aprendizaje</p>
      <p className="app-footer__copyright">
        © {anio} Junior Niño Ponce. Todos los derechos reservados.
      </p>
    </footer>
  );
}
