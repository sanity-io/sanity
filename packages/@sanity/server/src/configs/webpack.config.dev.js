import webpack from 'webpack'
import getBaseConfig from './webpack.config'
import applyStaticLoaderFix from '../util/applyStaticLoaderFix'

export default config => {
  const baseConfig = getBaseConfig(config)

  return Object.assign({}, baseConfig, {
    devtool: 'module-eval-source-map',
    output: Object.assign({pathinfo: true}, baseConfig.output),
    entry: Object.assign({}, baseConfig.entry, {
      vendor: [
        require.resolve('eventsource-polyfill'),
        require.resolve('webpack-hot-middleware/client')
      ].concat(baseConfig.entry.vendor)
    }),
    plugins: (baseConfig.plugins || []).concat([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ]),
    module: Object.assign({}, baseConfig.module, {
      loaders: applyStaticLoaderFix(baseConfig, config)
    })
  })
}

