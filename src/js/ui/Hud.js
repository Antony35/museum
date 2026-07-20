/**
 * Interface superposée au canvas : réticule, info-bulle, aide clavier, compteur FPS,
 * et l'écran d'accueil qui déclenche le pointer lock.
 *
 * Couche DOM pure : ce fichier n'importe PAS three. Il ne connaît que des données
 * simples (un titre, un nombre de FPS) transmises par main.js.
 */
export default class Hud {

  constructor(root) {
    this.root = root;
    this.#build();
  }

  #build() {
    this.root.innerHTML = `
      <div class="hud" aria-hidden="true">
        <div class="hud__crosshair" data-crosshair></div>
        <div class="hud__tooltip" data-tooltip hidden></div>
        <div class="hud__stats" data-stats></div>
        <div class="hud__help">
          <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> se déplacer
          <span>·</span> <kbd>Maj</kbd> courir
          <span>·</span> <kbd>Clic</kbd> examiner
          <span>·</span> <kbd>Échap</kbd> libérer la souris
        </div>
      </div>

      <div class="intro" data-intro>
        <div class="intro__panel">
          <p class="intro__eyebrow">Exposition permanente</p>
          <h1 class="intro__title">Musée<br><span>Couleur &amp; Silence</span></h1>
          <p class="intro__text">
            Quatorze œuvres de quatre peintres, réparties sur trois cimaises.
            Déplacez-vous librement, approchez-vous, et cliquez sur une toile
            pour ouvrir sa fiche.
          </p>
          <button class="intro__button" data-start type="button">Entrer dans le musée</button>
          <p class="intro__hint">
            <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> ou les flèches ·
            souris pour regarder · <kbd>Échap</kbd> pour sortir
          </p>
        </div>
      </div>
    `;

    this.crosshair = this.root.querySelector('[data-crosshair]');
    this.tooltip = this.root.querySelector('[data-tooltip]');
    this.stats = this.root.querySelector('[data-stats]');
    this.intro = this.root.querySelector('[data-intro]');
    this.startButton = this.root.querySelector('[data-start]');
  }

  /** @param {() => void} callback appelé au clic sur « Entrer » */
  onStart(callback) {
    this.startButton.addEventListener('click', callback);
  }

  /** Affiche ou masque l'écran d'accueil selon l'état du pointer lock. */
  setLocked(locked) {
    this.intro.classList.toggle('is-hidden', locked);
    this.crosshair.classList.toggle('is-active', locked);
    if (!locked) this.setTooltip(null);
  }

  /** @param {{title: string, artist: string}|null} artwork */
  setTooltip(artwork) {
    if (!artwork) {
      this.tooltip.hidden = true;
      this.crosshair.classList.remove('is-targeting');
      return;
    }
    this.tooltip.innerHTML = `
      <strong>${artwork.title}</strong>
      <span>${artwork.artist}, ${artwork.year}</span>
      <em>Cliquez pour examiner</em>
    `;
    this.tooltip.hidden = false;
    this.crosshair.classList.add('is-targeting');
  }

  /** @param {{fps: number, calls: number, triangles: number}} stats */
  setStats({fps, calls, triangles}) {
    this.stats.textContent = `${fps} FPS · ${calls} draw calls · ${triangles.toLocaleString('fr-FR')} triangles`;
    this.stats.dataset.level = fps >= 55 ? 'good' : fps >= 30 ? 'warn' : 'bad';
  }
}
