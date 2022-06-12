import * as React from "react";

interface Props {
    element: React.ReactElement | null;
}
export function HTMLTemplate(props: Props): React.ReactElement {
    const element: React.ReactElement =
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />

                <meta name="description" content="" />

                <link rel="icon" href="/public/favicon.ico" />
                <link rel="stylesheet" href="/app/index.css" />
                <noscript>You need to enable JavaScript to run this app.</noscript>
                <script>let global = globalThis;</script>
                <script type="module" src="/app/index.js"></script>

                <title>lobster</title>
            </head>
            <body>
                <div id="root">
                    {props.element}
                </div>
            </body>
        </html>;
    return element;
}
