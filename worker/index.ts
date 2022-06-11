import * as mime from "mime";
import * as ReactDOMServer from 'react-dom/server';
import * as base64 from "base64-js";
import * as graphql from "graphql";
import { csrElement, ssrElement } from "./index.html.jsx";
import type React from "react";

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

const schema = graphql.buildSchema("type Query { penis: String }");
const rootValue = {
    penis: function () {
        return 'penile world';
    },
};

interface GraphQLRequest {
    query: string,
    operationName: string,
    variables: Record<string, string>,
}

async function postHandler(request: Request, env: Env): Promise<Response> {
    try {
        // eslint-disable-next-line
        const body = await request.json() as GraphQLRequest;
        const source = body.query;
        const operationName = body.operationName;
        const variableValues = body.variables;
        const result = await graphql.graphql({
            schema, source, rootValue, operationName, variableValues
        });
        return new Response(JSON.stringify(result.data), {
            status: 200,
        });
    }
    catch (error) {
        return new Response(JSON.stringify(error), {
            status: 500,
        });
    }

}

async function getHandler(request: Request, env: Env): Promise<Response> {
    const params = new URLSearchParams(new URL(request.url).search);
    try {
        const source = params.get("query");
        if (!source) {
            return new Response("You idiot there's no query", {
                status: 403,
            });
        }
        const result = await graphql.graphql({ schema, source, rootValue });
        return new Response(JSON.stringify(result.data), {
            status: 200,
        });
    }
    catch (error) {
        return new Response(JSON.stringify(error), {
            status: 500,
        });
    }

}


async function graphqlHandler(request: Request, env: Env): Promise<Response> {
    if (request.method == "GET") {
        return await getHandler(request, env);
    }
    else if (request.method == "POST") {
        return await postHandler(request, env);
    }
    else {
        return new Response("???", { status: 405 });
    }
}


async function route(request: Request, env: Env): Promise<Response> {
    const path = stripHash(new URL(request.url).pathname);
    if (path.includes("graphql")) {
        return await graphqlHandler(request, env);
    }

    let content = null as string | null;
    let element = null as React.ReactElement | null;
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
                element = csrElement;
                break;
            }
        case "production":
            {
                content = await env.STATIC_CONTENT.get(path);
                element = ssrElement;
                break;
            }
        default:

    }

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
