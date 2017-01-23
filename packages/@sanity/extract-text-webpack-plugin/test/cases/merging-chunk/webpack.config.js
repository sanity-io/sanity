var ExtractTextPlugin = require("../../../");
module.exports = {
	entry: "./index",
	plugins: [
		new ExtractTextPlugin("file.css", {
			allChunks: true
		})
	]
};
