import { circlePoint } from "./draw-utils";

let prevX: number;
let prevY: number;
let isMouseDown: boolean = false;

export function addGameEventListeners(element: HTMLElement) {
    element.addEventListener(
        "mousedown",
        (event) => {
            prevX = event.clientX;
            prevY = event.clientY;
            isMouseDown = true;
            mouseMove(event);
        },
        false,
    );
    element.addEventListener(
        "mouseup",
        () => {
            isMouseDown = false;
        },
        false,
    );
    element.addEventListener(
        "click",
        (event) => {
            mouseMove(event);
        },
        false,
    );
    element.addEventListener(
        "mousemove",
        (event) => {
            if (!isMouseDown) {
                return;
            }
            mouseMove(event);
        },
        false,
    );
}

function mouseMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const gridHeight = parseInt(target.getAttribute("height"), 10);
    const particleSize = target.clientHeight / gridHeight;
    if (event.clientX != 0 || event.clientY != 0) {
        let x = Math.round(event.clientX);
        let y = Math.round(event.clientY);
        do {
            circlePoint(
                Math.round(x / particleSize),
                gridHeight - Math.round(y / particleSize),
                1,
                "sand",
                true,
                [],
            );
            if (Math.abs(x - prevX) >= particleSize) {
                x += particleSize * (x - prevX < 0 ? 1 : -1);
            }
            if (Math.abs(y - prevY) >= particleSize) {
                y += particleSize * (y - prevY < 0 ? 1 : -1);
            }
        } while (
            Math.abs(x - prevX) >= particleSize ||
            Math.abs(y - prevY) >= particleSize
        );
        prevX = event.clientX;
        prevY = event.clientY;
    }
}
