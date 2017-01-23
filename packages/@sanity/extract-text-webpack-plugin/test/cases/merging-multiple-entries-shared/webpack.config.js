var ExtractTextPlugin = require("../../../");
module.exports = {
	entry: {
		a: "./a",
		b: "./b"
	},
	plugins: [
		new ExtractTextPlugin("[name].txt", {
			allChunks: true
		})
	]
};
