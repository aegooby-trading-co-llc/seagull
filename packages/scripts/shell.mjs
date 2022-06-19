#!/usr/bin/env zx
/* eslint-disable */
// @ts-nocheck

try {
    const file = await fs.readFile("package.json");
    const packageJson = JSON.parse(file.toString());
    if (packageJson.seagull) {
        const pwd = (await quiet($`pwd`)).stdout.trim();
        const Main = await import(path.join(pwd, packageJson.seagull));
        await Main.main();
    } else {
        throw new Error("no \"seagull\" key in package.json")
    }
} catch (error) {
    console.log(`${chalk.bold.red("[!]")} ${error}`);
}
