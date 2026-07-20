import * as THREE from "three";
import Wall from "./Wall.js";

/**
 * Une salle rectangulaire : sol, plafond et 4 murs périphériques.
 *
 * Le repère est centré sur `position` :
 *   - X = largeur  (width)
 *   - Y = hauteur  (height)
 *   - Z = profondeur (depth)
 *
 * `openings` permet de retirer un mur pour créer un passage vers une autre salle.
 * Ex : new Room({ ..., openings: ['south'] })
 */
export default class Room {

  constructor({
    width = 20,
    height = 5,
    depth = 14,
    thickness = 0.4,
    position: {x = 0, y = 0, z = 0} = {},
    floorColor = 0x3a3632,
    ceilingColor = 0xf2efe9,
    wallColor = 0xe8e4dc,
    openings = [],
  } = {}) {

    this.group = new THREE.Group();
    this.group.position.set(x, y, z);

    /** @type {THREE.Mesh[]} meshs contre lesquels le joueur peut buter */
    this.colliders = [];

    const halfW = width / 2;
    const halfD = depth / 2;

    // --- Sol -----------------------------------------------------------------
    // Placé à y = -thickness/2 pour que sa face supérieure soit exactement à y = 0.
    this.#add(new Wall({
      width, height: thickness, depth,
      color: floorColor,
      roughness: 0.4,           // sol un peu brillant : ça "fait" musée
      metalness: 0.05,
      position: {x: 0, y: -thickness / 2, z: 0},
    }), false);                 // le sol n'est pas un collider horizontal, on bloque Y autrement

    // --- Plafond -------------------------------------------------------------
    this.#add(new Wall({
      width, height: thickness, depth,
      color: ceilingColor,
      position: {x: 0, y: height + thickness / 2, z: 0},
    }), false);

    // --- Murs ----------------------------------------------------------------
    // On construit chaque mur "vers l'extérieur" de la salle : sa face intérieure
    // est pile sur la limite (±halfW / ±halfD), donc les dimensions annoncées
    // correspondent à l'espace réellement praticable.
    const walls = {
      north: {width: width + thickness * 2, depth: thickness, x: 0, z: -halfD - thickness / 2},
      south: {width: width + thickness * 2, depth: thickness, x: 0, z: halfD + thickness / 2},
      west:  {width: thickness, depth, x: -halfW - thickness / 2, z: 0},
      east:  {width: thickness, depth, x: halfW + thickness / 2, z: 0},
    };

    for (const [side, cfg] of Object.entries(walls)) {
      if (openings.includes(side)) continue;
      this.#add(new Wall({
        width: cfg.width,
        height,
        depth: cfg.depth,
        color: wallColor,
        position: {x: cfg.x, y: height / 2, z: cfg.z},
      }));
    }
  }

  /**
   * Ajoute une cloison libre au centre de la salle (les deux faces accueillent des tableaux).
   * Retourne le Wall pour pouvoir lire ses dimensions ailleurs.
   */
  addPartition({width, height, thickness = 0.6, position, color = 0xe8e4dc}) {
    const wall = new Wall({
      width, height, depth: thickness, color,
      position: {...position, y: height / 2},
    });
    this.#add(wall);
    return wall;
  }

  /** Ajout interne : place le mesh dans le groupe et l'enregistre comme collider. */
  #add(wall, isCollider = true) {
    this.group.add(wall.mesh);
    if (isCollider) {
      // La Box3 doit être recalculée en coordonnées monde APRÈS l'ajout au groupe,
      // sinon elle ignore la position du groupe parent.
      wall.mesh.updateMatrixWorld(true);
      wall.box = new THREE.Box3().setFromObject(wall.mesh);
      this.colliders.push(wall.mesh);
    }
  }
}
