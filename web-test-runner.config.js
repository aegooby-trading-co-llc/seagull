process.env.NODE_ENV = "test";

module.exports = {
  // @ts-ignore
  plugins: [require("@snowpack/web-test-runner-plugin")()],
};