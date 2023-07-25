import * as rustLib from "./rust-lib";

export async function initRust() {
    window.rustLib = rustLib;

    const { init, tick, on_click, on_canvas_resize } = await import(
        "hello-wasm"
    );
    const canvas = rustLib.canvas;

    function onCanvasResize(canvas) {
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        on_canvas_resize(width, height);
    }

    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            onCanvasResize(entry.target);
        }
    });
    resizeObserver.observe(canvas);

    init(10, 10, canvas.width, canvas.height);

    onCanvasResize(canvas);
    canvas.addEventListener(
        "click",
        (e) => console.log(e) || on_click(e.offsetX, e.offsetY),
    );

    setInterval(tick, 10);
}

await initRust();
