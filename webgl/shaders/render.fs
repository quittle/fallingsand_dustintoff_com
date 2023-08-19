precision highp float;

uniform sampler2D u_texture;
varying vec2 aPosition;

vec2 clipVecToPositive(vec2 position) {
    return (position + vec2(1.0, 1.0)) / 2.0;
}

void main() {
    gl_FragColor = texture2D(u_texture, clipVecToPositive(aPosition));
}