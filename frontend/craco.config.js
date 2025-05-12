// craco.config.js
const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        util: require.resolve("util/"),
        url: require.resolve("url/"),
        crypto: require.resolve("crypto-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        assert: require.resolve("assert/"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser.js"), // <- Add `.js` extension explicitly
      };

      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.ProvidePlugin({
          process: "process/browser.js", // <- Match this as well
          Buffer: ["buffer", "Buffer"],
        }),
      ];

      return webpackConfig;
    },
  },
};
