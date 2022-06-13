#!/usr/bin/env zx

import { argv, chalk } from "zx";
import { echo } from "zx/experimental";
import { commands } from "./commands.mjs";

export async function main() {
    if (Object.keys(commands).includes(argv._[1])) {
        const command = commands[argv._[1]];
        /** @type {Record<string, string>} */
        for (const key of Object.keys(argv)) {
            if (key !== "_" && key !== "--" && !command.options[key]) {
                echo`$ ${chalk.red.bold`error`}: invalid option "--${key}"`
                return;
            }
        }
        await command.exec(argv);
    } else {
        echo`Usage:`;
            echo`  ${argv._[0]} [command]`;
            echo`  ${argv._[0]} [command] --help`;
            echo`  ${argv._[0]} [command] --version`;
            echo``;
            echo`Commands:`;
            for (const key of Object.keys(commands)) {
                echo`  ${key}`;
            }
    }
}

await main();
