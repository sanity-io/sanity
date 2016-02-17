import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import {getBaseServer, applyStaticRoutes} from './baseServer'
import webpackConfig from './configs/webpack.config.dev'

export default function getDevServer(conf) {
  const config = conf || webpackConfig
  const app = getBaseServer()
  const compiler = webpack(config)

  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }))

  app.use(webpackHotMiddleware(compiler))

  return applyStaticRoutes(app)
}
