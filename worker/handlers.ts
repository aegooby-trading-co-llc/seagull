import * as mime from "mime";
import * as ReactDOMServer from 'react-dom/server';
import * as base64 from "base64-js";
import type React from "react";

import * as graphql from "./graphql.js";

export interface HandlerConfig {
    reactElement: React.ReactElement;
}

export interface Env {
    // https://developers.cloudflare.com/workers/runtime-apis/kv/
    STATIC_CONTENT: KVNamespace;
    MODE: string;
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

async function graphqlHandler(request: Request, env: Env): Promise<Response> {
    switch (request.method) {
        case "GET":
            return await graphql.getHandler(request, env);
        case "POST":
            return await graphql.postHandler(request, env);
        default:
            return new Response("GraphQL requires GET or POST", {
                status: 405
            });
    }
}

async function reactHandler(config: HandlerConfig): Promise<Response> {
    const stream = await ReactDOMServer.renderToReadableStream(
        config.reactElement
    );
    return new Response(stream, {
        status: 200,
        headers: { "content-type": "text/html;charset=UTF-8" }
    });
}

async function staticHandler(content: string, path: string): Promise<Response> {
    await Promise.resolve();
    const extension = path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2);
    const contentType =
        mime.getType(extension) ?? "application/octet-stream";
    // Need to base64 decode so we can store all file types in KV
    return new Response(base64.toByteArray(content), {
        status: 200,
        headers: { "content-type": contentType }
    });
}

async function fetchHandler(
    request: Request, env: Env, config: HandlerConfig
): Promise<Response> {
    const path = stripHash(new URL(request.url).pathname);

    // Try GraphQL
    if (/^\/graphql\??.*/.test(path)) {
        return await graphqlHandler(request, env);
    }

    // Check if it's a static file
    let content = null as string | null;
    switch (env.MODE) {
        case "development":
            {
                const urlFetch = new URL(path, "http://localhost:3080/");
                const response = await fetch(urlFetch);
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.startsWith("text/html")) {
                    content = base64.fromByteArray(
                        new Uint8Array(await response.arrayBuffer())
                    );
                }
                break;
            }
        case "production":
            {
                content = await env.STATIC_CONTENT.get(path);
                break;
            }
        default:
            break;
    }

    if (!content) {
        // Not a file - render React
        return await reactHandler(config);
    } else {
        // Is a file - serve static content
        return await staticHandler(content, path);
    }
}

export function handlers(config: HandlerConfig) {
    return {
        fetch: async function (
            request: Request,
            env: Env,
            // eslint-disable-next-line
            ctx: ExecutionContext
        ): Promise<Response> {
            return await fetchHandler(request, env, config);
        },
    };
}
