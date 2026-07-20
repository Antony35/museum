import * as THREE from "three";

/**
 * Un pan de mur (ou de sol / plafond).
 *
 * On garde une BoxGeometry plutôt qu'un PlaneGeometry pour deux raisons :
 *  - un mur a une épaisseur, donc on ne voit jamais une "feuille de papier" sur la tranche ;
 *  - la Box donne une Box3 (boîte englobante) exacte, dont on se sert pour les collisions.
 */
export default class Wall {

  constructor({
    width,
    height,
    depth,
    color = 0xe8e4dc,
    position: {x = 0, y = 0, z = 0} = {},
    rotationY = 0,
    roughness = 0.95,
    metalness = 0,
  }) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    // MeshStandardMaterial = PBR : réagit correctement aux lumières et au tone mapping.
    const material = new THREE.MeshStandardMaterial({color, roughness, metalness});

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = rotationY;

    // Les murs reçoivent les ombres mais n'en projettent pas (gain de perf).
    this.mesh.receiveShadow = true;

    // Boîte englobante en coordonnées monde : utilisée par PlayerControls pour les collisions.
    this.mesh.updateMatrixWorld(true);
    this.box = new THREE.Box3().setFromObject(this.mesh);
  }
}
