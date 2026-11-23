import {
    createReadStream,
    cpSync,
    existsSync,
    readFileSync,
    renameSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const growDir = join(rootDir, "Grow");

function fallingsandSite() {
    let outDir;
    return {
        name: "fallingsand-site",
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir);
        },
        transformIndexHtml(html) {
            const body = readFileSync(join(rootDir, "index.html"), "utf-8");
            return html.replace("</html>", () => `${body}</html>`);
        },
        configureServer(server) {
            server.middlewares.use("/Grow", (req, res, next) => {
                const file = join(
                    growDir,
                    decodeURIComponent((req.url || "").split("?")[0]),
                );
                if (!file.startsWith(growDir) || !existsSync(file)) {
                    return next();
                }
                res.setHeader(
                    "Content-Type",
                    file.endsWith(".grw") ? "text/xml" : "image/png",
                );
                createReadStream(file).pipe(res);
            });
        },
        closeBundle() {
            renameSync(
                join(outDir, "fallingsand.html"),
                join(outDir, "index.html"),
            );
            cpSync(growDir, join(outDir, "Grow"), { recursive: true });
        },
    };
}

export default defineConfig({
    plugins: [fallingsandSite()],
    build: {
        rollupOptions: {
            input: {
                main: join(rootDir, "fallingsand.html"),
            },
        },
    },
});
