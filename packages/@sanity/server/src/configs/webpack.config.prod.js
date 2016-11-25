import webpack from 'webpack'
import getBaseConfig from './webpack.config'

export default config => {
  const baseConfig = getBaseConfig(Object.assign({}, config, {env: 'production'}))
  const skipMinify = config.skipMinify

  return Object.assign({}, baseConfig, {
    devtool: 'source-map',
    plugins: (baseConfig.plugins || []).concat([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      !skipMinify && new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      })
    ].filter(Boolean))
  })
}
