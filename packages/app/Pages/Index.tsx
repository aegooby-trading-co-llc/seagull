import * as React from "react";
import * as Relay from "react-relay";
import * as Auth0 from "@auth0/auth0-react";
import { graphql } from "relay-runtime";

import { default as logo } from "./logo.svg";

import type { IndexFragment$key } from "./__generated__/IndexFragment.graphql.js";

const fragment = graphql`
    fragment IndexFragment on Query {
        penis
    }
`;

interface SuspendableProps {
    fragmentRef: IndexFragment$key,
}

function Suspendable(props: SuspendableProps) {
    const data = Relay.useFragment<IndexFragment$key>(fragment, props.fragmentRef);
    const element: React.ReactElement =
        <>GraphQL says: "{data.penis}"</>;
    return element;
}

interface IndexProps {
    fragmentRef: IndexFragment$key,
}

export default function Index(props: IndexProps) {
    // Create the count state.
    const [count, setCount] = React.useState(0);
    // Create the counter (+1 every second).
    React.useEffect(() => {
        const timer = setTimeout(() => setCount(count + 1), 1000);
        return () => clearTimeout(timer);
    }, [count, setCount]);

    const { loginWithRedirect } = Auth0.useAuth0();

    // Return the App component.
    const element: React.ReactElement =
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>Edit <code>src/App.tsx</code> and save to reload.</p>
                <p>
                    <React.Suspense fallback={<>loading...</>}>
                        <Suspendable fragmentRef={props.fragmentRef} />
                    </React.Suspense>
                </p>
                <p>Page has been open for <code>{count}</code> seconds.</p>
                <button className="App-button" onClick={
                    function () {
                        loginWithRedirect().catch(function (error) {
                            console.error(error);
                        });
                    }
                }>
                    Log in to a penis
                </button>
            </header>
        </div>;
    return element;
}
