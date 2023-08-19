import { ProgramSetup } from "./types";
import { createColorTexture, createVertexBuffer } from "./utils";

export function updateFrame(
    gl: WebGLRenderingContext,
    _canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
    let { sandBuffer, updateProgram } = setup;

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
        sandBuffer,
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
        const numComponents = 2; // pull out 2 values per iteration
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(
            setup.updateShaders.vertex.attributeLocations["aVertexPosition"],
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        gl.enableVertexAttribArray(
            setup.updateShaders.vertex.attributeLocations["aVertexPosition"],
        );
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
