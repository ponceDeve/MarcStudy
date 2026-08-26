import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import EditarNombreModal from "./EditarNombreModal";

export default function AppFooter() {
  const anio = new Date().getFullYear();
  const [nombreUsuario, setNombreUsuario] = useLocalStorage("miEstudio_nombreUsuario", null);
  const [editarNombreAbierto, setEditarNombreAbierto] = useState(false);

  return (
    <footer className="app-footer">
      <p className="app-footer__brand">Mi Estudio — Plataforma de aprendizaje</p>
      <p className="app-footer__copyright">
        © {anio} Junior Niño Ponce. Todos los derechos reservados.
      </p>

      {nombreUsuario && (
        <button
          type="button"
          className="app-footer__editar-nombre"
          onClick={() => setEditarNombreAbierto(true)}
        >
          <i className="fa-solid fa-pen" /> Editar nombre
        </button>
      )}

      <EditarNombreModal
        open={editarNombreAbierto}
        nombreActual={nombreUsuario}
        onGuardar={(n) => {
          setNombreUsuario(n);
          setEditarNombreAbierto(false);
        }}
        onCancelar={() => setEditarNombreAbierto(false)}
      />
    </footer>
  );
}