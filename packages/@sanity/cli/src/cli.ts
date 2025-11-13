// oxlint-disable no-console
import os from 'node:os'

import chalk from 'chalk'
import resolveFrom from 'resolve-from'
import semver from 'semver'

import {CliCommand} from './__telemetry__/cli.telemetry'
import {getCliRunner} from './CommandRunner'
import {baseCommands} from './commands'
import {debug} from './debug'
import {getInstallCommand} from './packageManager'
import {type CommandRunnerOptions, type PackageJson, type TelemetryUserProperties} from './types'
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
    void finalTask().finally(() => originalProcessExit(exitCode))
  }
}

export async function runCli(cliRoot: string, {cliPkg}: {cliPkg: PackageJson}): Promise<void> {
  installUnhandledRejectionsHandler()

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
  await runUpdateCheck({pkg: {name: cliPkg.name, version: cliPkg.version}, cwd, workDir}).notify()

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
    cliVersion: cliPkg.version,
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

  warnOnNUnsupportedRuntime(cliPkg)
  warnOnNonProductionEnvironment()
  warnOnCliConfigName()
  warnOnInferredProjectDir(isInit, cwd, workDir)

  const core = args.coreOptions
  const commands = await mergeCommands(baseCommands, options.corePath, {
    cliVersion: cliPkg.version,
    cwd,
    workDir,
  })

  if (core.v || core.version) {
    console.log(`${cliPkg.name} version ${cliPkg.version}`)
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
  debug('Starting cli runner with options:', JSON.stringify(options, null, 2))
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
  const sanityPath = resolveFrom.silent(workDir, 'sanity/_internal')
  if (sanityPath) {
    // Everything is installed
    return sanityPath
  }

  if (cliConfig && !sanityPath) {
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

function warnOnNUnsupportedRuntime(cliPkg: PackageJson): void {
  const engines = cliPkg.engines
  if (!engines) {
    return
  }

  const currentNodeVersion = process.versions.node
  if (!semver.satisfies(currentNodeVersion, engines.node))
    console.warn(
      chalk.red(`\n[WARN] The current Node.js version (${`v${currentNodeVersion}`}) is not supported
Please upgrade to a version that satisfies the range ${chalk.green.bold(engines.node)}\n`),
    )
}

function warnOnNonProductionEnvironment(): void {
  if (sanityEnv === 'production') {
    return
  }

  if (process.env.TEST !== 'true') {
    console.warn(
      chalk.yellow(
        knownEnvs.includes(sanityEnv)
          ? `[WARN] Running in ${sanityEnv} environment mode\n`
          : `[WARN] Running in ${chalk.red('UNKNOWN')} "${sanityEnv}" environment mode\n`,
      ),
    )
  }
}

function warnOnCliConfigName(): void {
  if (!process.env.SANITY_CLI_TEST_CONFIG_NAME) {
    return
  }

  if (process.env.TEST !== 'true') {
    console.warn(
      chalk.yellow('[WARN] Ignored SANITY_CLI_TEST_CONFIG_NAME. It can only be used in tests.'),
    )
    return
  }

  console.warn(
    chalk.yellow(`[WARN] Loading CLI config from ${process.env.SANITY_CLI_TEST_CONFIG_NAME}.ts/js`),
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
