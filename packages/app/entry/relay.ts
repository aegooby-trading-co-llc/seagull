import * as RelayRuntime from "relay-runtime";

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
    return await response.json() as RelayRuntime.GraphQLResponse;
}

export const relayEnvironment = new RelayRuntime.Environment({
    network: RelayRuntime.Network.create(fetchRelay, undefined),
    store: new RelayRuntime.Store(new RelayRuntime.RecordSource()),
    configName: "Environment",
});
