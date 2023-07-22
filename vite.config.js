import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { watch } from "vite-plugin-watch"
// import wasmPack from 'vite-plugin-wasm-pack';

export default {
    plugins: [
        
    watch({
        pattern: "rust/**/*.{rs,lock,toml}",
        command: "npm run wasm-pack",
      }),
      wasm(),
      topLevelAwait()
    ],
    worker: {
      plugins: [
        wasm(),
        topLevelAwait()
      ]
    }
  };