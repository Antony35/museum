import * as THREE from "three";
import {createArtCanvas} from "./utils/artCanvas.js";

// Géométries et matériaux partagés entre TOUS les tableaux.
// C'est l'optimisation la plus rentable ici : 14 tableaux = 1 seule géométrie de plan
// en mémoire GPU au lieu de 14. La taille est ajustée ensuite via mesh.scale.
const PLANE = new THREE.PlaneGeometry(1, 1);
const FRAME_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const FRAME_MATERIAL = new THREE.MeshStandardMaterial({color: 0x2b2620, roughness: 0.55, metalness: 0.25});
const MAT_MATERIAL = new THREE.MeshStandardMaterial({color: 0xf6f3ec, roughness: 0.95});

const FRAME_BORDER = 0.09;   // largeur du cadre, en mètres
const MAT_BORDER = 0.05;     // marie-louise (le passe-partout blanc)
const DEPTH = 0.07;          // épaisseur du cadre

/**
 * Un tableau accroché au mur : cadre + passe-partout + toile.
 *
 * Le groupe est orienté "face vers +Z" ; c'est `rotationY` dans les données
 * qui décide contre quel mur il se plaque.
 */
export default class Artwork {

  /** @param {object} data une entrée de src/js/data/artworks.js */
  constructor(data) {
    this.data = data;

    const {width: w, height: h} = data;

    this.group = new THREE.Group();
    this.group.position.set(data.position.x, data.position.y, data.position.z);
    this.group.rotation.y = data.rotationY ?? 0;

    // --- Cadre (boîte pleine, la toile viendra se poser devant) ---------------
    const frame = new THREE.Mesh(FRAME_GEOMETRY, FRAME_MATERIAL);
    frame.scale.set(w + FRAME_BORDER * 2, h + FRAME_BORDER * 2, DEPTH);
    frame.position.z = DEPTH / 2;
    frame.castShadow = true;
    this.group.add(frame);

    // --- Passe-partout --------------------------------------------------------
    const mat = new THREE.Mesh(PLANE, MAT_MATERIAL);
    mat.scale.set(w + MAT_BORDER * 2, h + MAT_BORDER * 2, 1);
    mat.position.z = DEPTH + 0.001;
    this.group.add(mat);

    // --- La toile -------------------------------------------------------------
    this.texture = this.#createTexture(data);
    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.85,
      // On rajoute la texture en émissif : les tableaux restent lisibles même
      // dans les zones sombres, sans avoir à mettre un spot par œuvre.
      emissive: 0xffffff,
      emissiveMap: this.texture,
      emissiveIntensity: 0.28,
    });

    this.mesh = new THREE.Mesh(PLANE, this.material);
    this.mesh.scale.set(w, h, 1);
    this.mesh.position.z = DEPTH + 0.002;
    // C'est CE mesh que le Raycaster teste. On y accroche l'id : pas de variable globale.
    this.mesh.userData.artworkId = data.id;
    this.group.add(this.mesh);

    // --- Cartel (petite plaque sous le tableau) -------------------------------
    const label = new THREE.Mesh(PLANE, new THREE.MeshStandardMaterial({
      map: this.#createLabelTexture(data),
      transparent: true,
    }));
    label.scale.set(0.34, 0.13, 1);
    label.position.set(-(w / 2) + 0.17, -(h / 2) - 0.18, DEPTH + 0.002);
    this.group.add(label);
  }

  /** Texture de la toile : vraie image si fournie, sinon toile générée. */
  #createTexture(data) {
    const canvas = createArtCanvas(data, 768);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;   // net même quand on regarde le tableau de biais

    if (data.image) {
      // Chargement asynchrone : la toile procédurale sert d'affichage provisoire,
      // et la vraie image la remplace dès qu'elle arrive. Si elle échoue, on garde la toile.
      new THREE.TextureLoader().load(
        data.image,
        (loaded) => {
          loaded.colorSpace = THREE.SRGBColorSpace;
          loaded.anisotropy = 8;
          this.material.map = loaded;
          this.material.emissiveMap = loaded;
          this.material.needsUpdate = true;
          texture.dispose();
        },
        undefined,
        () => console.warn(`[Artwork] image introuvable : ${data.image} — toile procédurale conservée`),
      );
    }

    return texture;
  }

  /** Le cartel mural : titre / auteur / année, dessiné dans un canvas 2D. */
  #createLabelTexture(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#faf8f4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText(data.title, 22, 58, canvas.width - 44);

    ctx.fillStyle = '#4a4a4a';
    ctx.font = 'italic 28px Georgia, serif';
    ctx.fillText(data.artist, 22, 104, canvas.width - 44);

    ctx.fillStyle = '#7a7a7a';
    ctx.font = '26px Georgia, serif';
    ctx.fillText(`${data.year} — ${data.technique}`, 22, 148, canvas.width - 44);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /** Surbrillance quand le réticule vise l'œuvre. */
  setHighlighted(on) {
    this.material.emissiveIntensity = on ? 0.62 : 0.28;
  }
}
