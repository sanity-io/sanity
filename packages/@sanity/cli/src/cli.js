/* eslint-disable no-console, no-process-exit, no-sync */
import 'babel-polyfill'
import path from 'path'
import chalk from 'chalk'
import fsp from 'fs-promise'
import resolveFrom from 'resolve-from'
import updateNotifier from 'update-notifier'
import {resolveProjectRoot} from '@sanity/resolver'
import pkg from '../package.json'
import parseArguments from './util/parseArguments'
import mergeCommands from './util/mergeCommands'
import {getCliRunner} from './CommandRunner'
import baseCommands from './commands'

const sanityEnv = process.env.SANITY_ENV || 'production' // eslint-disable-line no-process-env
const knownEnvs = ['development', 'staging', 'production']

module.exports = function runCli() {
  updateNotifier({pkg}).notify({defer: false})

  const devMode = hasDevMode()
  const args = parseArguments()
  const isInit = args.groupOrCommand === 'init'
  const cwd = checkCwdPresence()
  const workDir = isInit ? process.cwd() : resolveRootDir(cwd)
  const options = {
    workDir: workDir,
    corePath: getCoreModulePath(workDir)
  }

  if (sanityEnv !== 'production') {
    console.warn(chalk.yellow(
      knownEnvs.includes(sanityEnv)
        ? `[WARN] Running in ${sanityEnv} environment mode\n`
        : `[WARN] Running in ${chalk.red('UNKNOWN')} "${sanityEnv}" environment mode\n`
    ))
  }

  if (!isInit && workDir !== cwd) {
    console.log(`Not in project directory, assuming context of project at ${workDir}`)
  }

  if (devMode) {
    require('source-map-support').install()

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection:', reason.stack)
    })
  }

  const core = args.coreOptions
  const commands = mergeCommands(baseCommands, options.corePath)

  if (core.v || core.version) {
    console.log(`${pkg.name} version ${pkg.version}`) // eslint-disable-line no-console
    process.exit() // eslint-disable-line no-process-exit
  }

  // Translate `sanity -h <command>` to `sanity help <command>`
  if (core.h || core.help) {
    if (args.groupOrCommand) {
      args.argsWithoutOptions.unshift(args.groupOrCommand)
    }

    args.groupOrCommand = 'help'
  }

  Promise.resolve(getCliRunner(commands))
    .then(cliRunner => cliRunner.runCommand(args.groupOrCommand, args, options))
    .catch(err => {
      const debug = core.d || core.debug
      const error = (debug && err.details) || err
      const errMessage = debug ? (error.stack || error) : (error.message || error)
      console.error(chalk.red(errMessage)) // eslint-disable-line no-console
      process.exit(error.code || 1) // eslint-disable-line no-process-exit
    })
}

// Weird edge case where the folder the terminal is currently in has been removed
function checkCwdPresence() {
  let cwd = null
  try {
    cwd = process.cwd()
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('[ERR] Could not resolve working directory, does the current folder exist?')
      process.exit(1)
    } else {
      throw err
    }
  }

  return cwd
}

function hasDevMode() {
  return fsp.existsSync(path.join(__dirname, '..', 'src'))
}

function resolveRootDir(cwd) {
  // Resolve project root directory
  try {
    return resolveProjectRoot({
      basePath: cwd,
      sync: true
    }) || cwd
  } catch (err) {
    console.warn(chalk.red([
      'Error occured trying to resolve project root:',
      err.message
    ].join('\n')))
    process.exit(1)
  }

  return false
}

function getCoreModulePath(workDir) {
  const pkgPath = resolveFrom(workDir, '@sanity/core')
  if (pkgPath) {
    return pkgPath
  }

  const hasManifest = fsp.existsSync(path.join(workDir, 'sanity.json'))
  if (hasManifest && process.argv.indexOf('install') === -1) {
    console.warn(chalk.yellow([
      '@sanity/core not installed in current project',
      'Project-specific commands not available until you run `sanity install`'
    ].join('\n')))
  }

  return undefined
}
