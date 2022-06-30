import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import * as RouterServer from "react-router-dom/server";
import * as Helmet from "react-helmet-async";

import { default as Root } from "@seagull/app/entry/Root.jsx";

async function __renderStream(
    element: React.ReactElement, controller: AbortController, allReady: boolean
) {
    let err = null as null | unknown;
    const stream =
        await ReactDOMServer.renderToReadableStream(element, {
            signal: controller.signal,
            onError: function (error) {
                // eslint-disable-next-line
                // console.error(`renderStream(): ${error}`);
                err = error;
            }
        });
    if (allReady) {
        await stream.allReady;
    }
    if (err) {
        throw err;
    }
    return stream;
}
interface Props {
    location: string | Partial<Location>,
    helmetState: Helmet.HelmetServerState,
}
function WrappedRoot(props: Props) {
    const element: React.ReactElement =
        <RouterServer.StaticRouter location={props.location}>
            <Helmet.HelmetProvider context={props.helmetState}>
                <Root />
            </Helmet.HelmetProvider>
        </RouterServer.StaticRouter>;
    return element;
}

function Page(props: Props) {
    const element: React.ReactElement =
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                <link rel="icon" href="/favicon.ico" />
                <link rel="stylesheet" href="/packages/app/entry/bundle.css" />

                <noscript>You need to enable JavaScript to run this app.</noscript>
                <script type="module" src="/packages/app/entry/bundle.js"></script>
                <>
                    {props.helmetState.title.toComponent()}
                    {props.helmetState.link.toComponent()}
                    {props.helmetState.meta.toComponent()}
                    {props.helmetState.noscript.toComponent()}
                    {props.helmetState.style.toComponent()}
                </>
            </head>
            <body>
                <div id="root">
                    <WrappedRoot
                        location={props.location}
                        helmetState={props.helmetState}
                    />
                </div>
            </body>
        </html>;
    return element;
}

/**
 * Server-side renders a React page into a readable stream.
 * @param controller AbortController
 * @param location URL that the user is currently on
 * @returns Rendered stream of React page.
 */
export async function renderStream(
    controller: AbortController, location: string | Partial<Location>
) {
    const helmetState = {} as unknown;
    ReactDOMServer.renderToString(<WrappedRoot
        location={location}
        helmetState={helmetState as Helmet.HelmetServerState}
    />);
    const renderedHelmetState = (
        helmetState as { helmet: Helmet.HelmetServerState; }
    ).helmet;
    const stream = await __renderStream(
        <Page location={location} helmetState={renderedHelmetState} />,
        controller,
        true
    );
    return stream;
}
