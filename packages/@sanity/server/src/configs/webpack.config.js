import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import SanityPlugin from '@sanity/plugin-loader/src/SanityPlugin'
import postcssUse from 'postcss-use'

// Webpack 2 vs 1
const OccurrenceOrderPlugin = webpack.optimize.OccurrenceOrderPlugin || webpack.optimize.OccurenceOrderPlugin

const pluginLoaderPath = require.resolve('@sanity/plugin-loader')

export default (config = {}) => {
  const basePath = config.basePath || process.cwd()
  const babelConfig = tryRead(path.join(basePath, '.babelrc'))
  const env = config.env || 'development'
  const resolvePaths = [
    path.resolve(basePath),
    path.resolve(path.join(basePath, 'node_modules'))
  ]

  return {
    entry: [
      path.join(__dirname, '..', 'browser', 'entry')
    ],
    output: {
      path: path.join(__dirname, '..', '..', 'dist'),
      filename: 'bundle.js',
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
        exclude: /node_modules/,
        loader: 'babel',
        query: babelConfig || {
          presets: ['react', 'es2015'],
          cacheDirectory: true
        }
      }, {
        test: /\/@?sanity\/plugin-loader\/plugins/,
        loaders: [`${pluginLoaderPath}?basePath=${basePath}&env=${env}`]
      }]
    },
    plugins: [
      new OccurrenceOrderPlugin(),
      new SanityPlugin({basePath})
    ],
    postcss: () => [postcssUse({modules: '*'})]
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
