import puppeteer, { Browser, Page } from "puppeteer";
import { createServer, ViteDevServer } from "vite";

declare global {
    interface Window {
        readCurrentPixels: (gl: WebGLRenderingContext) => Uint8Array;
        setupCanvas: (canvas: HTMLCanvasElement) => void;
        runFrame: (
            gl: WebGLRenderingContext,
            canvas: HTMLCanvasElement,
            setup: any,
        ) => void;
    }
}

describe("end-to-end", () => {
    let browser: Browser;
    let viteDevServer: ViteDevServer;
    const pageErrors: string[] = [];

    beforeAll(async () => {
        viteDevServer = await createServer();
        await viteDevServer.listen();
        browser = await puppeteer.launch({
            headless: "new",
            dumpio: true,
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
        await page.close({ runBeforeUnload: false });
        if (pageErrors.length > 0) {
            console.error(pageErrors);
        }
        expect(pageErrors).toHaveLength(0);
    });

    afterAll(async () => {
        await browser.close();
        await viteDevServer.close();
    });

    async function loadPage(pathname: string): Promise<void> {
        const baseUrl = new URL(viteDevServer.resolvedUrls.local[0]);
        baseUrl.pathname = pathname;
        const response = await page.goto(baseUrl.toString());
        expect(response.ok()).toBe(true);
    }

    function arr<T>(value: T, length: number): T[] {
        return new Array(length).fill(value);
    }

    test("default blank", async () => {
        await loadPage("rust.html");

        const pixels: Array<number> = await page.evaluate(async () => {
            const canvas = document.createElement("canvas");
            document.body.appendChild(canvas);
            canvas.width = 5;
            canvas.height = 5;
            window.setupCanvas(canvas);

            const gl = canvas.getContext("webgl");
            return Array.from(window.readCurrentPixels(gl));
        });
        expect(Array.from(pixels)).toEqual(arr(0, 5 * 5 * 4));
    });
});
