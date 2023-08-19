import { Shader, displayVs, displayFs, updateVs, updateFs } from "./shaders";
import { ShaderInfo, ShaderInfos, ProgramSetup } from "./types";
import {
    buildShaderProgram,
    createColorTexture,
    createVertexBuffer,
    tagObject,
} from "./utils";

function shaderToShaderInfo(shader: Shader): ShaderInfo {
    return {
        source: shader.source,
        uniformNames: [...(shader.uniforms ?? [])],
        uniformLocations: {},
        attributeNames: [...(shader.attributes ?? [])],
        attributeLocations: {},
    };
}

function buildProgram(
    gl: WebGLRenderingContext,
    name: string,
    shaders: ShaderInfos,
): WebGLProgram {
    const shaderProgram = buildShaderProgram(gl, [
        { ...shaders.fragment, type: gl.FRAGMENT_SHADER },
        { ...shaders.vertex, type: gl.VERTEX_SHADER },
    ]);
    for (const shader of [shaders.fragment, shaders.vertex]) {
        for (const attribute of shader.attributeNames) {
            shader.attributeLocations[attribute] = gl.getAttribLocation(
                shaderProgram,
                attribute,
            );
        }
        for (const uniform of shader.uniformNames) {
            shader.uniformLocations[uniform] = gl.getUniformLocation(
                shaderProgram,
                uniform,
            );
        }
    }
    tagObject(gl, shaderProgram, name);
    return shaderProgram;
}

export function initialize(gl: WebGLRenderingContext): ProgramSetup {
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.lineWidth(1); // For debugging

    const displayShaders: ShaderInfos = {
        vertex: shaderToShaderInfo(displayVs),
        fragment: shaderToShaderInfo(displayFs),
    };
    const displayProgram = buildProgram(gl, "display", displayShaders);

    const updateShaders: ShaderInfos = {
        vertex: shaderToShaderInfo(updateVs),
        fragment: shaderToShaderInfo(updateFs),
    };
    const updateProgram = buildProgram(gl, "update", updateShaders);

    const vertexBuffer = createVertexBuffer(
        gl,
        [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0],
    );
    const sandBuffer = createColorTexture(
        gl,
        "sandBuffer",
        gl.canvas.width,
        gl.canvas.height,
    );
    return {
        displayShaders,
        displayProgram,
        updateShaders,
        updateProgram,
        vertexBuffer,
        sandBuffer,
        bindVertexBuffer: () => {
            const numComponents = 2; // pull out 2 values per iteration
            const type = gl.FLOAT; // the data in the buffer is 32bit floats
            const normalize = false; // don't normalize
            const stride = 0; // how many bytes to get from one set of values to the next
            const offset = 0; // how many bytes inside the buffer to start from
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(
                displayShaders.vertex.attributeLocations["aVertexPosition"],
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            gl.enableVertexAttribArray(
                displayShaders.vertex.attributeLocations["aVertexPosition"],
            );
        },
    };
}
