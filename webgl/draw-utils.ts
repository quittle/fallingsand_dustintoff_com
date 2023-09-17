import { SandType, updatePixelForNextFrame } from "./update-frame";

// There is some distinction in the old grow.js implementation. Keeping this around for now to make
// bringup simpler.
function changePoint(x: number, y: number, type: SandType) {
    forcePoint(x, y, type);
}

function forcePoint(x: number, y: number, type: SandType) {
    updatePixelForNextFrame(x, y, type);
}

export function elipsePoint(
    x: number,
    y: number,
    xr: number,
    yr: number,
    type: SandType,
    force: boolean,
    exceptions: readonly SandType[],
) {
    for (var i = 0; i < xr; i++) {
        for (var j = 0; j < yr; j++) {
            var dist = Math.sqrt(Math.pow(i / xr, 2) + Math.pow(j / yr, 2));
            if (dist <= 1) {
                let updateFunc: (x: number, y: number, type: SandType) => void;
                if (force) {
                    if (exceptions.includes(type)) {
                        updateFunc = changePoint;
                    } else {
                        updateFunc = forcePoint;
                    }
                } else {
                    if (exceptions.includes(type)) {
                        updateFunc = forcePoint;
                    } else {
                        updateFunc = changePoint;
                    }
                }

                updateFunc(x + i, y + j, type);
                updateFunc(x - i, y + j, type);
                updateFunc(x + i, y - j, type);
                updateFunc(x - i, y - j, type);
            }
        }
    }
}

export function circlePoint(
    x: number,
    y: number,
    radius: number,
    type: SandType,
    force: boolean,
    exceptions: readonly SandType[],
) {
    elipsePoint(x, y, radius, radius, type, force, exceptions);
}
