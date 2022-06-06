import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

try {
    const root = document.querySelector("#root");
    if (!root) {
        throw new Error("document.querySelector(): could not find root node");
    }
    const element: React.ReactElement =
        <React.StrictMode>
            <App />
        </React.StrictMode>;
    switch (import.meta.env.MODE) {
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

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://snowpack.dev/concepts/hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}