import path from 'path'
import chalk from 'chalk'
import {promisify} from 'es6-promisify'
import {getDevServer} from '@sanity/server'
import getConfig from '@sanity/util/lib/getConfig'
import {tryInitializePluginConfigs} from '../../actions/config/reinitializePluginConfigs'
import checkReactCompatibility from '../../util/checkReactCompatibility'
import {formatMessage, isLikelyASyntaxError} from './formatMessage'

export default async (args, context) => {
  const flags = args.extOptions
  const {output, workDir} = context
  const sanityConfig = getConfig(workDir)
  const config = sanityConfig.get('server')
  const {port, hostname} = config
  const httpHost = flags.host === 'all' ? '0.0.0.0' : flags.host || hostname
  const httpPort = flags.port || port

  const serverOptions = {
    staticPath: resolveStaticPath(workDir, config),
    basePath: workDir,
    httpHost,
    httpPort,
    context,
    project: sanityConfig.get('project')
  }

  checkReactCompatibility(workDir)

  let compileSpinner
  const configSpinner = output.spinner('Checking configuration files...')
  await tryInitializePluginConfigs({workDir, output})
  configSpinner.succeed()

  const server = getDevServer(serverOptions)
  const compiler = server.locals.compiler

  // "invalid" doesn't mean the bundle is invalid, but that it is *invalidated*,
  // in other words, it's recompiling
  compiler.plugin('invalid', () => {
    output.clear()
    resetSpinner()
  })

  // Start the server and try to create more user-friendly errors if we encounter issues
  try {
    await promisify(server.listen.bind(server))(httpPort, httpHost)
  } catch (err) {
    gracefulDeath(httpHost, config, err)
  }

  // Hold off on showing the spinner until compilation has started
  compiler.plugin('compile', () => resetSpinner())

  // "done" event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors, you will get this event.

  compiler.plugin('done', stats => {
    if (compileSpinner) {
      compileSpinner.succeed()
    }

    const hasErrors = stats.hasErrors()
    const hasWarnings = stats.hasWarnings()

    if (!hasErrors && !hasWarnings) {
      output.print(
        chalk.green(`Content Studio successfully compiled! Go to http://${httpHost}:${httpPort}`) // eslint-disable-line max-len
      )
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

    output.print(
      chalk.green(`Content Studio listening on http://${httpHost}:${httpPort}`)
    )
  })

  function resetSpinner() {
    if (compileSpinner) {
      compileSpinner.stop()
    }

    compileSpinner = output.spinner('Compiling...').start()
  }
}

function resolveStaticPath(rootDir, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath) ? staticPath : path.resolve(path.join(rootDir, staticPath))
}

function gracefulDeath(httpHost, config, err) {
  if (err.code === 'EADDRINUSE') {
    throw new Error(
      'Port number is already in use, configure `server.port` in `sanity.json`'
    )
  }

  if (err.code === 'EACCES') {
    const help =
      config.port < 1024
        ? 'port numbers below 1024 requires root privileges'
        : `do you have access to listen to the given host (${httpHost})?`

    throw new Error(`The Content Studio server does not have access to listen to given port - ${help}`) // eslint-disable-line max-len
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

  warnings.map(message => `Warning in ${formatMessage(message)}`).forEach(message => {
    output.print(message)
    output.print()
  })
}
