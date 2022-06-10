import * as mime from "mime";
import * as ReactDOMServer from 'react-dom/server';
import * as base64 from "base64-js";
import { element } from "./index.html.jsx";

export interface Env {
    // https://developers.cloudflare.com/workers/runtime-apis/kv/
    STATIC_CONTENT: KVNamespace;
}

/**
 * Allows for request URL paths to contain the file hash or not.
 * For example, transforms /app/index@IKXSF6WX.js to /app/index.js,
 * but /app/index.js is left alone.
 * 
 * @param path URL path to have its hash removed
 * @returns URL path without the hash
 */
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
        const extension = path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2);
        const contentType =
            mime.getType(extension) ?? "application/octet-stream";
        // Need to base64 decode so we can store all file types in KV
        return new Response(base64.toByteArray(content), {
            status: 200,
            headers: { "content-type": contentType }
        });
    }
}

export default {
    async fetch(
        request: Request,
        env: Env,
        // eslint-disable-next-line
        ctx: ExecutionContext
    ): Promise<Response> {
        return await route(request, env);
    },
};
