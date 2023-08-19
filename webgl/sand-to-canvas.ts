// Enables logging issues to console
import "webgl-lint";

import { mat4 } from "gl-matrix";
import { ProgramSetup, ShaderInfos } from "./types";
import { buildShaderProgram, tagObject } from "./utils";

function getShaders(): ShaderInfos {
    return {
        vertex: {
            source: `
                attribute vec4 aVertexPosition;

                uniform mat4 uModelViewMatrix;
                uniform mat4 uProjectionMatrix;

                varying vec2 aPosition;
                
                void main() {
                    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                    aPosition = vec2(aVertexPosition.x, aVertexPosition.y);
                }
            `,
            uniformNames: ["uModelViewMatrix", "uProjectionMatrix"],
            uniformLocations: {},
            attributeNames: ["aVertexPosition"],
            attributeLocations: {},
        },
        fragment: {
            source: `
                precision highp float;

                uniform sampler2D uTexture;
                varying vec2 aPosition;

                void main() {
                    gl_FragColor = vec4(texture2D(uTexture, aPosition).a, aPosition.x, aPosition.y, 1);
                }
            `,
            uniformNames: ["uTexture"],
            uniformLocations: {},
            attributeNames: ["aPosition"],
            attributeLocations: {},
        },
    };
}

export interface SandToCanvasContext {
    programSetup: ProgramSetup;
}

export function init(gl: WebGLRenderingContext): SandToCanvasContext {
    const shaders = getShaders();
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
    const vertexBuffer = createVertexBuffer(
        gl,
        [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0],
    );
    const sandBuffer = createSandBuffer(gl, 16, 16);
    return {
        programSetup: {
            shaders,
            program: shaderProgram,
            vertexBuffer,
            sandBuffer,
            bindVertexBuffer: () => {
                const numComponents = 2; // pull out 2 values per iteration
                const type = gl.FLOAT; // the data in the buffer is 32bit floats
                const normalize = false; // don't normalize
                const stride = 0; // how many bytes to get from one set of values to the next
                // 0 = use type and numComponents above
                const offset = 0; // how many bytes inside the buffer to start from
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                gl.vertexAttribPointer(
                    shaders.vertex.attributeLocations["aVertexPosition"],
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset,
                );
                gl.enableVertexAttribArray(
                    shaders.vertex.attributeLocations["aVertexPosition"],
                );
            },
        },
    };
}

function renderFrame(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    context: SandToCanvasContext,
) {
    const setup = context.programSetup;
    // gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    // gl.clearDepth(1.0); // Clear everything
    // gl.enable(gl.DEPTH_TEST); // Enable depth testing
    // gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [-0.0, 0.0, -6.0],
    ); // amount to translate

    setup.bindVertexBuffer();

    // Tell WebGL to use our program when drawing
    gl.useProgram(setup.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, setup.sandBuffer);
    gl.uniform1i(setup.shaders.fragment.uniformLocations["uTexture"], 0);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        setup.shaders.vertex.uniformLocations["uProjectionMatrix"],
        false,
        projectionMatrix,
    );
    gl.uniformMatrix4fv(
        setup.shaders.vertex.uniformLocations["uModelViewMatrix"],
        false,
        modelViewMatrix,
    );

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}

function createSandBuffer(
    gl: WebGLRenderingContext,
    width: number,
    height: number,
): WebGLTexture {
    const texture = gl.createTexture();
    tagObject(gl, texture, "sand");

    console.log(width, height);
    var data = new Uint8Array(width * height);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (x % 2 === 0 || y % 2 === 0) {
                continue;
            }
            // data.set(x + y * width, 1);
            data[x + y * width] = 255;
        }
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    var level = 0;
    const border = 0;
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        gl.ALPHA,
        width,
        height,
        border,
        gl.ALPHA,
        gl.UNSIGNED_BYTE,
        data,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;

    const buffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(0, buffer);
    gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        width,
        height,
    );
    gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        buffer,
    );

    return buffer;

    // gl.renderbufferStorage(0, gl.DEPTH)
    // gl.renderbufferStorage();
}

function createVertexBuffer(
    gl: WebGLRenderingContext,
    vertices: number[],
): WebGLBuffer {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    return positionBuffer;
}

export function setupCanvas(canvas: HTMLCanvasElement) {
    var gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("Failed to get webgl for", canvas);
        return;
    }

    const info = init(gl);

    setInterval(() => {
        renderFrame(gl, canvas, info);
    }, 100);
    console.log("setting up canvas");
}
