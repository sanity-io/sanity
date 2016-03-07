import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import {getBaseServer, applyStaticRoutes} from './baseServer'
import getWebpackDevConfig from './configs/webpack.config.dev'

export default function getDevServer(config = {}) {
  const app = getBaseServer()
  const webpackConfig = config.webpack || getWebpackDevConfig(config)
  const compiler = webpack(webpackConfig)

  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
    stats: true,
    debug: true
  }))

  app.use(webpackHotMiddleware(compiler))

  return applyStaticRoutes(app, config)
}
