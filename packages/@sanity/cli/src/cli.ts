// oxlint-disable no-console
import {existsSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import chalk from 'chalk'
import dotenv from 'dotenv'
import resolveFrom from 'resolve-from'

import {CliCommand} from './__telemetry__/cli.telemetry'
import {getCliRunner} from './CommandRunner'
import {baseCommands} from './commands'
import {debug} from './debug'
import {getInstallCommand} from './packageManager'
import {type CommandRunnerOptions, type TelemetryUserProperties} from './types'
import {createTelemetryStore} from './util/createTelemetryStore'
import {detectRuntime} from './util/detectRuntime'
import {type CliConfigResult, getCliConfig} from './util/getCliConfig'
import {loadEnv} from './util/loadEnv'
import {mergeCommands} from './util/mergeCommands'
import {neatStack} from './util/neatStack'
import {parseArguments} from './util/parseArguments'
import {resolveRootDir} from './util/resolveRootDir'
import {telemetryDisclosure} from './util/telemetryDisclosure'
import {runUpdateCheck} from './util/updateNotifier'

const sanityEnv = process.env.SANITY_INTERNAL_ENV || 'production'
const knownEnvs = ['development', 'staging', 'production']

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function installProcessExitHack(finalTask: () => Promise<unknown>) {
  const originalProcessExit = process.exit

  // @ts-expect-error ignore TS2534
  process.exit = (exitCode?: number | undefined): never => {
    finalTask().finally(() => originalProcessExit(exitCode))
  }
}

export async function runCli(cliRoot: string, {cliVersion}: {cliVersion: string}): Promise<void> {
  installUnhandledRejectionsHandler()

  const pkg = {name: '@sanity/cli', version: cliVersion}

  const args = parseArguments()
  const isInit = args.groupOrCommand === 'init' && args.argsWithoutOptions[0] !== 'plugin'
  const cwd = getCurrentWorkingDirectory()
  let workDir: string | undefined
  try {
    workDir = isInit ? process.cwd() : resolveRootDir(cwd)
  } catch (err) {
    console.error(chalk.red(err.message))
    process.exit(1)
  }

  // Check if there are updates available for the CLI, and notify if there is
  await runUpdateCheck({pkg, cwd, workDir}).notify()

  // If the telemetry disclosure message has not yet been shown, show it.
  telemetryDisclosure()

  // Try to figure out if we're in a v2 or v3 context by finding a config
  debug(`Reading CLI config from "${workDir}"`)
  let cliConfig = await getCliConfig(workDir, {forked: true})
  if (!cliConfig) {
    debug('No CLI config found')
  }

  // Figure out if the app is a studio or an app from the CLI config
  const isApp = Boolean(cliConfig && 'app' in cliConfig)
  // Load the environment variables from
  loadAndSetEnvFromDotEnvFiles({workDir, cmd: args.groupOrCommand, isApp})
  maybeFixMissingWindowsEnvVar()

  // Reload the the cli config so env vars can work.
  cliConfig = await getCliConfig(workDir, {forked: true})

  const {logger: telemetry, flush: flushTelemetry} = createTelemetryStore<TelemetryUserProperties>({
    projectId: cliConfig?.config?.api?.projectId,
    env: process.env,
  })

  // UGLY HACK: process.exit(<code>) causes abrupt exit, we want to flush telemetry before exiting
  installProcessExitHack(() =>
    // When process.exit() is called, flush telemetry events first, but wait no more than x amount of ms before exiting process
    Promise.race([wait(2000), flushTelemetry()]),
  )

  telemetry.updateUserProperties({
    runtimeVersion: process.version,
    runtime: detectRuntime(),
    cliVersion: pkg.version,
    machinePlatform: process.platform,
    cpuArchitecture: process.arch,
    projectId: cliConfig?.config?.api?.projectId,
    dataset: cliConfig?.config?.api?.dataset,
  })

  const options: CommandRunnerOptions = {
    cliRoot: cliRoot,
    workDir: workDir,
    corePath: await getCoreModulePath(workDir, cliConfig),
    cliConfig,
    telemetry,
  }

  warnOnNonProductionEnvironment()
  warnOnInferredProjectDir(isInit, cwd, workDir)

  const core = args.coreOptions
  const commands = await mergeCommands(baseCommands, options.corePath, {cliVersion, cwd, workDir})

  if (core.v || core.version) {
    console.log(`${pkg.name} version ${pkg.version}`)
    process.exit()
  }

  // Translate `sanity -h <command>` to `sanity help <command>`
  if (core.h || core.help) {
    if (args.groupOrCommand) {
      args.argsWithoutOptions.unshift(args.groupOrCommand)
    }

    args.groupOrCommand = 'help'
  }

  if (args.groupOrCommand === 'logout') {
    // flush telemetry events before logging out
    await flushTelemetry()
  }

  const cliRunner = getCliRunner(commands)
  const cliCommandTrace = telemetry.trace(CliCommand, {
    groupOrCommand: args.groupOrCommand,
    extraArguments: args.extraArguments,
    commandArguments: args.argsWithoutOptions.slice(0, 10),
    coreOptions: {
      help: args.coreOptions.help || undefined,
      version: args.coreOptions.help || undefined,
      debug: args.coreOptions.help || undefined,
    },
    ...(!args.groupOrCommand && {emptyCommand: true}), // user did not entry a command
  })

  cliCommandTrace.start()
  cliRunner
    .runCommand(args.groupOrCommand, args, {
      ...options,
      telemetry: cliCommandTrace.newContext(args.groupOrCommand),
    })
    .then(() => cliCommandTrace.complete())
    .catch(async (err) => {
      await flushTelemetry()
      const error = typeof err.details === 'string' ? err.details : err
      console.error(`\n${error.stack ? neatStack(err) : error}`)
      if (err.cause) {
        console.error(`\nCaused by:\n\n${err.cause.stack ? neatStack(err.cause) : err.cause}`)
      }
      cliCommandTrace.error(error)
      process.exit(1)
    })
}

async function getCoreModulePath(
  workDir: string,
  cliConfig: CliConfigResult | null,
): Promise<string | undefined> {
  const corePath = resolveFrom.silent(workDir, '@sanity/core')
  const sanityPath = resolveFrom.silent(workDir, 'sanity/_internal')

  if (corePath && sanityPath) {
    const closest = corePath.startsWith(workDir) ? corePath : sanityPath
    const assumedVersion = closest === corePath ? 'v2' : 'v3'

    console.warn(
      chalk.yellow(
        `Both \`@sanity/core\` AND \`sanity\` installed - assuming Sanity ${assumedVersion} project.`,
      ),
    )

    return closest
  }

  if (sanityPath) {
    // On v3 and everything installed
    return sanityPath
  }

  if (corePath && cliConfig && cliConfig?.version < 3) {
    // On v2 and everything installed
    return corePath
  }

  const isInstallCommand = process.argv.indexOf('install') === -1

  if (cliConfig && cliConfig?.version < 3 && !corePath && !isInstallCommand) {
    const installCmd = await getInstallCommand({workDir})
    console.warn(
      chalk.yellow(
        [
          'The `@sanity/core` module is not installed in current project',
          `Project-specific commands not available until you run \`${installCmd}\``,
        ].join('\n'),
      ),
    )
  }

  if (cliConfig && cliConfig.version >= 3 && !sanityPath) {
    const installCmd = await getInstallCommand({workDir})
    console.warn(
      chalk.yellow(
        [
          'The `sanity` module is not installed in current project',
          `Project-specific commands not available until you run \`${installCmd}\``,
        ].join('\n'),
      ),
    )
  }

  return undefined
}

/**
 * Returns the current working directory, but also handles a weird edge case where
 * the folder the terminal is currently in has been removed
 */
function getCurrentWorkingDirectory(): string {
  let pwd
  try {
    pwd = process.cwd()
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('[ERR] Could not resolve working directory, does the current folder exist?')
      process.exit(1)
    } else {
      throw err
    }
  }

  return pwd
}

function installUnhandledRejectionsHandler() {
  process.on('unhandledRejection', (reason) => {
    if (rejectionHasStack(reason)) {
      console.error('Unhandled rejection:', reason.stack)
    } else {
      console.error('Unhandled rejection\n', reason)
    }
  })
}

function rejectionHasStack(reason: unknown): reason is {stack: string} {
  return Boolean(
    reason && typeof reason === 'object' && 'stack' in reason && typeof reason.stack === 'string',
  )
}

function warnOnInferredProjectDir(isInit: boolean, cwd: string, workDir: string): void {
  if (isInit || cwd === workDir) {
    return
  }

  console.log(`Not in project directory, assuming context of project at ${workDir}`)
}

function warnOnNonProductionEnvironment(): void {
  if (sanityEnv === 'production') {
    return
  }

  console.warn(
    chalk.yellow(
      knownEnvs.includes(sanityEnv)
        ? `[WARN] Running in ${sanityEnv} environment mode\n`
        : `[WARN] Running in ${chalk.red('UNKNOWN')} "${sanityEnv}" environment mode\n`,
    ),
  )
}

function loadAndSetEnvFromDotEnvFiles({
  workDir,
  cmd,
  isApp,
}: {
  workDir: string
  cmd: string
  isApp: boolean
}) {
  // Do a cheap lookup for a sanity.json file. If there is one, assume it is a v2 project,
  // and apply the old behavior for environment variables. Otherwise, use the Vite-style
  // behavior. We need to do this "cheap" lookup because when loading the v3 config, env vars
  // may be used in the configuration file, meaning we'd have to load the config twice.
  if (existsSync(path.join(workDir, 'sanity.json'))) {
    // v2
    debug('sanity.json exists, assuming v2 project and loading .env files using old behavior')
    const env = process.env.SANITY_ACTIVE_ENV || process.env.NODE_ENV || 'development'
    debug('Loading environment files using %s mode', env)
    dotenv.config({path: path.join(workDir, `.env.${env}`)})
    return
  }

  // v3+
  debug('No sanity.json exists, assuming v3 project and loading .env files using new behavior')

  // Use `production` for `sanity build` / `sanity deploy`,
  // but default to `development` for everything else unless `SANITY_ACTIVE_ENV` is set
  const isProdCmd = ['build', 'deploy'].includes(cmd)
  let mode = process.env.SANITY_ACTIVE_ENV
  if (!mode && (isProdCmd || process.env.NODE_ENV === 'production')) {
    mode = 'production'
  } else if (!mode) {
    mode = 'development'
  }

  if (mode === 'production' && !isProdCmd) {
    console.warn(chalk.yellow(`[WARN] Running in ${sanityEnv} environment mode\n`))
  }

  debug('Loading environment files using %s mode', mode)

  const studioEnv = loadEnv(mode, workDir, [isApp ? 'SANITY_APP_' : 'SANITY_STUDIO_'])
  process.env = {...process.env, ...studioEnv}
}

/**
 * Apparently, Windows environment variables are supposed to be case-insensitive,
 * (https://nodejs.org/api/process.html#processenv). However, it seems they are not?
 * `process.env.SYSTEMROOT` is sometimes `undefined`, whereas `process.env.SystemRoot` is _NOT_.
 *
 * The `open` npm module uses the former to open a browser on Powershell, and Sindre seems
 * unwilling to fix it (https://github.com/sindresorhus/open/pull/299#issuecomment-1447587598),
 * so this is a (temporary?) workaround in order to make opening browsers on windows work,
 * which several commands does (`sanity login`, `sanity docs` etc)
 */
function maybeFixMissingWindowsEnvVar() {
  if (os.platform() === 'win32' && !('SYSTEMROOT' in process.env) && 'SystemRoot' in process.env) {
    process.env.SYSTEMROOT = process.env.SystemRoot
  }
}
