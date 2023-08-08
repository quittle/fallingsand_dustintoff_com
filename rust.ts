import { setRepeatedRequestAnimationFrameCallback } from "./animation";
import * as rustLib from "./rust-lib";
import { setupCanvas } from "./webgl";

const RUN_WASM = false;

export async function initRust() {
    window["rustLib"] = rustLib;

    const { init, tick, on_click, on_canvas_resize } = await import(
        "hello-wasm"
    );
    const canvas = rustLib.canvas;
    if (RUN_WASM) {
        function onCanvasResize(canvas: HTMLCanvasElement) {
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
            on_canvas_resize(width, height);
        }

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                onCanvasResize(entry.target as HTMLCanvasElement);
            }
        });
        resizeObserver.observe(canvas);

        init(10, 10, canvas.width, canvas.height);

        onCanvasResize(canvas);
        canvas.addEventListener("click", (e) => on_click(e.offsetX, e.offsetY));

        setRepeatedRequestAnimationFrameCallback(tick);
    } else {
        setupCanvas(canvas);
    }
}

await initRust();
