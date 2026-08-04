import { BrowserRouter, Routes, Route } from "react-router-dom";
import MiEstudioPage from "./pages/MiEstudio/MiEstudioPage";
import HorarioPage from "./pages/Horario/HorarioPage";
import RepasoPage from "./pages/Repaso/RepasoPage";
import SelectionTooltip from "./components/SelectionTooltip";
import { PomodoroProvider } from "./context/PomodoroContext";

export default function App() {
  return (
    <BrowserRouter basename="/cont_crono">
      <PomodoroProvider>
        <SelectionTooltip />
        <Routes>
          <Route path="/" element={<MiEstudioPage />} />
          <Route path="/pomodoro" element={<HorarioPage />} />
          <Route path="/repaso" element={<RepasoPage />} />
        </Routes>
      </PomodoroProvider>
    </BrowserRouter>
  );
}