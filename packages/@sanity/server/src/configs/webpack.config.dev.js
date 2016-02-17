import webpack from 'webpack'
import baseConfig from './webpack.config'

export default Object.assign({}, baseConfig, {
  devtool: 'cheap-module-eval-source-map',
  entry: [
    'eventsource-polyfill',
    'webpack-hot-middleware/client'
  ].concat(baseConfig.entry),
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
})
