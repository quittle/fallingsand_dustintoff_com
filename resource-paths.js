// Maps the game's asset names to their URLs as the RESOURCE_PATHS global
// that grow.js reads. Bazel generated this from the resource map in BUILD;
// the Vite build loads this file instead (via main.js) so grow.js is unchanged.
globalThis.RESOURCE_PATHS = {
    Grow: {
        images: {
            "droplet.png": "/Grow/images/droplet.png",
            "fire.png": "/Grow/images/fire.png",
            "gen.png": "/Grow/images/gen.png",
            "growth.png": "/Grow/images/growth.png",
            "steam.png": "/Grow/images/steam.png",
            "wall.png": "/Grow/images/wall.png",
        },
        "boring.grw": "/Grow/boring.grw",
        "world3.grw": "/Grow/world3.grw",
        "world4.grw": "/Grow/world4.grw",
    },
};
