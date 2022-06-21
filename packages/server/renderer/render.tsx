import * as React from "react";
import * as ReactDOMServer from "react-dom/server";

import { default as App } from "@seagull/app/App.jsx";

export async function render() {
    return await ReactDOMServer.renderToReadableStream(<App />);
}
