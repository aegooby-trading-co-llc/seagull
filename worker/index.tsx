import * as React from "react";
import * as ReactDOMServer from 'react-dom/server';
import { App } from "../app/App.js";

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

export default {
    // eslint-disable-next-line @typescript-eslint/require-await
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        const innerHtml = ReactDOMServer.renderToString(<App />);
        const html = `<!DOCTYPE html><html lang="en"><body>${innerHtml}</body></html>`;
        return new Response(html, {
            headers: {
                'content-type': 'text/html;charset=UTF-8',
            },
        });
    },
};
