
import { chalk, sleep, question } from "zx";
import { echo } from "zx/experimental";

import { log, success, $ } from "./lib.mjs";

/**
 * @typedef Command
 * @type {object}
 * @property {(args: Record<string, string> | undefined) => Promise<void>} exec 
 * @property {Record<string, string>} options
 */

/**
 * @type {Record<string, Command>}
 */
 export const commands = {
    "compile": {
        exec: async function () {
            echo`${log} compiling Go`
            await $`go build -o esbuild/main esbuild/main.go`;
            echo`${success}`
        },
        options: {}
    },
    "serve": {
        exec: async function () {
            echo`${log} starting dev server`
            const promises = [
                $`relay-compiler --watch`,
                $`wrangler dev --env dev --local`,
                $`esbuild/main --mode dev`,
            ];
            promises.map(function (promise) { promise._inheritStdin = false })
            await sleep(100);
            echo`${log} file server: ${chalk.blue`http://localhost:3080/`}`;
            echo`${log} main server: ${chalk.magenta`http://localhost:8787/`}`;
            await question(`${log} press ${chalk.bold`enter`} to stop`, {
                choices: []
            });
            for (const promise of promises) {
                await promise.kill("SIGINT");
            }
            echo`${success}`
        },
        options: {}
    },
    "package": {
        exec: async function () {
            echo`${log} building for production`
            await $`esbuild/main --mode prod`;
            await $`wrangler publish --env prod --dry-run --outdir=build/wrangler`;
            echo`${success}`
        },
        options: {}
    }
}