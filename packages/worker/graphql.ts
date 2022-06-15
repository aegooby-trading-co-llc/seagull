import * as ReactDOMServer from "react-dom/server";
import * as graphql from "graphql";

import { GraphiQLTemplate } from "./html/graphiql.jsx";
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

export async function getHandler(env: Env): Promise<Response> {
    const element = GraphiQLTemplate();
    const stream = await ReactDOMServer.renderToReadableStream(element);
    return new Response(stream, {
        status: 200,
        headers: { "content-type": "text/html;charset=UTF-8" }
    });
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
        return new Response(JSON.stringify(result), {
            status: 200,
        });
    }
    catch (error) {
        return new Response(JSON.stringify(error), {
            status: 500,
        });
    }
}
