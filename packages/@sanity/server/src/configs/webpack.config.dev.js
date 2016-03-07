import webpack from 'webpack'
import getBaseConfig from './webpack.config'

// Webpack 2 vs 1
const OccurrenceOrderPlugin = webpack.optimize.OccurrenceOrderPlugin || webpack.optimize.OccurenceOrderPlugin

export default config => {
  const baseConfig = getBaseConfig(config)

  return Object.assign({}, baseConfig, {
    devtool: 'cheap-module-eval-source-map',
    entry: [
      'eventsource-polyfill',
      'webpack-hot-middleware/client'
    ].concat(baseConfig.entry),
    plugins: [
      new OccurrenceOrderPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ]
  })
}

