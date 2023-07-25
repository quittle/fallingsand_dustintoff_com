export const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "black";

function colorToHexString(color) {
    return `#${color.toString(16)}`;
}

export function fillRect(x, y, width, height, color) {
    ctx.fillStyle = colorToHexString(color);
    ctx.fillRect(x, y, width, height);
}

export function strokeRect(x, y, width, height, color) {
    ctx.strokeStyle = colorToHexString(color);
    ctx.strokeRect(x, y, width, height);
}
