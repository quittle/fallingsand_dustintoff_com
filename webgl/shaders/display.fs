precision highp float;

varying vec2 aPosition;

uniform sampler2D u_texture;

vec2 clipVecToTexture(vec2 position) {
    return (position + vec2(1.0, 1.0)) / 2.0;
}

void main() {
    gl_FragColor = texture2D(u_texture, clipVecToTexture(aPosition));
}