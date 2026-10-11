import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import manifest from "../../data/manifest.json";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";
import RutaNiveles from "../../components/InglesRutaNiveles";
import NivelView from "../../components/InglesNivelView";
import {
  cargarProgreso,
  guardarProgreso,
  seccionesHechas,
} from "../../lib/inglesProgreso";
export default function InglesPage() {
  const navigate = useNavigate();
  // Los niveles salen del manifest (curso ING, carpeta temas/ing): ya no hay index.json aparte
  const indice = useMemo(() => {
    const curso = manifest.cursos.find((c) => c.codigo === "ING");
    return (curso ? curso.temas : []).map((t) => ({
      id: t.nivelId,
      nombre: t.nivelNombre,
      secciones: t.nivelSecciones,
      archivo: t.archivo,
    }));
  }, []);
  const error = indice.length === 0 ? "No hay niveles de inglés en el manifest" : null;
  const [progreso, setProgreso] = useState(cargarProgreso);
  const [nivelAbierto, setNivelAbierto] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const niveles = indice.map((n) => ({
    id: n.id,
    nombre: n.nombre,
    total: n.secciones,
    hechas: seccionesHechas(progreso, n.id),
    archivo: n.archivo,
  }));
  function guardarResultado(idNivel, idSeccion, r) {
    setProgreso((prev) => {
      const nivel = prev[idNivel] || { secciones: {} };
      const antes = nivel.secciones[idSeccion] || {};
      const mejor = Math.max(antes.mejor || 0, r.aciertos / r.total);
      const nuevo = {
        ...prev,
        [idNivel]: {
          secciones: {
            ...nivel.secciones,
            [idSeccion]: {
              mejor,
              dominada: !!antes.dominada || r.dominada,
            },
          },
        },
      };
      guardarProgreso(nuevo);
      return nuevo;
    });
  }
  return (
    <main className="container__ingles">
      <AppHeader
        section="ingles"
        onAbrirBuscador={() => setSearchOpen(true)}
      />
      <div className="ingles-page">
        {nivelAbierto ? (
          <NivelView
            nivel={nivelAbierto}
            progreso={progreso}
            alGuardar={guardarResultado}
            alVolver={() => setNivelAbierto(null)}
          />
        ) : (
          <>
            <h1 className="ingles-page__titulo">Inglés · Niveles</h1>
            {error && <p className="ingles-page__error">{error}</p>}
            {!error && niveles.length === 0 && (
              <p className="ingles-page__cargando">Cargando...</p>
            )}
            {niveles.length > 0 && (
              <RutaNiveles
                niveles={niveles}
                alSeleccionar={(nivel, estado) => {
                  if (estado === "bloqueado") return;
                  setNivelAbierto(nivel);
                }}
              />
            )}
          </>
        )}
      </div>
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(item) => {
          setSearchOpen(false);
          navigate(
            `/?q=${encodeURIComponent(
              item.type === "curso" ? item.nombre : item.tema
            )}`
          );
        }}
      />
    </main>
  );
}
