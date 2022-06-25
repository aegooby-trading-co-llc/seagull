
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { $ as zx$, chalk, ProcessPromise, echo } from "zx";
import { log as logFn } from "./log.mjs";

zx$.shell = "/bin/sh";
zx$.log = logFn;

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
    zx$.verbose = false;
    const command = pieces.join("") + args.join("");
    const split = command.split(" ");
    if (split.length > 0) {
        split[0] = chalk.cyan(split[0]);
    }
    echo`${chalk.dim.italic(`$ ${split.join(" ")}`)}`;
    return zx$(pieces, ...args);
}

/**
 * 
 * @param {TemplateStringsArray} pieces 
 * @param  {...unknown} args 
 * @returns {ProcessPromise}
 */
 export function $$(pieces, ...args) {
    // @todo: double check
    zx$.verbose = true;
    const command = pieces.join("") + args.join("");
    const split = command.split(" ");
    if (split.length > 0) {
        split[0] = chalk.cyan(split[0]);
    }
    echo`${chalk.dim.italic(`$ ${split.join(" ")}`)}`
    return zx$(pieces, ...args)
}

