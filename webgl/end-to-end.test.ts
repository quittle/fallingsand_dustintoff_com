import type { Browser, Page } from "puppeteer";
import { createServer, Server } from "node:http";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { readCurrentPixels } from "./utils";
import { runFrame, setupCanvas } from ".";

declare global {
    interface Window {
        readCurrentPixels: typeof readCurrentPixels;
        setupCanvas: typeof setupCanvas;
        runFrame: typeof runFrame;
        getOrInitialize: typeof InBrowser.getOrInitialize;
    }
}

namespace InBrowser {
    export function getOrInitialize(): {
        canvas: HTMLCanvasElement;
        gl: WebGLRenderingContext;
    } {
        let canvas: HTMLCanvasElement = document.getElementById(
            "canvas",
        ) as HTMLCanvasElement;
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.width = 5;
            canvas.height = 5;
            window.setupCanvas(canvas);
        }
        const gl = canvas.getContext("webgl");

        return { canvas, gl };
    }
}

describe("end-to-end", () => {
    let browser: Browser;
    let server: Server;
    const baseUrl = "http://127.0.0.1:5199/";
    const pageErrors: string[] = [];

    beforeAll(async () => {
        server = createServer((req, res) => {
            const pathname = new URL(req.url, "http://localhost").pathname;
            const type = pathname.endsWith(".wasm")
                ? "application/wasm"
                : pathname.endsWith(".html")
                ? "text/html"
                : "text/javascript";
            createReadStream(join("dist", pathname))
                .on("error", () => res.writeHead(404).end())
                .pipe(res.writeHead(200, { "Content-Type": type }));
        });
        await new Promise<void>((resolve) => server.listen(5199, resolve));
        const { default: puppeteer } = await import("puppeteer");
        browser = await puppeteer.launch({
            headless: true,
            dumpio: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        pageErrors.length = 0;
    });

    let page: Page;
    beforeEach(async () => {
        page = await browser.newPage();
        page.on("console", (message) => {
            (console[message.type()] ?? console.log)(message.text());
            if (message.type() === "error") {
                pageErrors.push(message.text());
            }
        });
        page.on("pageerror", ({ message }) => pageErrors.push(message));
    });

    afterEach(async () => {
        await page?.close({ runBeforeUnload: false });
        if (pageErrors.length > 0) {
            console.error(pageErrors);
        }
        expect(pageErrors).toHaveLength(0);
    });

    afterAll(async () => {
        await browser?.close();
        server.closeAllConnections();
        server.close();
    });

    async function loadPage(pathname: string): Promise<void> {
        const response = await page.goto(new URL(pathname, baseUrl).toString());
        expect(response.ok()).toBe(true);
    }

    function arr<T>(value: T, length: number): T[] {
        return new Array(length).fill(value);
    }

    test("default blank", async () => {
        await loadPage("rust.html");

        for (const [name, func] of Object.entries(InBrowser)) {
            await page.evaluate(
                (name, body) => {
                    window[name] = eval(`(${body})`);
                },
                name,
                func.toString(),
            );
        }

        const pixels = await page.evaluate(async () => {
            const { gl } = window.getOrInitialize();
            return Array.from(window.readCurrentPixels(gl));
        });
        expect(Array.from(pixels)).toEqual(arr(0, 5 * 5 * 4));

        await page.evaluate(async () => {
            const { canvas, gl } = window.getOrInitialize();
            // window.runFrame(gl, canvas, null);
        });
    });
});
