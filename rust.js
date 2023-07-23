const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

function drawRect(x, y, width, height) {
    ctx.fillRect(x, y, width, height);
}

export function initRust() {
    console.log("Init js");
    drawRect(10, 10, 10, 10);

    window.rustLib = {
        drawRect,
    };

    return function init(i) {
        console.log("Initializing rust", i);
        i(canvas.height, canvas.width, canvas.width, canvas.height);
        console.log("1 + 2 = " + add(1, 2));
    };
}
