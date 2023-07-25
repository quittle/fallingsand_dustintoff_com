export type DeltaCallback = (deltaMs: number) => void;

const callbacks: DeltaCallback[] = [];
let prev: DOMHighResTimeStamp = 0;

export function setRepeatedRequestAnimationFrameCallback(
    callback: DeltaCallback,
) {
    if (callbacks.length === 0) {
        prev = performance.now();
        requestAnimationFrame(doWork);
    }
    callbacks.push(callback);
}

function doWork(time: DOMHighResTimeStamp) {
    const delta = time - prev;
    for (const callback of callbacks) {
        callback(delta);
    }
    prev = time;

    requestAnimationFrame(doWork);
}
