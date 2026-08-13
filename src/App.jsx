import { BrowserRouter, Routes, Route } from "react-router-dom";
import MiEstudioPage from "./pages/MiEstudio/MiEstudioPage";
import HorarioPage from "./pages/Horario/HorarioPage";
import ScheduleEditor from "./pages/Horario/ScheduleEditor"; // <-- Importar el editor
import RepasoPage from "./pages/Repaso/RepasoPage";
import { PomodoroProvider } from "./context/PomodoroContext";

export default function App() {
  return (
    <BrowserRouter basename="/cont_crono">
      <PomodoroProvider>
        <Routes>
          <Route path="/" element={<MiEstudioPage />} />
          <Route path="/pomodoro" element={<HorarioPage />} />
          <Route path="/editar" element={<ScheduleEditor />} /> {/* <-- Nueva ruta independiente */}
          <Route path="/repaso" element={<RepasoPage />} />
        </Routes>
      </PomodoroProvider>
    </BrowserRouter>
  );
}