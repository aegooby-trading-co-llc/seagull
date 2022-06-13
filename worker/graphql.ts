import * as graphql from "graphql";
import type { Env } from "./handlers.js";

interface GraphQLRequest {
    query: string,
    operationName?: string | undefined,
    variables?: Record<string, unknown> | undefined,
}

const schema = graphql.buildSchema("type Query { penis: String }");
const rootValue = {
    penis: function () {
        return 'penile world';
    },
};

export async function getHandler(request: Request, env: Env): Promise<Response> {
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

export async function postHandler(request: Request, env: Env): Promise<Response> {
    try {
        const body: GraphQLRequest = await request.json();
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
