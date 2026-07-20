import * as THREE from 'three';
import resizeRendererToDisplaySize from "../utils/resizeRenderToDisplaySize.js";
import Wall from "./Wall.js";

export default class Museum {

  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    this.camera = new THREE.PerspectiveCamera(75, 2,  0.1, 100);
    this.camera.position.z = 4;
    this.scene = new THREE.Scene();
    this.light = new THREE.DirectionalLight( 0xffffff, 3);
    this.light.position.set(-1, 2, 4);
    this.scene.add(this.light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    this.light.position.set(0, 2, 0);
    this.camera.position.set(0, 0, 8);
    this.room = [
      // Sol : Large (width: 4), plat (height: 0.1), placé en bas (y: -2)
      new Wall({width: 4, height: 0.1, color: 0xcccccc, position: {x: 0, y: -2, z: 0}}).mesh,
      // Plafond : Large (width: 4), plat (height: 0.1), placé en haut (y: 2)
      new Wall({width: 4, height: 0.1, color: 0xcccccc, position: {x: 0, y: 2, z: 0}}).mesh,
      // Mur Gauche : Fin (width: 0.1), haut (height: 4.1), décalé à gauche (x: -2)
      new Wall({width: 0.1, height: 4.1, color: 0x44aa88, position: {x: -2, y: 0, z: 0}}).mesh,
      // Mur Droit : Fin (width: 0.1), haut (height: 4.1), décalé à droite (x: 2)
      new Wall({width: 0.1, height: 4.1, color: 0x44aa88, position: {x: 2, y: 0, z: 0}}).mesh,
    ]
    this.room.forEach((room) => {

      this.scene.add(room);
    })

    this.render = this.render.bind(this);
  }

  render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}


