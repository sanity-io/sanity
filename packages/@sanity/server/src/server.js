import getDevServer from './devServer'
import getProdServer from './prodServer'
import getWebpackProdConfig from './configs/webpack.config.prod'
import getWebpackDevConfig from './configs/webpack.config.dev'

const getWebpackConfig = baseConfig => {
  return baseConfig.env === 'production'
    ? getWebpackProdConfig(baseConfig)
    : getWebpackDevConfig(baseConfig)
}

export {
  getDevServer,
  getProdServer,
  getWebpackConfig
}
