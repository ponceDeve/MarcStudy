# 🎨 Integración del Nuevo Landing

Tu nuevo sistema de landing está listo para usarse. Sigue estos pasos para integrarlo:

## ✅ Archivos Nuevos Creados

```
✓ src/components/HeroLanding.jsx     - Hero section con buscador y stats
✓ src/components/CursosGrid.jsx      - Grid de cursos con progreso visual
✓ src/styles/_hero-landing.scss      - Estilos del hero
✓ src/styles/_cursos-grid.scss       - Estilos del grid de cursos
```

## 🚀 Opción 1: Reemplazar WelcomeSection Completa

En `src/pages/MiEstudio/MiEstudioPage.jsx`, busca donde se renderiza `<WelcomeSection>` y reemplázalo:

```jsx
// ❌ ANTES:
import WelcomeSection from "../../components/WelcomeSection";

// En el render, donde veas:
{!topicData && !nombreCursoActivo && (
  <WelcomeSection
    onSelectTema={seleccionarItem}
    temasCompletadosLista={temasCompletados}
  />
)}

// ✅ DESPUÉS:
import HeroLanding from "../../components/HeroLanding";
import CursosGrid from "../../components/CursosGrid";

// En el render:
{!topicData && !nombreCursoActivo && (
  <>
    <HeroLanding
      onSelectTema={seleccionarItem}
      onSearch={(query) => {
        // Aquí puedes manejar búsqueda en tiempo real si lo deseas
        if (query) {
          setSearchOpen(true);
        }
      }}
      temasCompletadosLista={temasCompletados}
    />
    <CursosGrid
      onSelectTema={seleccionarItem}
      temasCompletadosLista={temasCompletados}
    />
  </>
)}
```

## 🎯 Opción 2: Crear una Nueva Página de Landing

Si prefieres una página separada, crea:

```jsx
// src/pages/Landing/LandingPage.jsx
import { useNavigate } from "react-router-dom";
import HeroLanding from "../../components/HeroLanding";
import CursosGrid from "../../components/CursosGrid";
import AppHeader from "../../components/AppHeader";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleSelectTema = (item) => {
    navigate("/", { state: { temaSeleccionado: item } });
  };

  return (
    <div>
      <AppHeader />
      <HeroLanding
        onSelectTema={handleSelectTema}
        temasCompletadosLista={[]}
      />
      <CursosGrid
        onSelectTema={handleSelectTema}
        temasCompletadosLista={[]}
      />
    </div>
  );
}
```

Luego añade la ruta en `App.jsx`:

```jsx
import LandingPage from "./pages/Landing/LandingPage";

<Route path="/landing" element={<LandingPage />} />
```

## 🎨 Personalización

### Cambiar Colores

En `_hero-landing.scss`, ajusta:

```scss
.hero-landing {
  background: linear-gradient(
    135deg,
    #0f172a 0%,     // ← Color oscuro fondo
    #1e293b 50%,
    #0f172a 100%
  );
}

.hero-landing__highlight {
  background: linear-gradient(
    135deg,
    #fbbf24 0%,     // ← Color dorado/naranja del highlight
    #f59e0b 100%
  );
}
```

### Cambiar Textos

En `HeroLanding.jsx`:

```jsx
<h1 className="hero-landing__title">
  Tu nuevo título aquí
</h1>

<p className="hero-landing__subtitle">
  Tu nueva descripción aquí
</p>
```

### Cambiar Iconos en Stats

En `HeroLanding.jsx`:

```jsx
<div className="hero-landing__stat-icon">
  <i className="fa-solid fa-book"></i>  {/* ← Cambiar icono */}
</div>
```

Usa iconos de [FontAwesome](https://fontawesome.com/icons)

## 📱 Responsive

El landing es completamente responsive:
- ✅ Desktop (1300px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (480px - 768px)
- ✅ Pequeños (< 480px)

## 🔍 Buscador

El buscador en el hero dispara `onSearch()`. Puedes conectarlo a:

```jsx
<HeroLanding
  onSearch={(query) => {
    // Filtrar cursos/temas en tiempo real
    // O abrir modal de búsqueda
    if (query) {
      setSearchOpen(true);
      // Pasar query al SearchModal
    }
  }}
/>
```

## 🎯 Stats

Los stats se calculan automáticamente del manifest:
- **Cursos**: Cantidad de cursos con temas
- **Temas**: Total de temas en todos los cursos
- **Preguntas**: Suma de preguntas.length en todos los temas
- **Temas Conquistados**: De `temasCompletadosLista`

Si quieres que sea dinámico, actualiza en `HeroLanding.jsx`:

```jsx
const totalPreguntas = useMemo(() => {
  // Tu lógica personalizada
  return 1000;
}, []);
```

## 🚀 Deployment

1. Asegúrate de que los imports en `_hero-landing.scss` apunten a `_tokens.scss`:

```scss
@import "./tokens";
```

2. Verifica que FontAwesome está cargado en `index.html`

3. Si hay conflictos de estilos, aumenta la especificidad o usa `!important` en casos puntuales

## 💡 Tips

- El hero usa `grid-template-columns: 1fr 1fr` en desktop y se colapsa a 1 columna en mobile
- Las animaciones usan `@keyframes` estándar con delays progresivos
- Los colores usan CSS variables (`var(--card-color)`) para fácil personalización
- Todo es accesible (ARIA labels, semantic HTML)

## 🐛 Troubleshooting

**Q: Los estilos no aplican**
- Verifica que los archivos SCSS estén importados correctamente
- Revisa que el compilador SCSS esté corriendo

**Q: Los iconos no aparecen**
- Asegúrate que FontAwesome v6+ está en `public/index.html`
- Usa `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`

**Q: Responsive se ve roto**
- Abre DevTools (F12) y activa "Device toolbar"
- Verifica que los breakpoints en media queries estén correctos

---

¿Tienes dudas? ¡Pregunta! 🚀
