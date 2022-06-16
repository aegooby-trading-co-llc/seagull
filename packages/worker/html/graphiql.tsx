import * as React from "react";

export function GraphiQLTemplate(): React.ReactElement {
    const element =
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no"
                />

                <meta name="description" content="" />

                <link rel="stylesheet" href="/packages/app/entry/graphiql.css" />
                <noscript>You need to enable JavaScript to run this app.</noscript>
                <script>let global = globalThis;</script>
                <script type="module" src="/packages/app/entry/graphiql.js"></script>

                <title>GraphiQL</title>
            </head>
            <body style={{
                margin: 0, padding: 0, minHeight: "100vh", overflow: "hidden"
            }}>
                <div id="graphiql" style={{ height: "100vh" }}></div>
            </body>
        </html>;
    return element;
}

