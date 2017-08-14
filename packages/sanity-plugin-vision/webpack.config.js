/* eslint-disable no-process-env */
const webpack = require('webpack')
const pkg = require('./package.json')

const config = {
  entry: pkg.main,
  output: {
    library: 'SanityVision',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },
  externals: {
    react: {
      root: 'React',
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react'
    }
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
