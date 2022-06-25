// deno-lint-ignore-file

import * as React from "react";
import * as ReactDOMServer from "react-dom/server";

import { default as Root } from "@seagull/app/entry/Root.jsx";

async function __renderStream(
    element: React.ReactElement, controller: AbortController
) {
    const stream =
        await ReactDOMServer.renderToReadableStream(element, {
            signal: controller.signal,
            onError: function (error) {
                // eslint-disable-next-line
                console.error(`renderStream(): ${error}`);
            }
        });
    await stream.allReady;
    return stream;
}

const rootElement: React.ReactElement =
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
                <Root />
            </div>
        </body>

    </html>;

export async function renderStream(controller: AbortController) {
    return await __renderStream(rootElement, controller);
}

const testElement: React.ReactElement =
    <html>
        <head></head>
        <body>
            <div id="root">
                <p>Test.</p>
            </div>
        </body>
    </html>;

export async function renderStreamTest(controller: AbortController) {
    return await __renderStream(testElement, controller);
}
