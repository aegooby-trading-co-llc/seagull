import * as React from "react";
import * as Relay from "react-relay";
import { graphql } from "relay-runtime";

import { relayEnvironment } from "./relay.js";
import "./App.css";
import logo from "./logo.svg";

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

export default function App() {
    // Create the count state.
    const [count, setCount] = React.useState(0);
    // Create the counter (+1 every second).
    React.useEffect(() => {
        const timer = setTimeout(() => setCount(count + 1), 1000);
        return () => clearTimeout(timer);
    }, [count, setCount]);

    // Return the App component.
    return (
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
                <p>
                    <a
                        className="App-link"
                        href="https://reactjs.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn React
                    </a>
                </p>
            </header>
        </div>
    );
}