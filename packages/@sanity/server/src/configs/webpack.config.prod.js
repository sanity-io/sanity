import webpack from 'webpack'
import getBaseConfig from './webpack.config'

export default config =>
  Object.assign({}, getBaseConfig(Object.assign({}, config, {env: 'production'})), {
    devtool: 'source-map',
    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      })
    ]
  })
