import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import * as Relay from "react-relay";

import { relayEnvironment } from "./relay.js";
import App from "./App.jsx";
import "./styles.css";

try {
    const root = document.querySelector("#root");
    if (!root) {
        throw new Error("document.querySelector(): could not find root node");
    }

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
