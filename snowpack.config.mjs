/** @type {import("snowpack").SnowpackUserConfig } */
export default {
    mount: {
      "public": { url: "/", static: true },
      "app": { url: "/app" },
      "worker": { url: "/worker" },
    },
    plugins: [
        "@snowpack/plugin-react-refresh", 
        "@snowpack/plugin-dotenv",
        "@snowpack/plugin-typescript",
        "../config/snowpack-plugins/relay.plugin.js",
    ],
    /* Enable an SPA Fallback in development: */
    routes: [{ "match": "routes", "src": ".*", "dest": "/index.html" }],

    optimize: {
        sourcemap: true,
        splitting: true,
        treeshake: true,
        // minify: true,
    },
    packageOptions: {
        polyfillNode: true,
    },
    devOptions: {
        output: "dashboard",
        hmrErrorOverlay: true,
        port: 3080,
        open: "none"
    },
    buildOptions: {
        out: "build/snowpack/",
        sourcemap: true
    },
};