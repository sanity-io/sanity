import webpack from 'webpack'
import registerBabel from '@babel/register'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import {getBaseServer, applyStaticRoutes, callInitializers} from './baseServer'
import getWebpackDevConfig from './configs/webpack.config.dev'
import getStaticBasePath from './util/getStaticBasePath'
import isSanityMonorepo from './configs/isSanityMonorepo'

export default function getDevServer(config = {}) {
  config.isSanityMonorepo = isSanityMonorepo(config.basePath)
  const staticPath = getStaticBasePath(config)
  const app = getBaseServer(config)
  const webpackConfig = config.webpack || getWebpackDevConfig(config)

  // Serve an empty CSS file for the main stylesheet,
  // as they are injected dynamically in development mode
  app.get(`${staticPath}/css/main.css`, (req, res) => {
    res.set('Content-Type', 'text/css')
    res.send()
  })

  // Use babel-register in order to be able to load things like
  // the document component, which can contain JSX etc
  registerBabel()

  // Apply the dev and hot middlewares to build/serve bundles on the fly
  const compiler = webpack(webpackConfig)
  app.use(
    webpackDevMiddleware(compiler, {
      logLevel: 'silent',
      watchOptions: {
        ignored: /node_modules/,
      },
      publicPath: webpackConfig.output.publicPath,
    })
  )

  app.use(webpackHotMiddleware(compiler))

  // Expose webpack compiler on server instance
  app.locals.compiler = compiler

  // Call any registered initializers
  callInitializers(config)

  return applyStaticRoutes(app, config)
}
