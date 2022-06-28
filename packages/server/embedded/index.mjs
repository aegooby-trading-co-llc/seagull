
import { serve } from "./server.mjs";
import { renderStream } from "../../../build/packages/server/stream.js";

await serve({
    port: 3737, 
    handler: async function (request) {
        const controller = new AbortController();
        return new Response(await renderStream(controller), {status: 200});
    }
});