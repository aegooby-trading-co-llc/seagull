import * as React from "react";
import { App } from "../app/App.jsx";

export const element: React.ReactElement =
    <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <link rel="icon" href="/favicon.ico" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
            />
            <meta name="description" content="" />
            <title>lobster</title>
        </head>
        <body>
            <div id="root">
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            </div>
            <noscript>You need to enable JavaScript to run this app.</noscript>
            <script type="module" src="/app/index.js"></script>
        </body>
    </html>;