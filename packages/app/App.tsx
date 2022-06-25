/* eslint-disable @typescript-eslint/no-misused-promises */
import * as React from "react";
import * as Relay from "react-relay";
import { graphql } from "relay-runtime";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import { relayEnvironment } from "./entry/relay.js";
import { default as logo } from "./logo.svg";
import "./App.css";

import type { AppQuery } from "./__generated__/AppQuery.graphql.js";

const query = graphql`
    query AppQuery {
        penis
    }
`;

const preloadedQuery = Relay.loadQuery<AppQuery>(relayEnvironment, query, {});

function Suspendable() {
    const data = Relay.usePreloadedQuery(query, preloadedQuery);
    const element: React.ReactElement =
        <>GraphQL says: "{data.penis}"</>;
    return element;
}

function __App() {
    // Create the count state.
    const [count, setCount] = React.useState(0);
    // Create the counter (+1 every second).
    React.useEffect(() => {
        const timer = setTimeout(() => setCount(count + 1), 1000);
        return () => clearTimeout(timer);
    }, [count, setCount]);

    const { loginWithRedirect } = useAuth0();

    // Return the App component.
    const element: React.ReactElement =
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>Edit <code>src/App.tsx</code> and save to reload.</p>
                <p>
                    <React.Suspense fallback={<>loading...</>}>
                        <Suspendable />
                    </React.Suspense>
                </p>
                <p>Page has been open for <code>{count}</code> seconds.</p>
                <button className="App-button" onClick={() => loginWithRedirect()}>
                    Log in to a penis
                </button>
            </header>
        </div>;
    return element;
}


export default function App() {
    const element: React.ReactElement =
        <Auth0Provider domain="dev-grg8a828.us.auth0.com"
            clientId="vWNnYfLE4ZyqlEh6f4iRM91WFUm7iX2J"
            redirectUri={window.location.origin}
        >
            <__App />
        </Auth0Provider >;
    return element;
}