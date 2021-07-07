const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

__dirname = process.cwd();

module.exports = {
    entry: {
        app: path.resolve(__dirname, "./src/index.jsx"),
    },
    resolve: {
        modules: [
            path.resolve(__dirname, "node_modules"),
            path.resolve("./src")
        ],
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: path.resolve(__dirname, "src"),
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                    minified: true,
                    compact: true,
                    targets: { "chrome": 77 },
                }
            },
            {
                test: /\.scss$/,
                include: path.resolve(__dirname, "src"),
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            },
            {
                test: /\.css$/,
                include: path.resolve(__dirname, "src"),
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                include: path.resolve(__dirname, "src"),
                type: "asset/resource",
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin()
    ],
    output: {
        path: path.resolve(__dirname, "./build/app"),
        filename: "[name].bundle.js",
    }
}
