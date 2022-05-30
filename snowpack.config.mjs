/** @type {import("snowpack").SnowpackUserConfig } */
export default {
    mount: {
      "public": { url: "/", static: true },
      "components": { url: "/dist" },
      "worker": { url: "/build" },
    },
    plugins: [
        "@snowpack/plugin-react-refresh", 
        "@snowpack/plugin-dotenv"
    ],
    /* Enable an SPA Fallback in development: */
    routes: [{ "match": "routes", "src": ".*", "dest": "/index.html" }],
    optimize: {
      /* Example: Bundle your final build: */
      "bundle": true,
    },
    packageOptions: {
      /* ... */
    },
    devOptions: {
      /* ... */
    },
    buildOptions: {
      /* ... */
    },
  };