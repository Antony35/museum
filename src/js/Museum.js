import * as THREE from 'three';
import resizeRendererToDisplaySize from "../utils/resizeRenderToDisplaySize.js";
import Room from "./Room.js";
import Artwork from "./Artwork.js";
import Picker from "./Picker.js";
import PlayerControls from "./controls/PlayerControls.js";
import Visitor from "./Visitor.js";
import {artworks} from "./data/artworks.js";

const ROOM = {width: 20, height: 5, depth: 14};

/**
 * La couche 3D, et rien d'autre.
 */
export default class Museum {

  constructor(canvas) {
    // --- Renderer -------------------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // --- Scène ----------------------------------------------------------------
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d10);

    this.camera = new THREE.PerspectiveCamera(70, 2, 0.1, 120);
    this.camera.position.set(0, 1.65, 5.5);

    this.#buildRoom();
    this.#buildLights();
    this.#buildArtworks();
    this.#buildVisitors();

    // --- Interaction ----------------------------------------------------------
    this.scene.updateMatrixWorld(true);

    this.controls = new PlayerControls(this.camera, canvas, this.room.colliders);
    this.picker   = new Picker(this.camera, this.artworks.map((a) => a.mesh));

    this.listeners = {hover: [], select: [], lock: [], stats: []};
    this.controls.onLockChange((locked) => this.#emit('lock', locked));

    this.hovered = null;
    this.clock   = new THREE.Clock();

    this.frames   = 0;
    this.fpsTimer = 0;

    this.render = this.render.bind(this);
  }

  // ==========================================================================
  // Construction de la scène
  // ==========================================================================

  #buildRoom() {
    this.room = new Room({
      ...ROOM,
      floorColor: 0x2e2b28,
      wallColor: 0xe6e1d8,
      ceilingColor: 0xf4f2ec,
    });

    this.room.addPartition({
      width: 10,
      height: ROOM.height,
      thickness: 0.7,
      position: {x: 0, z: 0},
      color: 0xe6e1d8,
    });

    this.scene.add(this.room.group);
  }

  #buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xdfe6f0, 0x2a2622, 0.55));

    const key = new THREE.DirectionalLight(0xfff4e2, 1.1);
    key.position.set(4, ROOM.height + 3, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left   = -14;
    key.shadow.camera.right  = 14;
    key.shadow.camera.top    = 12;
    key.shadow.camera.bottom = -12;
    this.scene.add(key);

    const spotPositions = [
      {x: -7, z: -5}, {x: 0, z: -5}, {x: 7, z: -5},
      {x: -7, z: 5},  {x: 0, z: 5},  {x: 7, z: 5},
    ];

    const fixtureGeometry = new THREE.BoxGeometry(1.6, 0.08, 0.16);
    const fixtureMaterial = new THREE.MeshBasicMaterial({color: 0xfff3dd});

    for (const {x, z} of spotPositions) {
      const light = new THREE.PointLight(0xffe9c8, 14, 13, 2);
      light.position.set(x, ROOM.height - 0.5, z);
      this.scene.add(light);

      const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
      fixture.position.set(x, ROOM.height - 0.12, z);
      this.scene.add(fixture);
    }
  }

  #buildArtworks() {
    this.artworks = artworks.map((data) => {
      const artwork = new Artwork(data);
      this.scene.add(artwork.group);
      return artwork;
    });

    this.artworkByMesh = new Map(this.artworks.map((a) => [a.mesh, a]));
  }

  #buildVisitors() {
    const H = 1.75;

    // Trois visiteurs (KayKit-style, squelette "CharacterArmature") :
    //  - 'watcher'  : marche jusqu'à un tableau au hasard, s'arrête, se tourne pour le regarder
    //  - 'wanderer' : déambule librement dans les bornes de la salle
    const visitorData = [
      {url: 'models/visitor1.glb', position: {x: -3, y: 0, z: -2}, rotationY: Math.PI / 2,
       type: 'watcher',  speed: 0.9, pauseRange: [4, 9]},

      {url: 'models/Visitor2.glb', position: {x: 4, y: 0, z: -1}, rotationY: Math.PI,
       type: 'wanderer', speed: 0.5, pauseRange: [2, 5]},

      {url: 'models/visitor3.glb', position: {x: 2, y: 0, z: 3}, rotationY: -Math.PI / 2,
       type: 'watcher',  speed: 0.9, pauseRange: [4, 9]},
    ];

    this.visitors = visitorData.map((data) => {
      const visitor = new Visitor(data.url, {
        position:     new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        targetHeight: H,
        rotationY:    data.rotationY,
        idleClip:     'CharacterArmature|Idle',
        walkClip:     'CharacterArmature|Walk',
        type:         data.type,
        speed:        data.speed,
        pauseRange:   data.pauseRange,
      });
      this.scene.add(visitor.group);
      visitor.load().catch((error) => {
        console.warn(`[Museum] échec chargement visiteur ${data.url}`, error);
      });
      return visitor;
    });
  }

  // ==========================================================================
  // API publique
  // ==========================================================================

  on(event, callback) {
    this.listeners[event].push(callback);
    return this;
  }

  #emit(event, payload) {
    for (const callback of this.listeners[event]) callback(payload);
  }

  lock()   { this.controls.lock(); }
  unlock() { this.controls.unlock(); }

  get isLocked() {
    return this.controls.isLocked;
  }

  setPaused(paused) {
    this.controls.enabled = !paused;
  }

  trySelect(ndc = null) {
    const mesh = this.picker.pick(ndc);
    if (!mesh) return false;
    this.#emit('select', this.artworkByMesh.get(mesh).data);
    return true;
  }

  // ==========================================================================
  // Boucle de rendu
  // ==========================================================================

  render() {
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }

    this.controls.update(delta);

    // Bornes de déambulation pour les wanderers
    const bounds = {
      minX: -ROOM.width / 2 + 1.2,
      maxX:  ROOM.width / 2 - 1.2,
      minZ: -ROOM.depth / 2 + 1.2,
      maxZ:  ROOM.depth / 2 - 1.2,
    };

    // Les visiteurs gèrent eux-mêmes leur comportement (watcher / wanderer)
    this.visitors.forEach((visitor) =>
      visitor.update(delta, {artworks: this.artworks, bounds})
    );

    this.#updateHover();
    this.#updateStats(delta);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }

  #updateHover() {
    const mesh    = this.controls.isLocked ? this.picker.pick() : null;
    const artwork = mesh ? this.artworkByMesh.get(mesh) : null;

    if (artwork === this.hovered) return;

    this.hovered?.setHighlighted(false);
    artwork?.setHighlighted(true);
    this.hovered = artwork;
    this.#emit('hover', artwork ? artwork.data : null);
  }

  #updateStats(delta) {
    this.frames++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.#emit('stats', {
        fps:       Math.round(this.frames / this.fpsTimer),
        calls:     this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
      });
      this.frames   = 0;
      this.fpsTimer = 0;
    }
  }
}