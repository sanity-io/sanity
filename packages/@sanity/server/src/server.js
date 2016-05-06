import getDevServer from './devServer'
import getProdServer from './prodServer'
import getWebpackProdConfig from './configs/webpack.config.prod'
import getWebpackDevConfig from './configs/webpack.config.dev'

const getWebpackConfig = env => {
  return env === 'production'
    ? getWebpackProdConfig()
    : getWebpackDevConfig()
}

export {
  getDevServer,
  getProdServer,
  getWebpackConfig
}
