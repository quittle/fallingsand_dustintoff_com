attribute vec2 aVertexPosition;

varying vec2 aPosition;

void main() {
    aPosition = aVertexPosition;
    gl_Position = vec4(aVertexPosition, 0, 1);
}