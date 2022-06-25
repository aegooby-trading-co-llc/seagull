import * as React from "react";
import * as Relay from "react-relay";
import * as Router from "react-router-dom";
import * as Auth0 from "@auth0/auth0-react";
import { graphql } from "relay-runtime";

import { relayEnvironment } from "./entry/relay.js";
const Index = React.lazy(() => import("./Pages/Index.jsx"));
import "./App.css";

import type { AppQuery } from "./__generated__/AppQuery.graphql.js";

const query = graphql`
    query AppQuery {
        ...IndexFragment
    }
`;

const preloadedQuery = Relay.loadQuery<AppQuery>(relayEnvironment, query, {});

function __App() {
    const data = Relay.usePreloadedQuery(query, preloadedQuery);
    const element: React.ReactElement =
        <React.Suspense fallback={<></>}>
            <Index fragmentRef={data} />
        </React.Suspense>;
    return element;
}

export default function App() {
    const element: React.ReactElement =
        <Auth0.Auth0Provider domain="dev-grg8a828.us.auth0.com"
            clientId="vWNnYfLE4ZyqlEh6f4iRM91WFUm7iX2J"
            redirectUri={window.location.origin}
        >
            <React.Suspense fallback={<></>}>
                <Router.Routes>
                    <Router.Route path="/" element={<__App />} />
                    <Router.Route path="*" element={<>NOT FOUND</>} />
                </Router.Routes>
            </React.Suspense>
        </Auth0.Auth0Provider >;
    return element;
}