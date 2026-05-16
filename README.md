# Orchestra Hero - Sistema de Práctica Musical

🎵 Aplicación interactiva de aprendizaje musical estilo Guitar Hero para instrumentos de orquesta.

## ✨ Características Principales

### 🎤 Práctica con Micrófono (Modo en Vivo)
- Detecta el instrumento real del estudiante mediante el micrófono
- Sistema de fallos: **2 fallos = repetir desde el inicio**
- Detección de nota en tiempo real usando análisis de frecuencia
- Compatible con violín, flauta, clarinete, piano, etc.

### ⌨️ Práctica con Teclado
- Controles clásico A-S-D-F estilo Guitar Hero
- Ideal para principiantes o práctica sin instrumento

### 👨‍🏫 Panel de Administración
- Los profesores pueden subir sus propias partituras MusicXML
- Gestión por instrumento, dificultad y categoría
- Almacenamiento en Supabase Storage

### 📊 Seguimiento de Progreso
- Registro de puntuación por estudiante
- Historial de intentos
- Estadísticas de precisión y combos
- (Próximamente: asignaciones de tareas)

## 🚀 Despliegue

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia el contenido de `supabase-schema.sql` y ejecútalo en el **SQL Editor**
3. En **Storage**, crea los buckets: `music` y `covers`

### 2. Vercel
```bash
cd vercel

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con:
# NEXT_PUBLIC_SUPABASE_URL=tu-proyecto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon

# Ejecutar localmente
npm run dev

# Desplegar
npx vercel deploy
```

## 🎮 Controles

### Modo Micrófono
- 🎤 Toca tu instrumento real
- El micrófono detectará automáticamente las notas
- **Si fallas 2 veces, debes repetir desde el inicio**

### Modo Teclado
- **A, S, D, F** = Notas lanes 0-3
- **ESC** = Salir/Pausa

## 🎯 Sistema de Puntuación

| Timing | Ventana | Puntos |
|--------|---------|--------|
| Perfect | ±50ms | 100 |
| Great | ±100ms | 75 |
| Good | ±150ms | 50 |
| OK | ±250ms | 25 |
| Miss | >250ms | 0 |

**Multiplicador de combo**: 2x (10+), 3x (30+), 4x (50+)

## 🎻 Instrumentos Soportados

| Instrumento | Color | Rango MIDI |
|-------------|-------|------------|
| Violin | #9b30ff | 55-103 |
| Viola | #cc6633 | 50-93 |
| Cello | #8b4513 | 36-96 |
| Contrabajo | #4a3728 | 28-67 |
| Flauta | #87ceeb | 60-108 |
| Oboe | #deb887 | 58-89 |
| Clarinete | #ffd700 | 50-103 |
| Fagot | #8b7355 | 34-75 |
| Trompa | #daa520 | 41-89 |
| Trompeta | #ff8c00 | 50-96 |
| Trombón | #cd853f | 40-75 |
| Tuba | #8b7355 | 28-65 |
| Piano | #4a4a5a | 21-108 |

## 📁 Estructura del Proyecto

```
vercel/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── page.tsx           # Página principal
│   │   └── globals.css        # Estilos Tailwind
│   ├── components/
│   │   ├── MainMenu.tsx       # Menú con selector de modo
│   │   ├── SongSelection.tsx  # Selector de canciones
│   │   ├── GameScreen.tsx     # Juego con teclado
│   │   ├── MicPracticeMode.tsx # Juego con micrófono
│   │   ├── ResultsScreen.tsx  # Pantalla de resultados
│   │   └── AdminPanel.tsx     # Panel de administración
│   ├── hooks/
│   │   ├── useGameStore.ts    # Estado general (Zustand)
│   │   └── useMicPracticeStore.ts # Estado microphone
│   └── lib/
│       ├── supabase.ts        # Cliente Supabase + tipos
│       ├── musicxml-parser.ts # Parser MusicXML
│       └── audio-detector.ts  # Análisis de audio
├── supabase-schema.sql        # Schema de base de datos
└── package.json
```

## 📝 Agregar MusicXML

### Desde el Panel de Admin
1. Ve a **Panel de Administración**
2. Arrastra tu archivo `.musicxml`
3. Completa: título, compositor, instrumento, dificultad
4. ¡Listo! La canción aparece automáticamente

### Formato MusicXML aceptado
```xml
<note>
  <pitch>
    <step>E</step>
    <octave>4</octave>
  </pitch>
  <duration>4</duration>
  <type>quarter</type>
</note>
```

El parser soporta:
- ✅ Notas con alteraciones (#, b)
- ✅ Digitaciones (finger)
- ✅ Dynamicas (p, f, etc.)
- ✅ Articulaciones (accent, staccato)
- ✅ Partituras multiparte

## 🔧 Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 📱 Integración Embebible

Para integrar en tu página principal:

```html
<iframe 
  src="https://tu-proyecto.vercel.app" 
  width="100%" 
  height="100%" 
  frameborder="0"
/>
```

O usa como componente en tu propio sitio Next.js.

---

**Desarrollado para uso educativo** 🎓