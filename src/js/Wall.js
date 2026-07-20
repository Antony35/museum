import * as THREE from "three";

export default class Wall {

  constructor({height, width, depth = 20, color, position: {x, y, z}, rotX = 0}) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({color: color});

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.x = rotX;
  }
}