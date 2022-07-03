
import { $, chalk, sleep, echo } from "zx";

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
            await $`go build -o esbuild/esbundler esbuild/main.go`;
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
                    $`esbuild/esbundler --mode dev`,
                ];
                await sleep(100);
                echo`${log} file server: ${chalk.blue`http://localhost:3080/`}`;
                echo`${log} main server: ${chalk.magenta`http://localhost:8787/`}`;
                await Promise.all(promises);
            }
            if (args.prod) {
                echo`${log} starting prod server`;
                const promise = $`cargo run --features prod`;
                await sleep(100);
                echo`${log} ${chalk.magenta`http://localhost:8787/`}`;
                await promise;
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
            await $`esbuild/esbundler --mode prod`;
            await $`cp public/** build`;
        },
        options: {},
        description: "builds client and server for production",
        verbose: true,
    }
};