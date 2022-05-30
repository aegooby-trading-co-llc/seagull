
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";

try {
    const element: React.ReactElement =
        <React.StrictMode>
            <App />
        </React.StrictMode>;
    ReactDOM.render(
        element,
        document.querySelector("#root"),
    );
} catch (error) {
    console.error(error);
}

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://snowpack.dev/concepts/hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}