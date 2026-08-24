export default function ExercisesSection({
  examenPreguntas,
  onIniciarEjercicios,
  onModoEstudio,
}) {
  if (!examenPreguntas || examenPreguntas.length === 0) {
    return null;
  }

  return (
    <div className="exercises-section">
      <div className="exercises-header">
        <h3 className="exercises-header-title">
          📝 Práctica de Ejercicios
        </h3>
      </div>

      <p className="exercises-description">
        Practica con los ejercicios de este tema. Puedes responder uno por uno para reforzar tu comprensión de la teoría.
      </p>

      <div className="exercises-buttons">
        <button
          className="exercises-btn exercises-btn-primary"
          onClick={() => onModoEstudio("solo_preguntas")}
        >
          <span className="exercises-icon">▶</span>
          Comenzar Ejercicios
        </button>
      </div>
    </div>
  );
}