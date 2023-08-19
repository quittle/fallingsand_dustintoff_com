attribute vec2 aVertexPosition;

varying vec2 aPosition;

void main() {
    gl_Position = vec4(aVertexPosition, 0, 1);
    aPosition = aVertexPosition;
}