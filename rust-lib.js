export const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

export function drawRect(x, y, width, height) {
    ctx.fillRect(x, y, width, height);
}