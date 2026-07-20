export default function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  // Plafonné à 2 : au-delà, on quadruple le nombre de pixels à calculer pour un gain
  // visuel quasi nul. C'est le premier levier à actionner si le framerate s'effondre.
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const width  = Math.floor( canvas.clientWidth  * pixelRatio );
  const height = Math.floor( canvas.clientHeight * pixelRatio );
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
