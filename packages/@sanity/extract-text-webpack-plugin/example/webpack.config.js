var webpack = require("webpack");
var ExtractTextPlugin = require("../");
module.exports = {
	entry: {
		a: "./entry.js",
		b: "./entry2.js"
	},
	output: {
		filename: "[name].js?[hash]-[chunkhash]",
		chunkFilename: "[name].js?[hash]-[chunkhash]",
		path: __dirname + "/assets",
		publicPath: "/assets/"
	},
	module: {
		loaders: [
			{ test: /\.css$/, loader: ExtractTextPlugin.extract(
				"style-loader",
				"css-loader?sourceMap",
				{
					publicPath: "../"
				}
			)},
			{ test: /\.png$/, loader: "file-loader" }
		]
	},
	devtool: "source-map",
	plugins: [
		new ExtractTextPlugin("css/[name].css?[hash]-[chunkhash]-[contenthash]-[name]", {
			disable: false,
			allChunks: true
		}),
		new webpack.optimize.CommonsChunkPlugin("c", "c.js")
	]
};
