import webpack from 'webpack'
import getBaseConfig from './webpack.config'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

export default config => {
  const baseConfig = getBaseConfig(Object.assign({}, config, {env: 'production'}))

  return Object.assign({}, baseConfig, {
    devtool: 'source-map',
    plugins: (baseConfig.plugins || []).concat([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      /*new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      })*/
    ])
  })
}
