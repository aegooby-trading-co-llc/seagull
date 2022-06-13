import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import * as RelayRuntime from "relay-runtime";
import * as Relay from "react-relay/hooks";

import App from "./App.jsx";
import "./styles.css";

async function fetchRelay(
    request: RelayRuntime.RequestParameters,
    variables: RelayRuntime.Variables,
    // cacheConfig: Relay.CacheConfig,
    // uploadables?: Relay.UploadableMap | null)
): Promise<RelayRuntime.GraphQLResponse> {
    if (!process.env.GRAPHQL_ENDPOINT) {
        throw new Error("Variable GRAPHQL_ENDPOINT was not found");
    }
    const url = new URL("/graphql", process.env.GRAPHQL_ENDPOINT);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            query: request.text,
            variables: variables,
        })
    });
    return await response.json();
}

try {
    const root = document.querySelector("#root");
    if (!root) {
        throw new Error("document.querySelector(): could not find root node");
    }

    const relayEnvironment = new RelayRuntime.Environment({
        network: RelayRuntime.Network.create(fetchRelay),
        store: new RelayRuntime.Store(new RelayRuntime.RecordSource()),
        configName: "Environment",
    });

    const element: React.ReactElement =
        <React.StrictMode>
            <Relay.RelayEnvironmentProvider environment={relayEnvironment}>
                <App />
            </Relay.RelayEnvironmentProvider>
        </React.StrictMode>;
    switch (process.env.NODE_ENV) {
        case "development":
            ReactDOMClient.createRoot(root).render(element);
            break;
        case "production":
            ReactDOMClient.hydrateRoot(root, element);
            break;
        default:
            break;
    }
} catch (error) {
    console.error(error);
}
