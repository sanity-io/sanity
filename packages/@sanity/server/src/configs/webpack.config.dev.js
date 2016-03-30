import webpack from 'webpack'
import getBaseConfig from './webpack.config'

export default config => {
  const baseConfig = getBaseConfig(config)

  return Object.assign({}, baseConfig, {
    devtool: 'cheap-module-eval-source-map',
    entry: [
      require.resolve('eventsource-polyfill'),
      require.resolve('webpack-hot-middleware/client')
    ].concat(baseConfig.entry),
    plugins: (baseConfig.plugins || []).concat([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ])
  })
}

