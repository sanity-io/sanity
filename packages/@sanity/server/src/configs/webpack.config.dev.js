import webpack from 'webpack'
import applyStaticLoaderFix from '../util/applyStaticLoaderFix'
import getBaseConfig from './webpack.config'
import {getMonorepoAliases} from './monorepoAliases'

export default (config) => {
  const baseConfig = getBaseConfig(config)

  return Object.assign({}, baseConfig, {
    devtool: 'cheap-module-source-map',
    output: Object.assign({pathinfo: true}, baseConfig.output),
    entry: Object.assign({}, baseConfig.entry, {
      vendor: [
        require.resolve('eventsource-polyfill'),
        require.resolve('../browser/hot-client'),
      ].concat(baseConfig.entry.vendor),
    }),
    resolve: {
      alias: Object.assign(
        {},
        baseConfig.resolve.alias,
        {
          'react-dom': require.resolve('@hot-loader/react-dom'),
          'webpack-hot-middleware/client': require.resolve('../browser/hot-client'),
        },
        config.isSanityMonorepo ? getMonorepoAliases() : {}
      ),
      extensions: baseConfig.resolve.extensions,
    },
    plugins: (baseConfig.plugins || []).concat([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
    ]),
    module: Object.assign({}, baseConfig.module, {
      rules: applyStaticLoaderFix(baseConfig, config),
    }),
  })
}
