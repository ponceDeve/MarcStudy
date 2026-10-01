import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MiEstudioPage from "./pages/MiEstudio/MiEstudioPage";
const HorarioPage = lazy(() => import("./pages/Horario/HorarioPage"));
const RepasoPage = lazy(() => import("./pages/Repaso/RepasoPage"));
const ExamenPage = lazy(() => import("./pages/Examen/ExamenPage"));
const InglesPage = lazy(() => import("./pages/Ingles/InglesPage"));
import { PomodoroProvider } from "./context/PomodoroContext";
import {
  FooterVisibilityProvider,
  useFooterVisibility,
} from "./context/FooterVisibilityContext";
import AppFooter from "./components/AppFooter";
function AppFooterGate() {
  const { footerHidden } = useFooterVisibility();
  return footerHidden ? null : <AppFooter />;
}
export default function App() {
  return (
    <BrowserRouter basename="/MarcStudy">
      <PomodoroProvider>
        <FooterVisibilityProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<MiEstudioPage />} />
              <Route path="/pomodoro" element={<HorarioPage />} />
              <Route path="/repaso" element={<RepasoPage />} />
              <Route path="/examen" element={<ExamenPage />} />
              <Route path="/ingles" element={<InglesPage />} />
            </Routes>
          </Suspense>
          <AppFooterGate />
        </FooterVisibilityProvider>
      </PomodoroProvider>
    </BrowserRouter>
  );
}