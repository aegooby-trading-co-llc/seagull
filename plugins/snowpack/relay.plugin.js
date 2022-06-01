const babel = require("@babel/core");

/**
 * @typedef TransformOptions
 * @type {object}
 * @property {string} id
 * @property {string} srcPath
 * @property {string} fileExt
 * @property {string | unknown} contents
 * @property {boolean} isDev
 * @property {boolean} isHmrEnabled
 * @property {boolean} isSSR
 * @property {boolean} isPackage
 */

/**
 * Transforms input files for Relay.
 * 
 * @param {unknown} _snowpackConfig 
 * @param {unknown} _pluginOptions 
 * @returns {Record<string, unknown>}
 */
const relayPlugin = function (_snowpackConfig, _pluginOptions) {
    return {
        name: "@snowpack/plugin-relay",
        /**
         * 
         * @param {TransformOptions} options 
         * @returns {Promise<number | undefined>}
         */
        async transform(options) {
            switch (options.fileExt) {
                case ".js": case ".mjs":
                    break;
                default:
                    return;
            }
            if (options.isPackage)
                return;

            const transformOptions = {
                filename: options.id,
                ast: true,
                plugins: [
                    ["babel-plugin-relay", { eagerESModules: true }],
                    ["babel-plugin-transform-commonjs"],
                    ["@babel/plugin-proposal-class-properties"],
                    ["@babel/plugin-transform-runtime"]
                ],
            };
            const transformResult = 
                await babel.transformAsync(options.contents, transformOptions);
            const transformAstOptions = {
                plugins: [
                    function relayPluginTransformAst() {
                        return {
                            visitor: {
                                /**
                                 * Parses import declarations.
                                 * @param {*} path 
                                 */
                                ImportDeclaration(path) {
                                    const sources = [
                                        "relay-runtime",
                                        "react-relay",
                                        "react-relay/hooks"
                                    ]
                                    if (sources.includes(path.node.source.value)) {
                                        /**
                                         * Filters out non-`{ graphql }` imports
                                         * @param {*} specifier 
                                         * @returns {boolean}
                                         */
                                        const filter = function (specifier) {
                                            return !specifier.imported ||
                                                specifier.imported.name !== "graphql";
                                        }
                                        path.node.specifiers = 
                                            path.node.specifiers.filter(filter);
                                        if (!(path.node.specifiers.length > 0))
                                            path.remove();
                                    }
                                },
                                /**
                                 * Parses export default declarations.
                                 * @param {*} path 
                                 */
                                ExportDefaultDeclaration(path) {
                                    const declaration = path.node.declaration;
                                    if (declaration.object && 
                                        declaration.object.name === "module" &&
                                        declaration.property &&
                                        declaration.property.name === "exports")
                                        path.remove();
                                }
                            },
                        };
                    },
                ],
            }
            const transformAstResult = 
                await babel.transformFromAstAsync(transformResult.ast, undefined, transformAstOptions);
            return transformAstResult.code;
        }
    };
}

module.exports = relayPlugin;