#!/usr/bin/env zx

import { $, quiet } from "zx";

await quiet($`mkdir -p ~/.local/bin/`);
await quiet($`cp "packages/scripts/shell.mjs" ~/.local/bin/lobster`)
await quiet($`chmod u+x ~/.local/bin/lobster`)
