// @ts-expect-error
import dvs from "./display.vs?raw";
// @ts-expect-error
import dfs from "./display.fs?raw";
// @ts-expect-error
import uvs from "./update.vs?raw";
// @ts-expect-error
import ufs from "./update.fs?raw";

export interface Shader {
    source: string;
    uniforms?: readonly string[];
    attributes?: readonly string[];
}

export const displayVs: Shader = {
    source: dvs as string,
    attributes: ["aVertexPosition"],
};
export const displayFs: Shader = {
    source: dfs as string,
    uniforms: ["u_texture"],
    attributes: ["aPosition"],
};
export const updateVs: Shader = {
    source: uvs as string,
    attributes: ["aVertexPosition"],
};
export const updateFs: Shader = {
    source: ufs as string,
    uniforms: ["uPrevState", "uDimens", "uNewPixel"],
    attributes: ["aPosition"],
};
