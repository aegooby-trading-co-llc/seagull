#!/usr/bin/env zx

import { $, argv, chalk } from "zx";
import { echo } from "zx/experimental";

$.shell = "/bin/sh";
$.verbose = 1;

const commands = {
    compile: {}
}

if (Object.keys(commands).includes(argv._[1])) {
    //
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
