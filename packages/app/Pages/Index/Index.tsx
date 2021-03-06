import * as React from "react";
import * as Relay from "react-relay";
import * as Auth0 from "@auth0/auth0-react";
import { graphql } from "relay-runtime";

import { default as logo } from "./logo.svg";

import type { IndexFragment$key } from "./__generated__/IndexFragment.graphql.js";
import "./Index.css";

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

function TokenInfo() {
    const {
        getAccessTokenSilently, isLoading
    } = Auth0.useAuth0();

    const [token, setToken] = React.useState(null as string | null);
    React.useEffect(function () {
        (async () => {
            const accessToken = await getAccessTokenSilently({});
            setToken(accessToken);
        })().catch(function (error) { console.error(error); });
    });

    return isLoading ? <>loading again</> : <>{token}</>;
}

function LoginButton() {
    const {
        loginWithRedirect, isLoading, isAuthenticated
    } = Auth0.useAuth0();

    const element: React.ReactElement =
        <button className="Index-button" onClick={
            function () {
                loginWithRedirect().catch(function (error) {
                    console.error(error);
                });
            }
        }>
            Log in to a penis
        </button>;

    return isLoading ? <>loading</> : (isAuthenticated ? <TokenInfo /> : element);
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

    // Return the Index component.
    const element: React.ReactElement =
        <div className="Index">
            <header className="Index-header">
                <img src={logo} className="Index-logo" alt="logo" />
                <p>Edit <code>src/Index.tsx</code> and save to reload.</p>
                <p>
                    <React.Suspense fallback={<>loading...</>}>
                        <Suspendable fragmentRef={props.fragmentRef} />
                    </React.Suspense>
                </p>
                <p>Page has been open for <code>{count}</code> seconds.</p>
                <LoginButton />
            </header>
        </div>;
    return element;
}
