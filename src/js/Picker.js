import * as THREE from "three";

const MAX_DISTANCE = 9;   // au-delà, on ne propose pas l'interaction (en mètres)

/**
 * Sélection d'objets 3D par lancer de rayon.
 *
 * Principe : on tire un rayon depuis la caméra à travers un point de l'écran exprimé
 * en coordonnées NDC (Normalized Device Coordinates : -1 → +1 sur chaque axe,
 * (0,0) = centre de l'écran) et on regarde ce qu'il traverse.
 *
 * Deux modes :
 *  - pointer lock actif → la souris est invisible et immobile, le rayon part du centre (0,0),
 *    c'est-à-dire du réticule ;
 *  - pointer lock inactif (tactile, ou mode "clic direct") → le rayon part de la position
 *    du pointeur, convertie en NDC.
 */
export default class Picker {

  /**
   * @param {THREE.Camera} camera
   * @param {THREE.Object3D[]} targets UNIQUEMENT les objets cliquables.
   *   Ne jamais passer la scène entière : le coût du raycast est proportionnel
   *   au nombre de triangles testés.
   */
  constructor(camera, targets) {
    this.camera = camera;
    this.targets = targets;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = MAX_DISTANCE;
    this.center = new THREE.Vector2(0, 0);
    this.pointer = new THREE.Vector2();
  }

  /**
   * @param {{x: number, y: number}|null} ndc coordonnées NDC, ou null pour viser le centre
   * @returns {THREE.Object3D|null} le premier objet touché
   */
  pick(ndc = null) {
    const coords = ndc ? this.pointer.set(ndc.x, ndc.y) : this.center;
    this.raycaster.setFromCamera(coords, this.camera);
    // `false` = pas de récursion dans les enfants : nos cibles sont déjà les meshs exacts.
    const hits = this.raycaster.intersectObjects(this.targets, false);
    return hits.length > 0 ? hits[0].object : null;
  }

  /** Convertit des coordonnées écran (px) en NDC. */
  static toNDC(clientX, clientY, rect) {
    return {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1,
    };
  }
}
