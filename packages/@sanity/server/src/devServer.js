import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import {getBaseServer, applyStaticRoutes} from './baseServer'
import getWebpackDevConfig from './configs/webpack.config.dev'
import registerBabel from 'babel-register'
import find from 'lodash/find'
import get from 'lodash/get'
import set from 'lodash/set'

export default function getDevServer(config = {}) {
  const app = getBaseServer()
  const webpackConfig = config.webpack || getWebpackDevConfig(config)

  // Use babel-register in order to be able to load things like
  // the document component, which can contain JSX etc
  registerBabel()

  // Inject hot module reloading preset if not present already
  const babelLoader = find(webpackConfig.module.loaders, {loader: 'babel'})
  if (babelLoader) {
    const presets = get(babelLoader, 'query.env.development.presets', [])
    if (presets.indexOf('react-hmre') === -1) {
      set(
        babelLoader,
        'query.env.development.presets',
        presets.concat(require.resolve('babel-preset-react-hmre'))
      )
    }
  }

  // Apply the dev and hot middlewares to build/serve bundles on the fly
  const compiler = webpack(webpackConfig)
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
    stats: true,
    debug: true
  }))

  app.use(webpackHotMiddleware(compiler))

  // Serve an empty CSS file for the main stylesheet,
  // as they are injected dynamically in development mode
  app.get('/static/css/main.css', (req, res) => {
    res.set('Content-Type', 'text/css')
    res.send()
  })

  return applyStaticRoutes(app, config)
}
