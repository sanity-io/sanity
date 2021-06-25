import webpack from 'webpack'
import getBaseConfig from './webpack.config'
import {applyLocalWebpackConfig} from './applyLocalWebpackConfig'

export default (config) => {
  const basePath = config.basePath || process.cwd()
  const baseConfig = getBaseConfig(Object.assign({}, config, {env: 'production'}))
  const prodConfig = Object.assign({}, baseConfig, {
    devtool: config.sourceMaps ? 'source-map' : undefined,
    plugins: (baseConfig.plugins || []).concat(
      [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
      ].filter(Boolean)
    ),
  })

  return applyLocalWebpackConfig(prodConfig, basePath, 'production')
}
