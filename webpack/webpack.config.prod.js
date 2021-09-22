const webpackMerge = require("webpack-merge");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const baseConfig = require("./webpack.config.base.js");

module.exports = webpackMerge.merge(baseConfig, {
    mode: "production",
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
            dev: false,
            minify: {
                collapseWhitespace: true
            }
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "./chrome", to: "./../" },
                { from: "LICENSE", to: "./../" }
            ]
        })
    ]
});
