import { mat4 } from "gl-matrix";
import "webgl-lint";

type WebGLShaderType = GLenum &
    (
        | WebGLRenderingContext["VERTEX_SHADER"]
        | WebGLRenderingContext["FRAGMENT_SHADER"]
    );

interface ShaderInfo {
    source: string;
    attributeNames: string[];
    attributeLocations: Record<string, number>;
    uniformNames: string[];
    uniformLocations: Record<string, WebGLUniformLocation>;
}

interface ShaderInfos {
    vertex: ShaderInfo;
    fragment: ShaderInfo;
}

function getShaders(gl: WebGLRenderingContext): ShaderInfos {
    return {
        vertex: {
            source: `
                attribute vec4 aVertexPosition;
                uniform mat4 uModelViewMatrix;
                uniform mat4 uProjectionMatrix;
                
                void main() {
                    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                }
            `,
            uniformNames: ["uModelViewMatrix", "uProjectionMatrix"],
            uniformLocations: {},
            attributeNames: ["aVertexPosition"],
            attributeLocations: {},
        },
        fragment: {
            source: `
                void main() {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                }
            `,
            uniformNames: [],
            uniformLocations: {},
            attributeNames: [],
            attributeLocations: {},
        },
    };
}

interface ProgramSetup {
    shaders: ShaderInfos;
    program: WebGLProgram;
    vertexBuffer: WebGLBuffer;
    bindVertexBuffer: () => void;
}

function oneTimeSetup(gl: WebGLRenderingContext): ProgramSetup {
    // gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.2, 0.5, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    const shaders = getShaders(gl);
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
    vertexBuffer;
    return {
        shaders,
        program: shaderProgram,
        vertexBuffer,
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
    };
}

function renderFrame(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
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

    setInterval(() => {
        renderFrame(gl, canvas, info);
    }, 100);
    // const buffer = gl.createBuffer();
    // // buffer.resiz
    // // gl.bufferd;
    // gl.bindBuffer(0, new WebGLBufffer());
    // gl.bufferData(0, 100, 0);
    // gl.vertex;
    console.log("setting up canvas");
}

function buildShaderProgram(
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
