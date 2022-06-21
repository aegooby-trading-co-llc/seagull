import * as React from "react";

export default function Suspense(props: React.SuspenseProps) {
    /* eslint-disable-next-line */
    /* @ts-ignore */
    switch (typeof Deno) {
        case "undefined":
            return <React.Suspense fallback={props.fallback}>
                {props.children}
            </React.Suspense>;
        default:
            return <>{props.fallback}</>;
    }
}
