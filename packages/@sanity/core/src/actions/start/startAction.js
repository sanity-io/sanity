import path from 'path'
import chalk from 'chalk'
import thenify from 'thenify'
import storyBook from '@sanity/storybook/server'
import {getProdServer, getDevServer} from '@sanity/server'
import getConfig from '@sanity/util/lib/getConfig'
import isProduction from '../../util/isProduction'
import reinitializePluginConfigs from '../../actions/config/reinitializePluginConfigs'
import {formatMessage, isLikelyASyntaxError} from './formatMessage'

export default async (args, context) => {
  const flags = args.extOptions
  const {output, workDir} = context
  const sanityConfig = getConfig(workDir)
  const config = sanityConfig.get('server')
  const getServer = isProduction ? getProdServer : getDevServer
  const server = getServer({
    staticPath: resolveStaticPath(workDir, config),
    basePath: workDir,
    listen: config
  })

  const {port, hostname} = config
  const httpPort = flags.port || port
  const compiler = server.locals.compiler
  const listeners = [thenify(server.listen.bind(server))(httpPort, hostname)]
  const configSpinner = output.spinner('Checking configuration files...')

  // "invalid" doesn't mean the bundle is invalid, but that it is *invalidated*,
  // in other words, it's recompiling
  let compileSpinner
  compiler.plugin('invalid', () => {
    output.clear()
    resetSpinner()
  })

  // Once the server(s) are listening, show a compiling spinner
  let httpServers = []
  try {
    httpServers = await Promise.all(listeners)
  } catch (err) {
    gracefulDeath(config, err)
  }

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

    if (hasErrors) {
      printErrors(output, errors)
      return // If errors exist, ignore warnings.
    }

    if (hasWarnings) {
      printWarnings(output, warnings)
    }

    output.print(chalk.green(`Server listening on http://${hostname}:${httpPort}`))
    if (httpServers.length > 1) {
      output.print(chalk.green(`Storybook listening on ${httpServers[1]}`))
    }
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

  await reinitializePluginConfigs({workDir, output})

  configSpinner.succeed()
  resetSpinner()

  function resetSpinner() {
    if (compileSpinner) {
      compileSpinner.stop()
    }

    compileSpinner = output.spinner('Compiling...').start()
  }
}


function resolveStaticPath(rootDir, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath)
    ? staticPath
    : path.resolve(path.join(rootDir, staticPath))
}

function gracefulDeath(config, err) {
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


function printErrors(output, errors) {
  output.print(chalk.red('Failed to compile.'))
  output.print('')

  const formattedErrors = (errors.some(isLikelyASyntaxError)
    ? errors.filter(isLikelyASyntaxError)
    : errors
  ).map(message => `Error in ${formatMessage(message)}`)

  formattedErrors.forEach(message => {
    output.print(message)
    output.print('')
  })
}

function printWarnings(output, warnings) {
  output.print(chalk.yellow('Compiled with warnings.'))
  output.print()

  warnings
    .map(message => `Warning in ${formatMessage(message)}`)
    .forEach(message => {
      output.print(message)
      output.print()
    })
}
