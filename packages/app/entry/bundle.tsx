
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import * as Router from "react-router-dom";
import * as Helmet from "react-helmet-async";

import { default as Root } from "./Root.jsx";
import "../styles.css";

try {
    const root = document.querySelector("#root");
    if (!root) {
        throw new Error("document.querySelector(): could not find root node");
    }

    const element: React.ReactElement =
        <Router.BrowserRouter>
            <Helmet.HelmetProvider>
                <Root />
            </Helmet.HelmetProvider>
        </Router.BrowserRouter>;

    ReactDOMClient.createRoot(root).render(element);

    // @todo: SSR?
    // switch (process.env.NODE_ENV) {
    //     case "development":
    //         ReactDOMClient.createRoot(root).render(element);
    //         break;
    //     case "production":
    //         ReactDOMClient.hydrateRoot(root, element);
    //         break;
    //     default:
    //         break;
    // }
} catch (error) {
    console.error(error);
}
