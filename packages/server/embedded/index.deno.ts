
import { serve } from "./server.deno.ts";
import { renderStream } from "../../../build/packages/server/stream.js";

await serve({
    port: 3737,
    handler: async function (request: Request) {
        const controller = new AbortController();
        const url = new URL(request.url);
        return new Response(await renderStream(controller, url.pathname), {
            status: 200
        });
    }
});