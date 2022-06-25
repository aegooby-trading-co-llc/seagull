#!/usr/bin/env zx

import { $ } from "zx";

$.verbose = false;

await $`mkdir -p ~/.local/bin/`;
await $`cp "packages/scripts/shell.mjs" ~/.local/bin/seagull`;
await $`chmod u+x ~/.local/bin/seagull`;
