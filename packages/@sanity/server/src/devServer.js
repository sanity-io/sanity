import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import {getBaseServer, applyStaticRoutes} from './baseServer'
import webpackDevConfig from './configs/webpack.config.dev'

export default function getDevServer(config = {}) {
  const app = getBaseServer()
  const webpackConfig = config.webpack || webpackDevConfig
  const compiler = webpack(webpackConfig)

  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  }))

  app.use(webpackHotMiddleware(compiler))

  return applyStaticRoutes(app, config)
}
