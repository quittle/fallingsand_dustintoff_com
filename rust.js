import * as rustLib from "./rust-lib";

export async function initRust() {
    window.rustLib = rustLib;
    
    const {init, tick} = await import("hello-wasm");
    const canvas = rustLib.canvas;
    init(canvas.height, canvas.width, canvas.width, canvas.height);

    setInterval(tick, 1);
}

await initRust();