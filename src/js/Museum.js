import * as THREE from 'three';
import resizeRendererToDisplaySize from "../utils/resizeRenderToDisplaySize.js";
import Room from "./Room.js";
import Artwork from "./Artwork.js";
import Picker from "./Picker.js";
import PlayerControls from "./controls/PlayerControls.js";
import {artworks} from "./data/artworks.js";

const ROOM = {width: 20, height: 5, depth: 14};
const INSPECTION_SCREEN_X = -0.38; // centre de l'œuvre dans la moitié gauche
const MAX_HALF_SCREEN_WIDTH = 0.48;
const MAX_HALF_SCREEN_HEIGHT = 0.58;
const FRAMING_MARGIN = 1.12; // inclut le cadre et un peu de mur

/**
 * La couche 3D, et rien d'autre.
 *
 * Cette classe ne fait AUCUN querySelector, ne crée AUCun élément HTML : elle reçoit
 * un canvas et communique avec l'interface uniquement par callbacks (`on(...)`).
 * C'est ce découplage qui permet de remplacer toute l'UI sans toucher à la 3D.
 */
export default class Museum {

  constructor(canvas) {
    // --- Renderer -------------------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping : compresse les hautes lumières, indispensable dès qu'on éclaire "fort".
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

    // --- Interaction ----------------------------------------------------------
    // Les matrices monde doivent être à jour AVANT de calculer les boîtes de collision,
    // sinon les Box3 des murs sont calculées à partir de positions locales périmées.
    this.scene.updateMatrixWorld(true);

    this.controls = new PlayerControls(this.camera, canvas, this.room.colliders);
    this.picker = new Picker(this.camera, this.artworks.map((a) => a.mesh));

    /** Callbacks vers l'UI. Aucun accès direct au DOM depuis ici. */
    this.listeners = {hover: [], select: [], lock: [], stats: []};
    this.controls.onLockChange((locked) => this.#emit('lock', locked));

    this.hovered = null;
    this.cameraAnimation = null;
    this.visitView = null;
    this.clock = new THREE.Clock();

    // --- Compteur de FPS ------------------------------------------------------
    this.frames = 0;
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

    // Cimaise centrale : double la surface d'accrochage et oblige à contourner,
    // ce qui donne un vrai parcours au lieu d'une pièce vide.
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
    // Lumière d'ambiance froide très douce : rien ne doit être totalement noir.
    this.scene.add(new THREE.HemisphereLight(0xdfe6f0, 0x2a2622, 0.55));

    // Une directionnelle zénithale pour ancrer les ombres au sol.
    const key = new THREE.DirectionalLight(0xfff4e2, 1.1);
    key.position.set(4, ROOM.height + 3, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    this.scene.add(key);

    // Rampe de spots au plafond : c'est ce qui donne l'atmosphère "galerie".
    // 6 sources seulement — chaque lumière dynamique coûte cher au fragment shader.
    const spotPositions = [
      {x: -7, z: -5}, {x: 0, z: -5}, {x: 7, z: -5},
      {x: -7, z: 5}, {x: 0, z: 5}, {x: 7, z: 5},
    ];

    const fixtureGeometry = new THREE.BoxGeometry(1.6, 0.08, 0.16);
    const fixtureMaterial = new THREE.MeshBasicMaterial({color: 0xfff3dd});

    for (const {x, z} of spotPositions) {
      const light = new THREE.PointLight(0xffe9c8, 14, 13, 2);
      light.position.set(x, ROOM.height - 0.5, z);
      this.scene.add(light);

      // Le luminaire visible (MeshBasicMaterial = ignore l'éclairage, donc toujours "allumé").
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

    // Index mesh → Artwork, pour retrouver l'objet métier depuis un résultat de raycast.
    this.artworkByMesh = new Map(this.artworks.map((a) => [a.mesh, a]));
  }

  // ==========================================================================
  // API publique (utilisée par main.js pour câbler l'UI)
  // ==========================================================================

  /** @param {'hover'|'select'|'lock'|'stats'} event */
  on(event, callback) {
    this.listeners[event].push(callback);
    return this;
  }

  #emit(event, payload) {
    for (const callback of this.listeners[event]) callback(payload);
  }

  lock() {
    this.controls.lock();
  }

  unlock() {
    this.controls.unlock();
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  /** Active/désactive le déplacement pendant l'inspection d'une œuvre. */
  setPaused(paused) {
    this.controls.enabled = !paused;
    if (paused) this.controls.velocity.set(0, 0, 0);
  }

  /**
   * Anime la caméra vers une vue frontale de l'œuvre, cadrée à gauche.
   * @param {object} art une entrée de src/js/data/artworks.js
   * @param {number} duration durée du travelling en millisecondes
   */
  focusArtwork(art, duration = 900) {
    this.visitView = {
      position: this.camera.position.clone(),
      quaternion: this.camera.quaternion.clone(),
    };

    const rotation = art.rotationY ?? 0;
    const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, rotation);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, rotation);
    const center = new THREE.Vector3(art.position.x, art.position.y, art.position.z);

    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const distanceByHeight = (art.height * FRAMING_MARGIN / 2)
      / (Math.tan(halfFov) * MAX_HALF_SCREEN_HEIGHT);
    const distanceByWidth = (art.width * FRAMING_MARGIN / 2)
      / (Math.tan(halfFov) * this.camera.aspect * MAX_HALF_SCREEN_WIDTH);
    const distance = Math.max(distanceByHeight, distanceByWidth);
    const horizontalOffset = -INSPECTION_SCREEN_X * distance * Math.tan(halfFov) * this.camera.aspect;
    const position = center.clone()
      .addScaledVector(normal, distance)
      .addScaledVector(right, horizontalOffset);

    const matrix = new THREE.Matrix4().lookAt(
      position,
      position.clone().sub(normal),
      THREE.Object3D.DEFAULT_UP,
    );
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

    return this.#animateCamera(position, quaternion, duration);
  }

  /** Replace la caméra là où le visiteur se trouvait avant l'inspection. */
  restoreVisitView(duration = 750) {
    if (!this.visitView) return Promise.resolve();

    const {position, quaternion} = this.visitView;
    this.visitView = null;
    return this.#animateCamera(position, quaternion, duration);
  }

  #animateCamera(position, quaternion, duration) {
    if (duration === 0) {
      this.camera.position.copy(position);
      this.camera.quaternion.copy(quaternion);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.cameraAnimation = {
        fromPosition: this.camera.position.clone(),
        fromQuaternion: this.camera.quaternion.clone(),
        toPosition: position,
        toQuaternion: quaternion,
        elapsed: 0,
        duration: duration / 1000,
        resolve,
      };
    });
  }

  /**
   * Tente une sélection.
   * @param {{x: number, y: number}|null} ndc null = viser le centre du réticule
   * @returns {boolean} true si une œuvre a été sélectionnée
   */
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
    // getDelta() renvoie le temps écoulé depuis l'appel précédent. Toute la logique
    // de déplacement passe par lui : le musée se parcourt à la même vitesse partout.
    const delta = Math.min(this.clock.getDelta(), 0.1);   // clamp : évite le saut après un onglet inactif

    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }

    this.controls.update(delta);
    this.#updateCameraAnimation(delta);
    this.#updateHover();
    this.#updateStats(delta);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }

  #updateCameraAnimation(delta) {
    if (!this.cameraAnimation) return;

    const animation = this.cameraAnimation;
    animation.elapsed += delta;
    const progress = Math.min(animation.elapsed / animation.duration, 1);
    const eased = progress < 0.5
      ? 4 * progress ** 3
      : 1 - ((-2 * progress + 2) ** 3) / 2;

    this.camera.position.lerpVectors(animation.fromPosition, animation.toPosition, eased);
    this.camera.quaternion.slerpQuaternions(
      animation.fromQuaternion,
      animation.toQuaternion,
      eased,
    );

    if (progress === 1) {
      this.cameraAnimation = null;
      animation.resolve();
    }
  }

  /** Surbrillance + info-bulle de l'œuvre visée. 14 objets testés : négligeable. */
  #updateHover() {
    const mesh = this.controls.isLocked ? this.picker.pick() : null;
    const artwork = mesh ? this.artworkByMesh.get(mesh) : null;

    if (artwork === this.hovered) return;   // rien n'a changé : on ne touche à rien

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
        fps: Math.round(this.frames / this.fpsTimer),
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
      });
      this.frames = 0;
      this.fpsTimer = 0;
    }
  }
}
