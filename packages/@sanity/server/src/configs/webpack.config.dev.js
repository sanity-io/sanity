import webpack from 'webpack'
import getBaseConfig from './webpack.config'
import applyStaticLoaderFix from '../util/applyStaticLoaderFix'
import path from 'path'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'

export default config => {
  const baseConfig = getBaseConfig(config)

  return Object.assign({}, baseConfig, {
    devtool: 'cheap-module-source-map',
    output: Object.assign({pathinfo: true}, baseConfig.output),
    entry: Object.assign({}, baseConfig.entry, {
      vendor: [
        require.resolve('eventsource-polyfill'),
        require.resolve('webpack-hot-middleware/client')
      ].concat(baseConfig.entry.vendor)
    }),
    resolve: {
      alias: Object.assign({}, baseConfig.resolve.alias, {
        'webpack-hot-middleware/client': require.resolve('webpack-hot-middleware/client')
      })
    },
    plugins: (baseConfig.plugins || []).concat([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new BundleAnalyzerPlugin(
        {
          analyzerMode: 'static',
          reportFilename: path.join(process.cwd(), 'static/bundle-analyzer-report.html'),
          openAnalyzer: false
        }
      )
    ]),
    module: Object.assign({}, baseConfig.module, {
      rules: applyStaticLoaderFix(baseConfig, config)
    })
  })
}

