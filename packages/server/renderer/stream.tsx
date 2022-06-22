// deno-lint-ignore-file

import * as React from "react";
import * as ReactDOMServer from "react-dom/server";

import { default as App } from "@seagull/app/App.jsx";

const element: React.ReactElement =
    <html lang="en">

        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />

            <meta name="description" content="" />

            <link rel="icon" href="/public/favicon.ico" />
            <link rel="stylesheet" href="/packages/app/entry/bundle.css" />

            <noscript>You need to enable JavaScript to run this app.</noscript>
            <script type="module" src="/packages/app/entry/bundle.js"></script>

            <title>seagull</title>
        </head>

        <body>
            <div id="root">
                <App />
            </div>
        </body>

    </html>;

export async function renderStream() {
    return await ReactDOMServer.renderToReadableStream(element);
}
