import path from 'path'
import chalk from 'chalk'
import thenify from 'thenify'
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
  const {port, hostname} = config
  const httpHost = flags.host === 'all' ? '0.0.0.0' : (flags.host || hostname)
  const httpPort = flags.port || port

  const serverOptions = {
    staticPath: resolveStaticPath(workDir, config),
    basePath: workDir,
    httpHost,
    httpPort,
    context,
  }

  const server = getServer(serverOptions)
  const compiler = server.locals.compiler
  const configSpinner = output.spinner('Checking configuration files...')

  // "invalid" doesn't mean the bundle is invalid, but that it is *invalidated*,
  // in other words, it's recompiling
  let compileSpinner
  compiler.plugin('invalid', () => {
    output.clear()
    resetSpinner()
  })

  // Once the server(s) are listening, show a compiling spinner
  try {
    await thenify(server.listen.bind(server))(httpPort, httpHost)
  } catch (err) {
    gracefulDeath(httpHost, config, err)
  }

  // "done" event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors, you will get this event.
  compiler.plugin('done', stats => {
    if (compileSpinner) {
      compileSpinner.succeed()
    }

    const hasErrors = stats.hasErrors()
    const hasWarnings = stats.hasWarnings()

    if (!hasErrors && !hasWarnings) {
      output.print(chalk.green(`Compiled successfully! Server listening on http://${httpHost}:${httpPort}`))
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

    output.print(chalk.green(`Server listening on http://${httpHost}:${httpPort}`))
  })

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

function gracefulDeath(httpHost, config, err) {
  if (err.code === 'EADDRINUSE') {
    throw new Error('Port number for Sanity server is already in use, configure `server.port` in `sanity.json`')
  }

  if (err.code === 'EACCES') {
    const help = config.port < 1024
      ? 'port numbers below 1024 requires root privileges'
      : `do you have access to listen to the given host (${httpHost})?`

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
