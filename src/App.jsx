import { BrowserRouter, Routes, Route } from "react-router-dom";

import MiEstudioPage from "./pages/MiEstudio/MiEstudioPage";
import HorarioPage from "./pages/Horario/HorarioPage";
import ScheduleEditor from "./pages/Horario/ScheduleEditor";
import RepasoPage from "./pages/Repaso/RepasoPage";

import { PomodoroProvider } from "./context/PomodoroContext";

import {
  FooterVisibilityProvider,
  useFooterVisibility,
} from "./context/FooterVisibilityContext";

import AppFooter from "./components/AppFooter";
import AsistenteAyuda from "./components/AsistenteAyuda/AsistenteAyuda";

function AppFooterGate() {
  const { footerHidden } = useFooterVisibility();

  return footerHidden ? null : <AppFooter />;
}

export default function App() {
  return (
    <BrowserRouter basename="/MarcStudy">
      <PomodoroProvider>
        <FooterVisibilityProvider>
          <Routes>
            <Route path="/" element={<MiEstudioPage />} />
            <Route path="/pomodoro" element={<HorarioPage />} />
            <Route path="/editar" element={<ScheduleEditor />} />
            <Route path="/repaso" element={<RepasoPage />} />
          </Routes>

          <AppFooterGate />

          {/* Asistente de ayuda GLOBAL: fuera de <Routes>, así que se
              mantiene montado (mismo ícono, mismo chat) sin importar a
              qué pantalla se navegue: Inicio, un tema, teoría, preguntas,
              examen, Repaso o Pomodoro. */}
          <AsistenteAyuda />
        </FooterVisibilityProvider>
      </PomodoroProvider>
    </BrowserRouter>
  );
}