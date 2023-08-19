// Enables logging issues to console
import "webgl-lint";

import { ProgramSetup, ShaderInfos } from "./types";
import { buildShaderProgram, tagObject } from "./utils";
import { setRepeatedRequestAnimationFrameCallback } from "../animation";

function getShaders(): ShaderInfos {
    return {
        vertex: {
            source: `
                attribute vec4 aVertexPosition;

                varying vec2 aPosition;
                
                void main() {
                    gl_Position = vec4(aVertexPosition.x, aVertexPosition.y, 0, 1);
                    aPosition = vec2(aVertexPosition.x, aVertexPosition.y);
                }
            `,
            uniformNames: [],
            uniformLocations: {},
            attributeNames: ["aVertexPosition"],
            attributeLocations: {},
        },
        fragment: {
            source: `
                precision highp float;

                uniform sampler2D u_texture;
                varying vec2 aPosition;

                vec2 clipVecToPositive(vec2 position) {
                    return (position + vec2(1.0, 1.0)) / 2.0;
                }

                void main() {
                    gl_FragColor = texture2D(u_texture, clipVecToPositive(aPosition));
                    if (aPosition.x < -1.0 || aPosition.x > 1.0 || aPosition.y < -1.0 || aPosition.y > 1.0) {
                        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
                    }
                }
            `,
            uniformNames: ["u_texture"],
            uniformLocations: {},
            attributeNames: ["aPosition"],
            attributeLocations: {},
        },
    };
}

function getUpdateShaders(): ShaderInfos {
    return {
        vertex: {
            source: `
                attribute vec2 aVertexPosition;

                varying vec2 aPosition;
                
                void main() {
                    gl_Position = vec4(aVertexPosition.x, aVertexPosition.y, 0, 1);
                    
                    vec2 newPos = aVertexPosition * 2.0;
                    if (aVertexPosition.y < -1.0) {
                        gl_Position = vec4(aVertexPosition.x, 0.0, 0, 1);
                    }
                    aPosition = vec2(aVertexPosition.x, aVertexPosition.y);
                }
            `,
            uniformNames: [],
            uniformLocations: {},
            attributeNames: ["aVertexPosition"],
            attributeLocations: {},
        },
        fragment: {
            source: `
                precision highp float;
                precision highp int;

                varying vec2 aPosition;

                uniform sampler2D uPrevState;
                uniform ivec2 uDimens;
                uniform ivec2 uNewPixel;

                vec2 clipVecToPositive(vec2 position) {
                    return (position + vec2(1.0, 1.0)) / 2.0;
                }

                void main() {
                    vec2 pos = clipVecToPositive(aPosition);
                    ivec2 iPos = ivec2(int(pos.x * float(uDimens.x)), int(pos.y * float(uDimens.y)));

                    if (iPos == uNewPixel) {
                        gl_FragColor = vec4(1, 0, 0, 1);
                    } else {
                        vec4 color;
                        if (iPos.y == 0) {
                             color = vec4(0.0, 0.0, 0.0, 1.0);
                        } else {
                             color = texture2D(uPrevState, vec2(pos.x, pos.y - (1.0 / float(uDimens.y))));
                        }
                        
                        gl_FragColor = vec4(color.rgb, 1);
                    }
                }
            `,
            uniformNames: ["uPrevState", "uDimens", "uNewPixel"],
            uniformLocations: {},
            attributeNames: ["aPosition"],
            attributeLocations: {},
        },
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

function oneTimeSetup(gl: WebGLRenderingContext): ProgramSetup {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.lineWidth(1); // For debugging

    const shaders = getShaders();
    const shaderProgram = buildProgram(gl, "display", shaders);

    const updateShaders = getUpdateShaders();
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
        shaders,
        program: shaderProgram,
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
    };
}

function updateBuffer(
    gl: WebGLRenderingContext,
    _canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
    let { sandBuffer, updateProgram } = setup;

    const colorBuffer = sandBuffer;

    gl.useProgram(updateProgram);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const level = 0;

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachmentPoint,
        gl.TEXTURE_2D,
        colorBuffer,
        level,
    );

    // Copy buffers
    const copyTexture = createColorTexture(
        gl,
        "copyTexture",
        gl.canvas.width,
        gl.canvas.height,
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, copyTexture);

    gl.copyTexImage2D(
        gl.TEXTURE_2D,
        level,
        gl.RGBA,
        0,
        0,
        gl.canvas.width,
        gl.canvas.height,
        0,
    );

    gl.uniform1i(
        setup.updateShaders.fragment.uniformLocations["uPrevState"],
        0,
    );

    gl.uniform2i(
        setup.updateShaders.fragment.uniformLocations["uDimens"],
        gl.canvas.width,
        gl.canvas.height,
    );

    gl.uniform2i(
        setup.updateShaders.fragment.uniformLocations["uNewPixel"],
        Math.random() * gl.canvas.width,
        0,
    );

    const vertexBuffer = createVertexBuffer(
        gl,
        [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0],
    );
    {
        {
            const numComponents = 2; // pull out 2 values per iteration
            const type = gl.FLOAT; // the data in the buffer is 32bit floats
            const normalize = false; // don't normalize
            const stride = 0; // how many bytes to get from one set of values to the next
            // 0 = use type and numComponents above
            const offset = 0; // how many bytes inside the buffer to start from
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(
                setup.updateShaders.vertex.attributeLocations[
                    "aVertexPosition"
                ],
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            gl.enableVertexAttribArray(
                setup.updateShaders.vertex.attributeLocations[
                    "aVertexPosition"
                ],
            );
        }
    }

    const offset = 0;
    const vertexCount = 4;

    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    // gl.drawArrays(gl.LINE_STRIP, offset, vertexCount);

    gl.deleteBuffer(vertexBuffer);
    gl.deleteTexture(copyTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
}

function renderFrame(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
    updateBuffer(gl, canvas, setup);

    gl.clearColor(0.2, 0.5, 0.2, 1);

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setup.bindVertexBuffer();

    // Tell WebGL to use our program when drawing
    gl.useProgram(setup.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, setup.sandBuffer);
    gl.uniform1i(setup.shaders.fragment.uniformLocations["u_texture"], 0);

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}

function createColorTexture(
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
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        gl.RGBA,
        width,
        height,
        border,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}

function createSandBuffer(
    gl: WebGLRenderingContext,
    width: number,
    height: number,
): WebGLTexture {
    const texture = gl.createTexture();
    tagObject(gl, texture, "sand");

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
    const level = 0;
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

    const info = oneTimeSetup(gl);

    setRepeatedRequestAnimationFrameCallback(() => {
        renderFrame(gl, canvas, info);
    });
}
