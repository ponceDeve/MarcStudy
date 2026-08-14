export default function AppFooter() {
  const anio = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <p>
        Hecho a pulso, un tema a la vez — <strong>Junior Ponce</strong> © {anio}
      </p>
    </footer>
  );
}
