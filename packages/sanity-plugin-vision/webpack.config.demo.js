/* eslint-disable no-process-env */
const webpack = require('webpack')
const path = require('path')

const config = {
  entry: path.join(__dirname, 'demo', 'js', 'demo.js'),
  output: {
    path: path.join(__dirname, 'demo', 'js'),
    filename: 'demo.min.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ]
}

if (process.env.NODE_ENV !== 'production') {
  config.cache = true
  config.devtool = 'source-map'
}

module.exports = config
