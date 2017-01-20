var ExtractTextPlugin = require("../../../");
module.exports = {
  entry: "./index.js",
  module: {
    loaders: [{
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style', 'css?modules')
    }]
  },
  plugins: [
    new ExtractTextPlugin('file.css', {
      ignoreOrder: true
    })
  ]
}
