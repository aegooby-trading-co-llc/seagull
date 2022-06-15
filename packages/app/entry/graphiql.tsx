import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
const GraphiQL = React.lazy(function () { return import("graphiql"); });
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import "graphiql/graphiql.css";

try {
    const root = document.querySelector("#graphiql");
    if (!root) {
        throw new Error("document.querySelector(): could not find root node");
    }

    const fetcher = createGraphiQLFetcher({
        url: new URL("/graphql", process.env.GRAPHQL_ENDPOINT).href
    });

    const element: React.ReactElement =
        <React.StrictMode>
            <React.Suspense>
                <GraphiQL fetcher={fetcher} />
            </React.Suspense>
        </React.StrictMode>;

    ReactDOMClient.createRoot(root).render(element);
} catch (error) {
    console.error(error);
}