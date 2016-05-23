import ReactDOM from 'react-dom/server'
import webpack from 'webpack'
import getDevServer from './devServer'
import getProdServer from './prodServer'
import getWebpackProdConfig from './configs/webpack.config.prod'
import getWebpackDevConfig from './configs/webpack.config.dev'
import {getDocumentElement} from './baseServer'

const getWebpackCompiler = baseConfig => {
  const config = baseConfig.env === 'production'
    ? getWebpackProdConfig(baseConfig)
    : getWebpackDevConfig(baseConfig)

  console.log(require('util').inspect(config, {colors: true, depth: +Infinity}))
  return webpack(config)
}

export {
  getDevServer,
  getProdServer,
  getWebpackCompiler,
  getDocumentElement,
  ReactDOM // exported to allow reuse of same React version from CLI
}
