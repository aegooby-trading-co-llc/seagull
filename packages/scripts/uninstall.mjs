#!/usr/bin/env zx

import { $, quiet } from "zx";

await quiet($`rm -rf ~/.local/bin/lobster`);
