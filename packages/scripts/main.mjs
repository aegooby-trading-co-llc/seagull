import { argv, chalk, echo } from "zx";
import { commands } from "./commands.mjs";
import { error, success } from "./zx-extended.mjs";

export async function main() {
    if (Object.keys(commands).includes(argv._[1])) {
        const startTime = Date.now();
        const command = commands[argv._[1]];
        /** @type {Record<string, string>} */
        for (const key of Object.keys(argv)) {
            if (!["_", "--"].includes(key) && !command.options[key]) {
                echo`${error} invalid option "${key}"`
                return;
            }
        }
        await command.exec(argv);
        const endTime = Date.now();
        echo`${success} ${endTime - startTime}ms`
    } else {
        echo`${error} you did that wrong`;
        echo``;
        echo`usage:`;
            echo`  ${argv._[0]} [command]`;
            echo`  ${argv._[0]} [command] --help`;
            echo`  ${argv._[0]} [command] --version`;
            echo``;
            echo`commands:`;
            for (const key of Object.keys(commands)) {
                echo`  * ${key}: ${chalk.dim(commands[key].description)}`;
            }
    }
}