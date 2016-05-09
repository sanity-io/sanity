import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import RoleResolverPlugin from '@sanity/plugin-loader'
import postcssUse from 'postcss-use'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import simpleVarsAsync from 'postcss-simple-vars-async'
import getStyleVariables from '../getStyleVariables'

// Webpack 2 vs 1
const OccurrenceOrderPlugin = webpack.optimize.OccurrenceOrderPlugin || webpack.optimize.OccurenceOrderPlugin

const roleLoaderPath = require.resolve('@sanity/plugin-loader/src/roleLoader')

export default (config = {}) => {
  const basePath = config.basePath || process.cwd()
  const babelConfig = tryRead(path.join(basePath, '.babelrc'))
  const env = config.env || 'development'
  const resolvePaths = [
    path.resolve(basePath),
    path.resolve(path.join(basePath, 'node_modules'))
  ]

  const cssLoader = env === 'production'
    ? 'css-loader?modules&localIdentName=[name]_[local]_[hash:base64:5]&importLoaders=1'
    : 'css-loader?modules&localIdentName=[path]_[name]_[local]_[hash:base64:5]&importLoaders=1'

  return {
    entry: {
      app: path.join(__dirname, '..', 'browser', 'entry'),
      vendor: ['react', 'react-dom']
    },
    output: {
      path: config.outputPath || path.join(__dirname, '..', '..', 'dist'),
      filename: '[name].bundle.js',
      publicPath: '/static/'
    },
    resolve: {
      modules: resolvePaths, // Webpack 2
      root: resolvePaths // Webpack 1
    },
    resolveLoader: { // Webpack 1
      root: resolvePaths
    },
    module: {
      loaders: [{
        test: /\.jsx?/,
        exclude: modulePath => (
          modulePath.indexOf('/node_modules/') >= 0
          && modulePath.indexOf('?sanityRole=all%3A') === -1
        ),
        loader: 'babel',
        query: babelConfig || {
          presets: [
            require.resolve('babel-preset-react'),
            require.resolve('babel-preset-es2015')
          ],
          cacheDirectory: true
        }
      }, {
        test: /\.json$/,
        loader: 'json'
      }, {
        test: /\.css(\?|$)/,
        loaders: env === 'production'
          ? [ExtractTextPlugin.extract('style-loader', `${cssLoader}!postcss-loader`)]
          : ['style-loader', cssLoader, 'postcss-loader']
      }, {
        test: /[?&]sanityRole=/,
        loader: roleLoaderPath
      }]
    },
    plugins: [
      new OccurrenceOrderPlugin(),
      new webpack.ResolverPlugin([new RoleResolverPlugin({basePath})], ['normal']),
      new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js')
    ],
    postcss: () => [
      //postcssUse({modules: '*'}),
      simpleVarsAsync({variables: getStyleVariables(basePath)})
    ]
  }
}

function tryRead(filePath) {
  try {
    const content = fs.readFileSync(filePath)
    return JSON.parse(content)
  } catch (err) {
    return null
  }
}
