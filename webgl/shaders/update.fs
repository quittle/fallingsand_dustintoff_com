precision highp float;
precision highp int;

varying vec2 aPosition;

uniform sampler2D uPrevState;
uniform ivec2 uDimens;
uniform ivec2 uNewPixel;

vec2 clipVecToPositive(vec2 position) {
    return (position + vec2(1.0, 1.0)) / 2.0;
}

const vec4 BLANK = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 SAND = vec4(1.0, 0.0, 0.0, 1.0);

// Coordinate space is 0,0 => iPos.x,iPos.y from the bottom-left corner up and to the right
//
// 3       /
// 2     /
// 1   /
// 0 /
//   0 1 2 3
void main() {
    vec2 fDimens = vec2(uDimens);

    // float coordinates in buffer
    vec2 pos = clipVecToPositive(aPosition);

    // int coordinates in buffer
    ivec2 iPos = ivec2(int(pos.x * fDimens.x), int(pos.y * fDimens.y));

    if (iPos == uNewPixel) {
        gl_FragColor = SAND;
    } else {
        vec4 color;

        if (iPos.y == uDimens.y - 1) { // Nothing falls from above the screen
            color = BLANK;
        } else {
            color = texture2D(uPrevState, vec2(pos.x, pos.y + (1.0 / fDimens.y)));
        }

        gl_FragColor = vec4(color.rgb, 1);
    }
}