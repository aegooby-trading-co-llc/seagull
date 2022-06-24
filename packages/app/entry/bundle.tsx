
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";

import { default as Root } from "./Root.jsx";
import "../styles.css";

try {
    const root = document.querySelector("#root");
    if (!root) {
        throw new Error("document.querySelector(): could not find root node");
    }

    switch (process.env.NODE_ENV) {
        case "development":
            ReactDOMClient.createRoot(root).render(<Root />);
            break;
        case "production":
            ReactDOMClient.hydrateRoot(root, <Root />);
            break;
        default:
            break;
    }
} catch (error) {
    console.error(error);
}
