# Javaid Bashir — Cinematic 3D Glass Hero Section

A luxury, Apple-inspired personal portfolio hero section designed for **Javaid Bashir**, Senior Service Desk Specialist & Cloud / AI Explorer.

---

## 💎 Design System & Visual Direction

- **Apple Spatial Glass Aesthetic**: Multi-layered frosted glass panels (`backdrop-filter: blur(24px)`), hairline translucent borders (`1px solid rgba(255, 255, 255, 0.12)`), and specular inner highlights.
- **Cinematic 3D Video Backdrop**: Full-bleed background `<video>` supporting autoplay, loop, muted, and playsinline, with an asymmetric dark vignette protecting typography on the left while celebrating the visual energy on the right.
- **Procedural 3D Flow Fallback**: When no video file is loaded yet, an interactive generative canvas immediately renders a silky 3D ribbon flow with cool-blue illumination.
- **Restrained Cool-Blue Lighting**: Subtle volumetric glow accents (`#38bdf8`, `#22d3ee`, `#818cf8`) without excessive neon or cyberpunk cliches.
- **Layer 3 Floating Dust**: Microscopic 3D stardust motes reacting delicately to mouse gestures and spatial depth.
- **Spring-Engineered Entrance Choreography**: Non-blocking staggered entry sequence:
  1. Cinematic backdrop & atmospheric lighting (0ms)
  2. Floating glass navigation bar (200ms)
  3. Status pill: `● AVAILABLE FOR OPPORTUNITIES` (350ms)
  4. Name: `JAVAID BASHIR` (500ms)
  5. Role: `Senior Service Desk Specialist` (650ms)
  6. Domain tags: `Cloud Technology • GCP • AI • Technical Support` (800ms)
  7. Bio narrative (950ms)
  8. Spatial glass CTA buttons (1100ms)
- **Accessibility**: Full support for `prefers-reduced-motion: reduce`.

---

## 📁 File Structure

```
portfolio/
├── index.html        # Semantic HTML5 with 6-layer 3D spatial layout
├── style.css         # Apple-inspired glass tokens, typography, and responsive rules
├── main.js           # Video controller, fallback canvas, 3D particles & tilt
└── assets/
    └── hero-flow.mp4 # (Drop your cinematic 3D Google Flow video here)
```

---

## 🚀 How to Run & Preview

### Option 1: Direct Browser Launch
Double-click `index.html` or open it directly in Google Chrome, Edge, Safari, or Brave.

### Option 2: Local HTTP Server (Recommended for video & performance)
Run in PowerShell inside this directory:
```powershell
npx serve .
# Or using Python:
python -m http.server 3000
```
Then visit: `http://localhost:3000`

---

## 🎬 Adding Your Video
1. Place your Google Flow video file in `assets/` and name it `hero-flow.mp4`.
2. The page will instantly detect it, fade in the video smoothly, and transition the procedural canvas into subtle atmospheric background lighting.
