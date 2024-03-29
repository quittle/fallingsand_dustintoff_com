// Enables logging issues to console
if (globalThis.navigator) {
    import("webgl-lint");
}

import { ProgramSetup } from "./types";
import { setRepeatedRequestAnimationFrameCallback } from "../animation";
import { updateFrame } from "./update-frame";
import { displayFrame } from "./display-frame";
import { initialize } from "./initialize";
import { addGameEventListeners } from "./event-listeners";
import { readCurrentPixels } from "./utils";

globalThis["readCurrentPixels"] = readCurrentPixels;

export function runFrame(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
    updateFrame(gl, canvas, setup);
    displayFrame(gl, canvas, setup);
}
globalThis["runFrame"] = runFrame;

export function setupCanvas(canvas: HTMLCanvasElement) {
    var gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.error("Failed to get webgl for", canvas);
        return;
    }

    const info = initialize(gl);

    addGameEventListeners(canvas);

    setRepeatedRequestAnimationFrameCallback(() => {
        runFrame(gl, canvas, info);
    });
}
globalThis["setupCanvas"] = setupCanvas;
