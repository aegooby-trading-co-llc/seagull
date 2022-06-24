import * as React from "react";
import * as Relay from "react-relay";

import { relayEnvironment } from "./relay.js";
import { default as App } from "../App.jsx";

export default function Root(): React.ReactElement {
    const element: React.ReactElement =
        <React.StrictMode>
            <Relay.RelayEnvironmentProvider environment={relayEnvironment}>
                <App />
            </Relay.RelayEnvironmentProvider>
        </React.StrictMode>;
    return element;
}