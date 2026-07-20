import * as THREE from "three";
import {PointerLockControls} from "three/addons/controls/PointerLockControls.js";

const EYE_HEIGHT = 1.65;        // hauteur des yeux, en mètres
const WALK_SPEED = 3.4;         // m/s
const RUN_SPEED = 6.0;          // m/s (Shift)
const ACCELERATION = 12;        // lissage : plus haut = démarrage plus sec
const PLAYER_RADIUS = 0.35;     // demi-largeur du joueur, pour les collisions

/**
 * Déplacement à la première personne : souris pour regarder, ZQSD/WASD pour marcher.
 *
 * Note sur la séparation DOM/3D : ce module écoute le clavier sur `document`.
 * C'est inévitable — en pointer lock, le navigateur envoie les événements clavier
 * au document, pas au canvas. C'est la seule entorse assumée à la règle.
 */
export default class PlayerControls {

  /**
   * @param {THREE.Camera} camera
   * @param {HTMLElement} domElement le canvas
   * @param {THREE.Object3D[]} colliders meshs bloquant le déplacement
   */
  constructor(camera, domElement, colliders = []) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    this.camera.position.y = EYE_HEIGHT;

    // Une Box3 par collider, calculée UNE fois : les murs ne bougent pas,
    // donc recalculer à chaque frame serait du gaspillage pur.
    this.colliderBoxes = colliders.map((mesh) => {
      mesh.updateMatrixWorld(true);
      return new THREE.Box3().setFromObject(mesh);
    });

    /** Touches physiquement enfoncées. On stocke `event.code` : indépendant de la
     *  disposition du clavier, donc AZERTY et QWERTY marchent sans configuration. */
    this.keys = new Set();

    this.velocity = new THREE.Vector3();
    this.playerBox = new THREE.Box3();
    this.boxSize = new THREE.Vector3(PLAYER_RADIUS * 2, 1.7, PLAYER_RADIUS * 2);

    this.enabled = true;

    this.#bindEvents();
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  lock() {
    this.controls.lock();
  }

  unlock() {
    this.controls.unlock();
  }

  /** @param {(locked: boolean) => void} callback */
  onLockChange(callback) {
    this.controls.addEventListener('lock', () => callback(true));
    this.controls.addEventListener('unlock', () => callback(false));
  }

  #bindEvents() {
    this._onKeyDown = (event) => {
      this.keys.add(event.code);
      // Empêche la page de défiler quand on utilise les flèches ou l'espace.
      if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();
    };
    this._onKeyUp = (event) => this.keys.delete(event.code);
    // Si l'onglet perd le focus, on relâche tout : sinon le joueur part en marche avant infinie.
    this._onBlur = () => this.keys.clear();

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
  }

  /** Direction voulue en repère local : x = latéral, z = avant/arrière. */
  #inputDirection() {
    const k = this.keys;
    const forward = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    // Sur AZERTY, la touche physique 'A' est le 'Q' — event.code vaut quand même 'KeyA'.
    const right = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    return {forward, right};
  }

  /** Le joueur entre-t-il en collision avec un mur, à sa position actuelle ? */
  #collides() {
    this.playerBox.setFromCenterAndSize(this.camera.position, this.boxSize);
    return this.colliderBoxes.some((box) => box.intersectsBox(this.playerBox));
  }

  /**
   * @param {number} delta secondes écoulées depuis la frame précédente
   *
   * La vitesse est multipliée par `delta` : le déplacement est donc identique
   * à 30 comme à 144 FPS. C'est LE réflexe à avoir dans toute boucle de rendu.
   */
  update(delta) {
    if (!this.enabled || !this.controls.isLocked) return;

    const {forward, right} = this.#inputDirection();
    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;

    // Interpolation exponentielle vers la vitesse cible : démarrages et arrêts amortis.
    const damping = 1 - Math.exp(-ACCELERATION * delta);
    this.velocity.z += (forward * speed - this.velocity.z) * damping;
    this.velocity.x += (right * speed - this.velocity.x) * damping;

    // Déplacement axe par axe, avec annulation en cas de collision.
    // Traiter les axes séparément permet de GLISSER le long d'un mur au lieu
    // de rester bloqué net quand on l'aborde en diagonale.
    const previousZ = this.camera.position.clone();
    this.controls.moveForward(this.velocity.z * delta);
    if (this.#collides()) {
      this.camera.position.copy(previousZ);
      this.velocity.z = 0;
    }

    const previousX = this.camera.position.clone();
    this.controls.moveRight(this.velocity.x * delta);
    if (this.#collides()) {
      this.camera.position.copy(previousX);
      this.velocity.x = 0;
    }

    // Pas de vol, pas de chute : on est à pied dans un musée.
    this.camera.position.y = EYE_HEIGHT;
  }

  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    this.controls.dispose();
  }
}
