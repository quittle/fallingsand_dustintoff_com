#version 100

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

vec4 getNeighbor(vec2 pos, vec2 delta) {
    return texture2D(uPrevState, pos + delta);
}

// Neighbors in the form
//
//   a b c
// l d e f r
//   g h i
void getNeighbors(vec2 pos, vec2 fDimens, out vec4 a, out vec4 b, out vec4 c, out vec4 l, out vec4 d, out vec4 e, out vec4 f, out vec4 r, out vec4 g, out vec4 h, out vec4 i) {
    float xDelta = 1.0 / fDimens.x;
    float yDelta = 1.0 / fDimens.y;

// Above
    a = getNeighbor(pos, vec2(-xDelta, yDelta));
    b = getNeighbor(pos, vec2(0.0, yDelta));
    c = getNeighbor(pos, vec2(xDelta, yDelta));

// Same row
    l = getNeighbor(pos, vec2(-2.0 * xDelta, 0.0));
    d = getNeighbor(pos, vec2(-xDelta, 0.0));
    e = getNeighbor(pos, vec2(0.0, 0.0));
    f = getNeighbor(pos, vec2(xDelta, 0.0));
    r = getNeighbor(pos, vec2(2.0 * xDelta, 0.0));

// Below
    g = getNeighbor(pos, vec2(-xDelta, -yDelta));
    h = getNeighbor(pos, vec2(0.0, -yDelta));
    i = getNeighbor(pos, vec2(xDelta, -yDelta));
}

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

    vec4 a, b, c, l, d, e, f, r, g, h, i;
    getNeighbors(pos, fDimens, a, b, c, l, d, e, f, r, g, h, i);

    bool isTopRow = (iPos.y == uDimens.y - 1);
    bool isBottomRow = iPos.y == 0;

    if (iPos == uNewPixel) {
        gl_FragColor = SAND;
    } else {
        vec4 color;

        if (iPos.y == uDimens.y - 1) { // Nothing falls from above the screen
            color = BLANK;
        } else {
            if (b == SAND) {
                color = SAND;
            }
            if (a == SAND && d == SAND && e == BLANK) {
                color = SAND;
            } else if (c == SAND && f == SAND && e == BLANK && r == SAND) {
                color = SAND;
            }
            if (h == SAND && e == SAND) {
                color = SAND;
            }
            if (e == SAND && h == SAND && (g == BLANK || i == BLANK)) {
                color = BLANK;
            }
            if (isBottomRow && e == SAND) {
                color = SAND;
            }

            gl_FragColor = vec4(color.rgb, 1);
        }
    }
}