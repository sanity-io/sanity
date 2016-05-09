import webpack from 'webpack'
import getDevServer from './devServer'
import getProdServer from './prodServer'
import getWebpackProdConfig from './configs/webpack.config.prod'
import getWebpackDevConfig from './configs/webpack.config.dev'

const getWebpackCompiler = baseConfig => {
  const config = baseConfig.env === 'production'
    ? getWebpackProdConfig(baseConfig)
    : getWebpackDevConfig(baseConfig)

  return webpack(config)
}

export {
  getDevServer,
  getProdServer,
  getWebpackCompiler
}
