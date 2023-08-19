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
    vec2 fDimens = vec2(uDimens);
    vec2 pos = clipVecToPositive(aPosition);
    ivec2 iPos = ivec2(int(pos.x * fDimens.x), int(pos.y * fDimens.y));

    if (iPos == uNewPixel) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        vec4 color;
        if (iPos.y == 0) {
            color = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            color = texture2D(uPrevState, vec2(pos.x, pos.y - (1.0 / fDimens.y)));
        }

        gl_FragColor = vec4(color.rgb, 1);
    }
}