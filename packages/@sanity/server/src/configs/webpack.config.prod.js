import webpack from 'webpack'
import getBaseConfig from './webpack.config'

export default config => {
  const baseConfig = getBaseConfig(Object.assign({}, config, {env: 'production'}))

  return Object.assign({}, baseConfig, {
    devtool: config.sourceMaps ? 'source-map' : undefined,
    plugins: (baseConfig.plugins || []).concat([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      })
    ].filter(Boolean))
  })
}
