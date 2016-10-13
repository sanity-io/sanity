import path from 'path'
import chalk from 'chalk'
import thenify from 'thenify'
import storyBook from '@sanity/storybook/server'
import {getProdServer, getDevServer} from '@sanity/server'
import getConfig from '../../util/getConfig'
import isProduction from '../../util/isProduction'
import reinitializePluginConfigs from '../../actions/config/reinitializePluginConfigs'
import {formatMessage, isLikelyASyntaxError} from './formatMessage'

export default {
  name: 'start',
  command: 'start',
  describe: 'Starts a webserver that serves Sanity',
  handler: ({output, options}) => {
    const sanityConfig = getConfig(options.rootDir)
    const config = sanityConfig.get('server')
    const getServer = isProduction ? getProdServer : getDevServer
    const server = getServer({
      staticPath: resolveStaticPath(options.rootDir, config),
      basePath: options.rootDir,
      listen: config
    })

    const {port, hostname} = config
    const httpPort = options.port || port
    const compiler = server.locals.compiler
    const listeners = [thenify(server.listen.bind(server))(httpPort, hostname)]

    // "invalid" doesn't mean the bundle is invalid, but that it is *invalidated*,
    // in other words, it's recompiling
    let compileSpinner
    compiler.plugin('invalid', () => {
      output.clear()
      compileSpinner = output.spinner('Compiling...').start()
    })

    // Once the server(s) are listening, show a compiling spinner
    const listenPromise = Promise.all(listeners).then(res => {
      if (!compileSpinner) {
        compileSpinner = output.spinner('Compiling...').start()
      }
      return res
    })

    // "done" event fires when Webpack has finished recompiling the bundle.
    // Whether or not you have warnings or errors, you will get this event.
    compiler.plugin('done', stats => {
      if (compileSpinner) {
        compileSpinner.stop()
      }

      output.clear()

      const hasErrors = stats.hasErrors()
      const hasWarnings = stats.hasWarnings()

      if (!hasErrors && !hasWarnings) {
        output.print(chalk.green(`Compiled successfully! Server listening on http://${hostname}:${httpPort}`))
        return
      }

      const {errors, warnings} = stats.toJson({}, true)
      const formattedWarnings = warnings.map(message => `Warning in ${formatMessage(message)}`)
      let formattedErrors = errors.map(message => `Error in ${formatMessage(message)}`)

      if (hasErrors) {
        output.print(chalk.red('Failed to compile.'))
        output.print('')

        if (formattedErrors.some(isLikelyASyntaxError)) {
          // If there are any syntax errors, show just them.
          // This prevents a confusing ESLint parsing error
          // preceding a much more useful Babel syntax error.
          formattedErrors = formattedErrors.filter(isLikelyASyntaxError)
        }

        formattedErrors.forEach(message => {
          output.print(message)
          output.print('')
        })

        // If errors exist, ignore warnings.
        return
      }

      if (hasWarnings) {
        output.print(chalk.yellow('Compiled with warnings.'))
        output.print()

        formattedWarnings.forEach(message => {
          output.print(message)
          output.print()
        })
      }

      listenPromise.then(res => {
        output.print(chalk.green(`Server listening on http://${hostname}:${httpPort}`))
        if (res.length > 1) {
          output.print(chalk.green(`Storybook listening on ${res[1]}`))
        }
      })
    })

    const storyConfig = sanityConfig.get('storybook')
    if (storyConfig) {
      const plugins = sanityConfig.get('plugins') || []
      if (plugins.indexOf('@sanity/storybook') === -1) {
        throw new Error(
          '`@sanity/storybook` is missing from `plugins` array. '
          + 'Either add it as a dependency and plugin, or remove the '
          + '`storybook` section of your projects `sanity.json`.'
        )
      }

      listeners.push(storyBook(storyConfig))
    }

    return reinitializePluginConfigs({rootDir: options.rootDir, output})
      .then(listenPromise)
      .catch(getGracefulDeathHandler(config))
  }
}

function resolveStaticPath(rootDir, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath)
    ? staticPath
    : path.resolve(path.join(rootDir, staticPath))
}

function getGracefulDeathHandler(config) {
  return function gracefulDeath(err) {
    if (err.code === 'EADDRINUSE') {
      throw new Error('Port number for Sanity server is already in use, configure `server.port` in `sanity.json`')
    }

    if (err.code === 'EACCES') {
      const help = config.port < 1024
        ? 'port numbers below 1024 requires root privileges'
        : `do you have access to listen to the given hostname (${config.hostname})?`

      throw new Error(`Sanity server does not have access to listen to given port - ${help}`)
    }

    throw err
  }
}
