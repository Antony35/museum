import Museum from "./src/js/Museum.js";
import Hud from "./src/js/ui/Hud.js";
import Modal from "./src/js/ui/Modal.js";
import Picker from "./src/js/Picker.js";

/**
 * Point d'entrée : le seul fichier qui connaît À LA FOIS la 3D et le DOM.
 * Il ne fait que câbler les deux couches ensemble.
 */

const canvas = document.getElementById('canvas');
const museum = new Museum(canvas);
const hud = new Hud(document.getElementById('hud'));
const modal = new Modal(document.getElementById('modal'));

// --- 3D → DOM ---------------------------------------------------------------
museum.on('hover', (artwork) => hud.setTooltip(artwork));
museum.on('stats', (stats) => hud.setStats(stats));
museum.on('lock', (locked) => {
  // Quand une fiche est ouverte, la perte du pointer lock est normale :
  // on ne réaffiche pas l'écran d'accueil par-dessus la modale.
  if (!modal.isOpen) hud.setLocked(locked);
});
museum.on('select', (artwork) => {
  museum.unlock();       // libère la souris pour que la fiche soit utilisable
  museum.setPaused(true);
  modal.open(artwork);
});

// --- DOM → 3D ---------------------------------------------------------------
hud.onStart(() => museum.lock());

modal.onClose(() => {
  museum.setPaused(false);
  hud.setLocked(false);   // on repasse par l'écran d'accueil : re-lock exige un geste utilisateur
});

// --- Clic sur le canvas ------------------------------------------------------
// Une seule règle, décidée une fois pour toutes :
//   souris verrouillée   → le clic vise le réticule (centre de l'écran)
//   souris libre         → le clic vise le pointeur (indispensable au tactile)
canvas.addEventListener('click', (event) => {
  if (modal.isOpen) return;

  if (museum.isLocked) {
    museum.trySelect(null);
    return;
  }

  const ndc = Picker.toNDC(event.clientX, event.clientY, canvas.getBoundingClientRect());
  // Si le clic ne touche aucune œuvre, il sert à (re)prendre le contrôle de la caméra.
  if (!museum.trySelect(ndc)) museum.lock();
});

museum.render();
