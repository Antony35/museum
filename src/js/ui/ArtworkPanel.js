/**
 * Panneau d’informations affiché pendant l’inspection d’une œuvre.
 *
 * Ce module reste 100 % DOM : la scène 3D lui transmet uniquement les données
 * de l’œuvre et décide quand afficher ou masquer le panneau.
 */
export default class ArtworkPanel {

  constructor(root) {
    this.root = root;
    this.isOpen = false;
    this.onCloseCallback = null;
    this.#build();
  }

  #build() {
    this.root.innerHTML = `
      <aside class="artwork-panel" data-panel hidden aria-labelledby="artwork-panel-title">
        <button class="artwork-panel__close" data-close type="button" aria-label="Fermer les informations">&times;</button>

        <p class="artwork-panel__room" data-room></p>
        <h2 class="artwork-panel__title" id="artwork-panel-title" data-title></h2>
        <p class="artwork-panel__artist" data-artist></p>

        <dl class="artwork-panel__meta">
          <div><dt>Année</dt><dd data-year></dd></div>
          <div><dt>Technique</dt><dd data-technique></dd></div>
          <div><dt>Dimensions</dt><dd data-dimensions></dd></div>
        </dl>

        <p class="artwork-panel__description" data-description></p>
        <p class="artwork-panel__footer">Appuyez sur <kbd>Échap</kbd> pour revenir dans la salle.</p>
      </aside>
    `;

    this.el = this.root.querySelector('[data-panel]');
    this.closeButton = this.root.querySelector('[data-close]');

    this.closeButton.addEventListener('click', () => this.onCloseCallback?.());
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        event.stopPropagation();
        this.onCloseCallback?.();
      }
    });
  }

  onClose(callback) {
    this.onCloseCallback = callback;
  }

  /** Affiche les informations une fois le travelling terminé. */
  open(art) {
    const q = (selector) => this.root.querySelector(selector);

    q('[data-room]').textContent = art.room ?? '';
    q('[data-title]').textContent = art.title;
    q('[data-artist]').textContent = art.artist;
    q('[data-year]').textContent = art.year;
    q('[data-technique]').textContent = art.technique;
    q('[data-dimensions]').textContent =
      `${Math.round(art.height * 100)} × ${Math.round(art.width * 100)} cm`;
    q('[data-description]').textContent = art.description;

    this.el.hidden = false;
    this.isOpen = true;
    requestAnimationFrame(() => {
      this.el.classList.add('is-open');
      this.closeButton.focus();
    });
  }

  /** Masque le panneau avant le travelling de retour. */
  close() {
    if (!this.isOpen) return Promise.resolve();

    this.isOpen = false;
    this.el.classList.remove('is-open');

    return new Promise((resolve) => {
      this.el.addEventListener('transitionend', () => {
        this.el.hidden = true;
        resolve();
      }, {once: true});
    });
  }
}
