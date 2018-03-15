import ReactDOM from 'react-dom/server'
import webpack from 'webpack'
import getDevServer from './devServer'
import getProdServer from './prodServer'
import getWebpackProdConfig from './configs/webpack.config.prod'
import getWebpackDevConfig from './configs/webpack.config.dev'
import getWebpackBaseConfig from './configs/webpack.config'
import applyStaticLoaderFix from './util/applyStaticLoaderFix'
import {getDocumentElement} from './baseServer'

const getWebpackCompiler = baseConfig => {
  const config =
    baseConfig.env === 'production'
      ? getWebpackProdConfig(baseConfig)
      : getWebpackDevConfig(baseConfig)

  return webpack(config)
}

// exported to allow reuse of same React version from CLI
export {
  getDevServer,
  getProdServer,
  getWebpackCompiler,
  getWebpackDevConfig,
  getWebpackBaseConfig,
  getWebpackProdConfig,
  getDocumentElement,
  applyStaticLoaderFix,
  ReactDOM
}
