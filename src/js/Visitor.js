import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader }  from "three/addons/loaders/FBXLoader.js";

export default class Visitor {
  constructor(url, {
    position     = new THREE.Vector3(),
    targetHeight = 1.75,
    rotationY    = 0,
    idleClip     = null,
    walkClip     = null,
    type         = 'wanderer',   // 'watcher' → contemple les tableaux | 'wanderer' → déambule
    speed        = 0.5,          // m/s
    pauseRange   = [3, 7],       // secondes d'immobilité entre deux déplacements
  } = {}) {

    this.url          = url;
    this.targetHeight = targetHeight;
    this.idleClip     = idleClip;
    this.walkClip     = walkClip;
    this.type         = type;
    this.speed        = speed;
    this.pauseRange   = pauseRange;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = rotationY;

    this.mixer     = null;
    this.delta     = 0;
    this.isWalking = false;
    this._clips    = [];

    // --- État du comportement --------------------------------------------
    this.state              = 'paused';       // 'paused' | 'walking'
    this.pauseTimer         = this.#randomPause();
    this.target              = null;            // THREE.Vector3 — point visé
    this.lookAt              = null;            // THREE.Vector3 — point à regarder une fois arrivé
    this.currentArtworkIndex = -1;               // évite de reviser deux fois de suite le même tableau
  }

  // ───────────────────────────────────────────────
  load() {
    const ext = this.url.split('.').pop().toLowerCase();
    return ext === "fbx" ? this._loadFBX() : this._loadGLTF();
  }

  _loadGLTF() {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(this.url, (gltf) => {
        this._setupScene(gltf.scene);
        this._playAnimations(gltf.animations, gltf.scene);
        resolve(this);
      }, undefined, reject);
    });
  }

  _loadFBX() {
    return new Promise((resolve, reject) => {
      new FBXLoader().load(this.url, (fbx) => {
        this._setupScene(fbx);
        this._playAnimations(fbx.animations, fbx);
        resolve(this);
      }, undefined, reject);
    });
  }

  // ───────────────────────────────────────────────
  _setupScene(scene) {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.scale.setScalar(1);
    scene.updateMatrixWorld(true);

    const bbox = new THREE.Box3().setFromObject(scene);
    const nativeH = bbox.max.y - bbox.min.y;
    scene.scale.setScalar(this.targetHeight / nativeH);
    scene.updateMatrixWorld(true);

    const bbox2 = new THREE.Box3().setFromObject(scene);
    scene.position.y -= bbox2.min.y;

    this.group.add(scene);
  }

  _playAnimations(clips, root) {
    this._clips = clips;
    this.mixer  = new THREE.AnimationMixer(root);

    if (!clips.length) {
      console.warn(`[Visitor] Aucun clip dans ${this.url}`);
      return;
    }

    const idle = THREE.AnimationClip.findByName(clips, this.idleClip);
    if (idle) this.mixer.clipAction(idle).play();
    else console.warn(`[Visitor] Clip idle "${this.idleClip}" introuvable`);
  }

  // ───────────────────────────────────────────────
  // Déplacement bas niveau : avance vers `target`, oriente le groupe dans le sens de la marche.
  #walkTo(target, speed) {
    const pos  = this.group.position;
    const dir  = new THREE.Vector3().subVectors(target, pos);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 0.08) {
      this.isWalking = false;
      return;
    }

    dir.normalize();
    pos.addScaledVector(dir, speed * this.delta);
    this.group.rotation.y = Math.atan2(dir.x, dir.z);
    this.isWalking = true;
  }

  #faceTowards(point) {
    const dir = new THREE.Vector3().subVectors(point, this.group.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.0001) {
      this.group.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  #randomPause() {
    const [min, max] = this.pauseRange;
    return min + Math.random() * (max - min);
  }

  /** Choisit la prochaine destination selon le type de visiteur. */
  #pickNextTarget({artworks, bounds}) {
    if (this.type === 'watcher') {
      if (!artworks || artworks.length === 0) return;

      let index;
      do {
        index = Math.floor(Math.random() * artworks.length);
      } while (index === this.currentArtworkIndex && artworks.length > 1);
      this.currentArtworkIndex = index;

      const artwork  = artworks[index];
      const distance = 1.6 + Math.random() * 0.6;

      // Le tableau "regarde" vers +Z local ; on tourne cet offset par sa rotationY
      // pour trouver le point qui lui fait face, quel que soit le mur porteur.
      const offset = new THREE.Vector3(0, 0, distance)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), artwork.data.rotationY ?? 0);

      this.target = artwork.group.position.clone().add(offset);
      this.target.y = 0;
      this.lookAt  = artwork.group.position.clone();
    } else {
      if (!bounds) return;
      this.target = new THREE.Vector3(
        THREE.MathUtils.randFloat(bounds.minX, bounds.maxX),
        0,
        THREE.MathUtils.randFloat(bounds.minZ, bounds.maxZ),
      );
      this.lookAt = null;
    }

    this.state = 'walking';
  }

  /**
   * Comportement piloté par Museum à chaque frame.
   * @param {{artworks: import('./Artwork.js').default[], bounds: {minX:number,maxX:number,minZ:number,maxZ:number}}} context
   */
  behave(context) {
    if (this.state === 'paused') {
      this.pauseTimer -= this.delta;
      if (this.pauseTimer <= 0) this.#pickNextTarget(context);
      return;
    }

    this.#walkTo(this.target, this.speed);

    if (!this.isWalking) {
      if (this.lookAt) this.#faceTowards(this.lookAt);
      this.state = 'paused';
      this.pauseTimer = this.#randomPause();
    }
  }

  // ───────────────────────────────────────────────
  update(delta, context) {
    this.delta = delta;
    this.behave(context);

    if (!this.mixer) return;
    this.mixer.update(delta);

    const idle = THREE.AnimationClip.findByName(this._clips, this.idleClip);
    const walk = THREE.AnimationClip.findByName(this._clips, this.walkClip);
    if (!idle || !walk) return;

    const idleAction = this.mixer.clipAction(idle);
    const walkAction = this.mixer.clipAction(walk);

    if (this.isWalking) {
      idleAction.stop();
      walkAction.play();
    } else {
      walkAction.stop();
      idleAction.play();
    }
  }
}