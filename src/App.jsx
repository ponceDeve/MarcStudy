import { BrowserRouter, Routes, Route } from "react-router-dom";
import MiEstudioPage from "./pages/MiEstudio/MiEstudioPage";
import HorarioPage from "./pages/Horario/HorarioPage";
import ScheduleEditor from "./pages/Horario/ScheduleEditor";
import RepasoPage from "./pages/Repaso/RepasoPage";
import { PomodoroProvider } from "./context/PomodoroContext";
import { FooterVisibilityProvider, useFooterVisibility } from "./context/FooterVisibilityContext";
import AppFooter from "./components/AppFooter";

function AppFooterGate() {
  const { footerHidden } = useFooterVisibility();
  return footerHidden ? null : <AppFooter />;
}

export default function App() {
  return (
    <BrowserRouter basename="/cont_crono">
      <PomodoroProvider>
        <FooterVisibilityProvider>
          <Routes>
            <Route path="/" element={<MiEstudioPage />} />
            <Route path="/pomodoro" element={<HorarioPage />} />
            <Route path="/editar" element={<ScheduleEditor />} />
            <Route path="/repaso" element={<RepasoPage />} />
          </Routes>

          <AppFooterGate />
        </FooterVisibilityProvider>
      </PomodoroProvider>
    </BrowserRouter>
  );
}