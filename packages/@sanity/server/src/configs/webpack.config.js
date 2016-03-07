import path from 'path'

const pluginLoaderPath = require.resolve('@sanity/plugin-loader')

export default (config = {}) => {
  const basePath = config.basePath || process.cwd()
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
        loaders: ['babel']
      }, {
        test: /\/@?sanity\/plugin-loader\/plugins/,
        loaders: [`${pluginLoaderPath}?basePath=${basePath}&env=${env}`]
      }]
    }
  }
}
