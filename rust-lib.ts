export const canvas = document.getElementsByTagName("canvas")[0];

let context2d: CanvasRenderingContext2D;
function getContext2d(): CanvasRenderingContext2D {
    if (!context2d) {
        context2d = canvas.getContext("2d");
        context2d.strokeStyle = "black";
    }
    return context2d;
}

function colorToHexString(color) {
    return `#${color.toString(16)}`;
}

export function fillRect(x, y, width, height, color) {
    const ctx = getContext2d();
    ctx.fillStyle = colorToHexString(color);
    ctx.fillRect(x, y, width, height);
}

export function strokeRect(x, y, width, height, color) {
    const ctx = getContext2d();
    ctx.strokeStyle = colorToHexString(color);
    ctx.strokeRect(x, y, width, height);
}
