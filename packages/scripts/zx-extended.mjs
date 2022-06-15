
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { $ as zx$, chalk, ProcessPromise, quiet } from "zx";
import { echo } from "zx/experimental";

zx$.shell = "/bin/sh";
zx$.verbose = 1;

export const log = chalk.bold.blue`[*]`;
export const error = chalk.bold.red`[!]`;
export const warn = chalk.bold.yellow`[?]`;
export const success = chalk.bold.green`[$]`;

/**
 * 
 * @param {TemplateStringsArray} pieces 
 * @param  {...unknown} args 
 * @returns {ProcessPromise}
 */
export function $(pieces, ...args) {
    // @todo: double check
    const command = pieces.join("") + args.join("");
    const split = command.split(" ");
    if (split.length > 0) {
        split[0] = chalk.cyan(split[0]);
    }
    echo`${chalk.dim.italic(`$ ${split.join(" ")}`)}`
    return quiet(zx$(pieces, ...args))
}
