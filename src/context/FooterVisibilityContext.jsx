import { createContext, useContext, useState } from "react";

// Contexto chiquito para que una página (por ahora, Mi Estudio mientras
// está en teoría o en pregunta) pueda decirle a App.jsx que oculte el
// footer global. En todo lo demás (menú inicial, Horario, Repaso, etc.)
// el footer se sigue mostrando normalmente.
const FooterVisibilityContext = createContext(null);

export function FooterVisibilityProvider({ children }) {
  const [footerHidden, setFooterHidden] = useState(false);

  return (
    <FooterVisibilityContext.Provider value={{ footerHidden, setFooterHidden }}>
      {children}
    </FooterVisibilityContext.Provider>
  );
}

export function useFooterVisibility() {
  const ctx = useContext(FooterVisibilityContext);
  // Si algún componente lo usa fuera del provider (no debería pasar),
  // devolvemos un no-op en vez de explotar.
  if (!ctx) {
    return { footerHidden: false, setFooterHidden: () => {} };
  }
  return ctx;
}
