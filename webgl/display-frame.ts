import { ProgramSetup } from "./types";

export function displayFrame(
    gl: WebGLRenderingContext,
    _canvas: HTMLCanvasElement,
    setup: ProgramSetup,
) {
    // Clear first (though this should never be seen)
    gl.clearColor(0.2, 0.5, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    {
        // Bind a boring full-clip-space buffer which will render everything to it

        const numComponents = 2; // pull out 2 values per iteration
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, setup.fullClipSpaceVertexBuffer);
        gl.vertexAttribPointer(
            setup.displayShaders.vertex.attributeLocations["aVertexPosition"],
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        gl.enableVertexAttribArray(
            setup.displayShaders.vertex.attributeLocations["aVertexPosition"],
        );
    }

    // Tell WebGL to use our program when drawing
    gl.useProgram(setup.displayProgram);

    {
        // Bind the state texture to read from
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, setup.stateTexture);
        gl.uniform1i(
            setup.displayShaders.fragment.uniformLocations["u_texture"],
            0,
        );
    }

    {
        // Render to canvas
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
