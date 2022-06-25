#!/usr/bin/env zx

import { $ } from "zx";

$.verbose = false;

await $`rm -rf ~/.local/bin/seagull`;
