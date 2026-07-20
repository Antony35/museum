/**
 * Générateur d'œuvres procédurales.
 *
 * Objectif : le musée est visitable et joli SANS aucun fichier image.
 * Dès que tu déposes une vraie image dans `public/artworks/`, il suffit de renseigner
 * `image: 'artworks/mon-tableau.jpg'` dans src/js/data/artworks.js et elle prend le dessus.
 *
 * La fonction est PURE et déterministe : le même `art` produit toujours la même toile.
 * C'est ce qui permet à la couche 3D (CanvasTexture) et à la couche DOM (la modale)
 * d'afficher exactement la même image sans se partager d'état.
 */

/** Générateur pseudo-aléatoire déterministe (mulberry32) : même graine → même suite. */
function makeRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Transforme une chaîne en entier, pour servir de graine. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * @param {{id: string, palette: string[], style?: string, ratio?: number}} art
 * @param {number} longSide résolution du plus grand côté, en pixels
 * @returns {HTMLCanvasElement}
 */
export function createArtCanvas(art, longSide = 768) {
  const ratio = art.ratio ?? 0.75;          // largeur / hauteur
  const height = longSide;
  const width = Math.round(longSide * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const rnd = makeRandom(hash(art.id));
  const palette = art.palette;
  const pick = () => palette[Math.floor(rnd() * palette.length)];

  // Fond
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, width, height);

  const style = art.style ?? 'bands';

  if (style === 'bands') {
    // Aplats horizontaux façon color field
    let y = 0;
    while (y < height) {
      const h = height * (0.06 + rnd() * 0.22);
      ctx.fillStyle = pick();
      ctx.globalAlpha = 0.65 + rnd() * 0.35;
      ctx.fillRect(0, y, width, h);
      y += h;
    }
  } else if (style === 'circles') {
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.arc(rnd() * width, rnd() * height, (0.05 + rnd() * 0.3) * width, 0, Math.PI * 2);
      ctx.fillStyle = pick();
      ctx.globalAlpha = 0.25 + rnd() * 0.5;
      ctx.fill();
    }
  } else if (style === 'grid') {
    const cols = 3 + Math.floor(rnd() * 4);
    const rows = 4 + Math.floor(rnd() * 4);
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        ctx.fillStyle = pick();
        ctx.globalAlpha = 0.35 + rnd() * 0.65;
        ctx.fillRect(
          (cx / cols) * width, (cy / rows) * height,
          width / cols + 1, height / rows + 1,
        );
      }
    }
  } else if (style === 'strokes') {
    ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.moveTo(rnd() * width, rnd() * height);
      ctx.lineTo(rnd() * width, rnd() * height);
      ctx.strokeStyle = pick();
      ctx.globalAlpha = 0.15 + rnd() * 0.5;
      ctx.lineWidth = 2 + rnd() * 34;
      ctx.stroke();
    }
  }

  // Grain : casse l'aspect "dégradé numérique" et donne une matière de toile.
  ctx.globalAlpha = 1;
  const grain = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rnd() - 0.5) * 26;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  // Léger vignettage
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.2,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}
