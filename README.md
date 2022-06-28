# seagull

## Things you need
* [NPM/Node](https://nodejs.org/en/download/)
* [Go](https://go.dev/doc/install)
* [Rust](https://www.rust-lang.org/tools/install)
* [Deno](https://deno.land/#installation)
* Do this: `sudo npm i -g yarn relay-compiler zx`
* [Watchman](https://facebook.github.io/watchman/)

Trust me don't try to be cool and skip steps. You aren't that cool. I'm cool. Listen to me.

## Things you should do

1. This: `git clone https://github.com/aegooby/seagull && cd seagull`
2. `yarn install`
3. Install Seagull: `packages/scripts/install.mjs`
4. Set Rust toolchain: `rustup default nightly-2022-06-20`
5. Compile bundler and server: `seagull compile`
6. Run: `seagull serve`
