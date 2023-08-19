import { ProgramSetup } from "./types";

export function displayFrame(
    gl: WebGLRenderingContext,
    _canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
    gl.clearColor(0.2, 0.5, 0.2, 1);

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setup.bindVertexBuffer();

    // Tell WebGL to use our program when drawing
    gl.useProgram(setup.displayProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, setup.sandBuffer);
    gl.uniform1i(
        setup.displayShaders.fragment.uniformLocations["u_texture"],
        0,
    );

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
