import Museum from "./src/js/Museum.js";
import Hud from "./src/js/ui/Hud.js";
import ArtworkPanel from "./src/js/ui/ArtworkPanel.js";
import Picker from "./src/js/Picker.js";

/**
 * Point d'entrée : le seul fichier qui connaît À LA FOIS la 3D et le DOM.
 * Il ne fait que câbler les deux couches ensemble.
 */

const canvas = document.getElementById('canvas');
const museum = new Museum(canvas);
const hud = new Hud(document.getElementById('hud'));
const artworkPanel = new ArtworkPanel(document.getElementById('artwork-panel'));
const cameraAnimationDuration = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : undefined;
let inspectionActive = false;

// --- 3D → DOM ---------------------------------------------------------------
museum.on('hover', (artwork) => hud.setTooltip(artwork));
museum.on('stats', (stats) => hud.setStats(stats));
museum.on('lock', (locked) => {
  // La perte du pointer lock est normale pendant une inspection : l'écran
  // d'accueil doit rester masqué pendant les deux travellings.
  if (!inspectionActive) hud.setLocked(locked);
});
museum.on('select', async (artwork) => {
  if (inspectionActive) return;

  inspectionActive = true;
  hud.setInspecting(true);
  museum.setPaused(true);
  museum.unlock();

  await museum.focusArtwork(artwork, cameraAnimationDuration());
  artworkPanel.open(artwork);
});

// --- DOM → 3D ---------------------------------------------------------------
hud.onStart(() => museum.lock());

artworkPanel.onClose(async () => {
  if (!inspectionActive || !artworkPanel.isOpen) return;

  await artworkPanel.close();
  await museum.restoreVisitView(cameraAnimationDuration());

  inspectionActive = false;
  museum.setPaused(false);
  hud.setInspecting(false);
  museum.lock();
});

// --- Clic sur le canvas ------------------------------------------------------
// Une seule règle, décidée une fois pour toutes :
//   souris verrouillée   → le clic vise le réticule (centre de l'écran)
//   souris libre         → le clic vise le pointeur (indispensable au tactile)
canvas.addEventListener('click', (event) => {
  if (inspectionActive) return;

  if (museum.isLocked) {
    museum.trySelect(null);
    return;
  }

  const ndc = Picker.toNDC(event.clientX, event.clientY, canvas.getBoundingClientRect());
  // Si le clic ne touche aucune œuvre, il sert à (re)prendre le contrôle de la caméra.
  if (!museum.trySelect(ndc)) museum.lock();
});

museum.render();
