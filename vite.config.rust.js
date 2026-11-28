import wasm from "vite-plugin-wasm";
import { watch } from "vite-plugin-watch";

export default {
    plugins: [
        watch({
            pattern: "rust/**/*.{rs,lock,toml}",
            command: "npm run wasm-pack",
            onInit: false,
        }),
        wasm(),
    ],
    worker: {
        plugins: () => [wasm()],
    },
    build: {
        rollupOptions: {
            input: {
                main: "rust.html",
            },
        },
    },
};
