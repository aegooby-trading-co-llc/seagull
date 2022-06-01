import * as mime from "mime";
import * as ReactDOMServer from 'react-dom/server';
import { element } from "./html.jsx";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
    // https://developers.cloudflare.com/workers/runtime-apis/kv/
    STATIC_CONTENT: KVNamespace;

    // https://developers.cloudflare.com/workers/runtime-apis/r2/
    // MY_BUCKET: R2Bucket;
}

async function route(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const content = await env.STATIC_CONTENT.get(url.pathname);

    if (!content) {
        // Not a file - so render React
        const stream = await ReactDOMServer.renderToReadableStream(element);
        return new Response(stream, {
            status: 200,
            headers: { "content-type": "text/html;charset=UTF-8" }
        });
    } else {
        // Is a file - serve static content
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
        const contentType =
            mime.getType(url.pathname) ?? "application/octet-stream";
        return new Response(content, {
            status: 200,
            headers: { "content-type": contentType }
        });
    }
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        return await route(request, env);
    },
};
