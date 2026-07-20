import {createArtCanvas} from "../utils/artCanvas.js";

/**
 * Fiche d'œuvre : la « salle de lecture » du musée.
 *
 * Ce module est 100 % DOM. Il ne sait pas qu'il existe une scène 3D — il reçoit un objet
 * de données et l'affiche. Testable sans WebGL, remplaçable sans toucher au rendu.
 */
export default class Modal {

  constructor(root) {
    this.root = root;
    this.isOpen = false;
    this.onCloseCallback = null;
    this.lastFocused = null;
    this.#build();
  }

  #build() {
    this.root.innerHTML = `
      <div class="modal" data-modal hidden>
        <div class="modal__backdrop" data-backdrop></div>
        <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button class="modal__close" data-close type="button" aria-label="Fermer la fiche">&times;</button>

          <figure class="modal__figure">
            <div class="modal__image" data-image></div>
          </figure>

          <div class="modal__content">
            <p class="modal__room" data-room></p>
            <h2 class="modal__title" id="modal-title" data-title></h2>
            <p class="modal__artist" data-artist></p>

            <dl class="modal__meta">
              <div><dt>Année</dt><dd data-year></dd></div>
              <div><dt>Technique</dt><dd data-technique></dd></div>
              <div><dt>Dimensions</dt><dd data-dimensions></dd></div>
            </dl>

            <p class="modal__description" data-description></p>

            <p class="modal__footer">Appuyez sur <kbd>Échap</kbd> ou cliquez à côté pour revenir dans la salle.</p>
          </div>
        </div>
      </div>
    `;

    this.el = this.root.querySelector('[data-modal]');
    this.image = this.root.querySelector('[data-image]');
    this.closeButton = this.root.querySelector('[data-close]');

    this.closeButton.addEventListener('click', () => this.close());
    this.root.querySelector('[data-backdrop]').addEventListener('click', () => this.close());

    // Échap ferme la fiche. On écoute au niveau du document car le focus peut être
    // n'importe où, et on n'intercepte QUE si la modale est ouverte.
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        event.stopPropagation();
        this.close();
      }
    });
  }

  /** @param {() => void} callback appelé à la fermeture (pour relancer le pointer lock) */
  onClose(callback) {
    this.onCloseCallback = callback;
  }

  /** @param {object} art une entrée de src/js/data/artworks.js */
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

    // Visuel : la vraie image si elle existe, sinon EXACTEMENT la même toile
    // procédurale que celle affichée en 3D (même fonction, même graine).
    this.image.innerHTML = '';
    if (art.image) {
      const img = document.createElement('img');
      img.src = art.image;
      img.alt = `${art.title}, ${art.artist}`;
      this.image.append(img);
    } else {
      const canvas = createArtCanvas(art, 1024);
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `${art.title}, ${art.artist}`);
      this.image.append(canvas);
    }

    this.lastFocused = document.activeElement;
    this.el.hidden = false;
    // Un frame de décalage pour que la transition CSS parte de l'état initial.
    requestAnimationFrame(() => this.el.classList.add('is-open'));
    this.isOpen = true;
    this.closeButton.focus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.el.classList.remove('is-open');

    // On attend la fin de la transition avant de retirer du flux.
    setTimeout(() => {
      this.el.hidden = true;
    }, 220);

    this.lastFocused?.focus?.();
    this.onCloseCallback?.();
  }
}
