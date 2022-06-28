
import { $, chalk, sleep, echo, fetch } from "zx";

import { error, log } from "./zx-extended.mjs";

/**
 * @typedef Command
 * @type {object}
 * @property {(args: Record<string, string | true> | undefined) => Promise<void>} exec 
 * @property {Record<string, string | true>} options
 * @property {string} description
 * @property {boolean} verbose
 */

/**
 * @type {Record<string, Command>}
 */
export const commands = {
    "compile": {
        exec: async function () {
            echo`${log} compiling artifacts`;
            await $`go build -o esbuild/main esbuild/main.go`;
            await $`cargo build --features dev`;
            await $`cargo build --features prod`;
        },
        options: {},
        description: "compiles things that can be compiled",
        verbose: true,
    },
    "serve": {
        exec: async function (args) {
            if (!args || !(args.dev || args.prod)) {
                echo`${error} requires argument '--dev' or '--prod'`
                return;
            }
            if (args.dev) {
                echo`${log} starting dev server`;
                const promises = [
                    $`relay-compiler --watch`,
                    $`cargo run --features dev`,
                    $`esbuild/main --mode dev`,
                ];
                await sleep(100);
                echo`${log} file server: ${chalk.blue`http://localhost:3080/`}`;
                echo`${log} main server: ${chalk.magenta`http://localhost:8787/`}`;
                await Promise.all(promises);
            }
            if (args.prod) {
                echo`${log} starting prod server`;
                const cargo = $`cargo run --features prod`;
                for (;;) {
                    try { 
                        const response = await fetch(
                            "http://localhost:8787/graphql", {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json"
                                },
                                body: JSON.stringify({
                                    query: "query{__schema{__typename}}",
                                    variables: null
                                })
                            }
                        );
                        if (response.status == 200) {
                            break;
                        }
                    } catch { undefined; }
                    await sleep(500);
                }
                const deno = 
                    $`deno run --unstable --allow-all packages/server/embedded/index.deno.ts`;
                await sleep(100);
                echo`${log} ssr server: ${chalk.blue`http://localhost:3737/`}`;
                echo`${log} main server: ${chalk.magenta`http://localhost:8787/`}`;
                await Promise.all([deno, cargo]);
            }
        },
        options: {
            dev: true,
            prod: true,
        },
        description: "runs local development servers",
        verbose: false,
    },
    "bundle": {
        exec: async function () {
            echo`${log} building for production`;
            await $`esbuild/main --mode prod`;
            await $`cp public/** build`;
        },
        options: {},
        description: "builds client and server for production",
        verbose: true,
    }
};