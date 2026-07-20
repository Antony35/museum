import Museum from "./src/js/Museum.js";

const canvas = document.getElementById('canvas');

let museum = new Museum(canvas);
requestAnimationFrame(museum.render);
