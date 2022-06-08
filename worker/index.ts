import * as mime from "mime";
import * as ReactDOMServer from 'react-dom/server';
import { element } from "./index.html.jsx";

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
}

function stripHash(path: string): string {
    const hashRegex = /(.*)@([A-Z0-9]{8})(\..*)/;
    if (hashRegex.test(path)) {
        const match = path.match(hashRegex);
        if (!match || match.length !== 4) {
            return path;
        } else {
            return match[1] + match[3];
        }
    } else {
        return path;
    }
}

async function route(request: Request, env: Env): Promise<Response> {
    const path = stripHash(new URL(request.url).pathname);

    const content = await env.STATIC_CONTENT.get(path);

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
        const extension = path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2);
        const contentType =
            mime.getType(extension) ?? "application/octet-stream";
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
