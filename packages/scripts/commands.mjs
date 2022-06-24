
import { chalk, sleep, question } from "zx";
import { echo } from "zx/experimental";

import { log, $ } from "./zx-extended.mjs";

/**
 * @typedef Command
 * @type {object}
 * @property {(args: Record<string, string | true> | undefined) => Promise<void>} exec 
 * @property {Record<string, string | true>} options
 * @property {string} description
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
    },
    "serve": {
        exec: async function () {
            echo`${log} starting dev server`;
            const promises = [
                $`relay-compiler --watch`,
                $`cargo run --features dev`,
                $`esbuild/main --mode dev`,
            ];
            promises.map(function (promise) { promise._inheritStdin = false; });
            await sleep(100);
            echo`${log} file server: ${chalk.blue`http://localhost:3080/`}`;
            echo`${log} main server: ${chalk.magenta`http://localhost:8787/`}`;
            await question(`${log} press ${chalk.bold`enter`} to stop`, {
                choices: []
            });
            for (const promise of promises) {
                await promise.kill("SIGINT");
            }
        },
        options: {},
        description: "runs local development servers",
    },
    "package": {
        exec: async function () {
            echo`${log} building for production`;
            await $`esbuild/main --mode prod`;
        },
        options: {},
        description: "builds client and server for production",
    }
};