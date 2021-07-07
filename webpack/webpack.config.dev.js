const webpackMerge = require("webpack-merge");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const baseConfig = require("./webpack.config.base.js");

const debugCSP = { extension_pages: "script-src 'self' http://localhost:8097; object-src 'self';" };

module.exports = webpackMerge.merge(baseConfig, {
    mode: "development",
    devtool: "inline-source-map",
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
            dev: true,
            minify: {
                collapseWhitespace: true
            }
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "./chrome", to: "./../" },
                {
                    from: "./chrome/manifest.json", to: "./../",
                    transform: function (content, path) {
                        json = JSON.parse(content.toString());
                        json["content_security_policy"] = debugCSP;
                        return JSON.stringify(json);
                    },
                    force: true,
                    priority: 1
                }
            ]
        })
    ]
});
