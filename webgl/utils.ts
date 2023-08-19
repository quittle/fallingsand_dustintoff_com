import { WebGLShaderType } from "./types";

function compileShader(
    gl: WebGLRenderingContext,
    code: string,
    type: WebGLShaderType,
): WebGLShader {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, code);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
            `Error compiling ${
                type === gl.VERTEX_SHADER ? "vertex" : "fragment"
            } shader:`,
            gl.getShaderInfoLog(shader),
        );
        throw new Error(
            `Error compiling ${
                type === gl.VERTEX_SHADER ? "vertex" : "fragment"
            } shader:\n${gl.getShaderInfoLog(shader)}`,
        );
    }
    return shader;
}

export function buildShaderProgram(
    gl: WebGLRenderingContext,
    shaderInfo: ReadonlyArray<{
        source: string;
        type: WebGLShaderType;
    }>,
): WebGLProgram {
    const program = gl.createProgram();

    for (const { source, type } of shaderInfo) {
        const shader = compileShader(gl, source, type);

        gl.attachShader(program, shader);
    }

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
            `Error linking shader program:\n${gl.getProgramInfoLog(program)}`,
        );
    }

    return program;
}

export function tagObject(
    gl: WebGLRenderingContext,
    object: any,
    name: string,
) {
    const ext = gl.getExtension("GMAN_debug_helper");
    if (ext) {
        ext.tagObject(object, name);
    }
}
