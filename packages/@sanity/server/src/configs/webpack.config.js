import path from 'path'

const pluginLoaderPath = require.resolve('@sanity/plugin-loader')

export default (config = {}) => {
  const basePath = config.basePath || process.cwd()
  const env = config.env || 'development'

  return {
    entry: [
      path.join(__dirname, '..', 'browser', 'entry')
    ],
    output: {
      path: path.join(__dirname, '..', '..', 'dist'),
      filename: 'bundle.js',
      publicPath: '/static/'
    },
    module: {
      loaders: [{
        test: /\/@?sanity\/plugin-loader\/plugins/,
        loaders: [`${pluginLoaderPath}?basePath=${basePath}&env=${env}`]
      }, {
        test: /\.jsx?/,
        loaders: ['babel'],
        include: path.join(__dirname, '..')
      }]
    }
  }
}
