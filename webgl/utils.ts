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

export function createVertexBuffer(
    gl: WebGLRenderingContext,
    name: string,
    vertices: number[],
): WebGLBuffer {
    const vertexBuffer = gl.createBuffer();
    tagObject(gl, vertexBuffer, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    return vertexBuffer;
}

export function createColorTexture(
    gl: WebGLRenderingContext,
    name: string,
    width: number,
    height: number,
): WebGLTexture {
    const texture = gl.createTexture();
    tagObject(gl, texture, name);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const border = 0;
    const pixels = null;
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        gl.RGBA,
        width,
        height,
        border,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}

export function readCurrentPixels(gl: WebGLRenderingContext): Uint8Array {
    const pixels = new Uint8Array(
        gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
    );
    gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
    );
    return pixels;
}
