import { ProgramSetup } from "./types";
import { createColorTexture } from "./utils";

export function updateFrame(
    gl: WebGLRenderingContext,
    _canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
    let { stateTexture, updateProgram } = setup;

    gl.useProgram(updateProgram);

    // Bind to a framebuffer (instead of null which will render to the canvas)
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // Attach stateTexture as the first color attachment, so it will be rendered into
    const level = 0;
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachmentPoint,
        gl.TEXTURE_2D,
        stateTexture,
        level,
    );

    // Copy framebuffer-attached texture stateTexture into copyTexture
    const copyTexture = createColorTexture(
        gl,
        "copyTexture",
        gl.canvas.width,
        gl.canvas.height,
    );
    {
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
    }

    {
        // Use the copied texture as the old state while writing back into the bound stateTexture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, copyTexture);
        gl.uniform1i(
            setup.updateShaders.fragment.uniformLocations["uPrevState"],
            0,
        );
    }
    gl.uniform2i(
        setup.updateShaders.fragment.uniformLocations["uDimens"],
        gl.canvas.width,
        gl.canvas.height,
    );
    gl.uniform2i(
        setup.updateShaders.fragment.uniformLocations["uNewPixel"],
        Math.random() * gl.canvas.width,
        gl.canvas.height - 1,
    );

    {
        // Bind a boring full-clip-space buffer which will render everything to it

        const numComponents = 2; // pull out 2 values per iteration
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, setup.fullClipSpaceVertexBuffer);
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

    // Clear
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    {
        // Perform the actual draw
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }

    // Unbind the framebuffer to ensure rendering to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.deleteTexture(copyTexture);
    gl.deleteFramebuffer(fb);
}
