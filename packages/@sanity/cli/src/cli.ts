/* eslint-disable no-console, no-process-exit, no-sync */
import path from 'path'
import fs from 'fs/promises'
import chalk from 'chalk'
import dotenv from 'dotenv'
import resolveFrom from 'resolve-from'
import {runUpdateCheck} from './util/updateNotifier'
import {parseArguments} from './util/parseArguments'
import {mergeCommands} from './util/mergeCommands'
import {getCliRunner} from './CommandRunner'
import {baseCommands} from './commands'
import {neatStack} from './util/neatStack'
import {debug} from './debug'

const sanityEnv = process.env.SANITY_INTERNAL_ENV || 'production' // eslint-disable-line no-process-env
const knownEnvs = ['development', 'staging', 'production']

export async function runCli(cliRoot: string, {cliVersion}: {cliVersion: string}): Promise<void> {
  installUnhandledRejectionsHandler()

  const pkg = {name: '@sanity/cli', version: cliVersion}
  const args = parseArguments()
  const isInit = args.groupOrCommand === 'init' && args.argsWithoutOptions[0] !== 'plugin'
  const cwd = getCurrentWorkingDirectory()
  const workDir = (isInit ? process.cwd() : await resolveRootDir(cwd)) || process.cwd()

  // Try to load .env files from the sanity studio directory
  // eslint-disable-next-line no-process-env
  const env = process.env.SANITY_ACTIVE_ENV || process.env.NODE_ENV || 'development'
  dotenv.config({path: path.join(workDir, `.env.${env}`)})

  // Check if there are updates available for the CLI, and notify if there is
  await runUpdateCheck({pkg, cwd, workDir}).notify()

  const options = {
    cliRoot: cliRoot,
    workDir: workDir,
    corePath: await getCoreModulePath(workDir),
  }

  warnOnNonProductionEnvironment()
  warnOnInferredProjectDir(isInit, cwd, workDir)

  const core = args.coreOptions
  const commands = mergeCommands(baseCommands, options.corePath, {cliVersion, cwd, workDir})

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

  const cliRunner = getCliRunner(commands)
  cliRunner.runCommand(args.groupOrCommand, args, options).catch((err) => {
    const error = typeof err.details === 'string' ? err.details : err
    // eslint-disable-next-line no-console
    console.error(`\n${error.stack ? neatStack(err) : error}`)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
}

async function getCoreModulePath(workDir: string) {
  const pkgPath = resolveFrom.silent(workDir, '@sanity/core')
  if (pkgPath) {
    return pkgPath
  }

  if ((await hasStudioConfig(workDir)) && process.argv.indexOf('install') === -1) {
    console.warn(
      chalk.yellow(
        [
          '@sanity/core not installed in current project',
          'Project-specific commands not available until you run `sanity install`',
        ].join('\n')
      )
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

/**
 * Resolve project root directory, falling back to cwd if it cannot be found
 */
async function resolveRootDir(cwd: string) {
  try {
    return (await resolveProjectRoot(cwd)) || cwd
  } catch (err) {
    console.warn(
      chalk.red(['Error occurred trying to resolve project root:', err.message].join('\n'))
    )
    process.exit(1)
  }

  return false
}

async function hasStudioConfig(basePath: string): Promise<boolean> {
  const buildConfigs = await Promise.all([
    fileExists(path.join(basePath, 'studio.config.js')),
    fileExists(path.join(basePath, 'studio.config.ts')),
    isSanityV2StudioRoot(basePath),
  ])

  return buildConfigs.some(Boolean)
}

async function isSanityV2StudioRoot(basePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(path.join(basePath, 'sanity.json'), 'utf8')
    const sanityJson = JSON.parse(content)
    const isRoot = Boolean(sanityJson?.root)
    if (isRoot) {
      debug('Found Sanity v2 studio root at %s', basePath)
    }
    return isRoot
  } catch (err) {
    return false
  }
}

async function resolveProjectRoot(basePath: string, iterations = 0): Promise<string | false> {
  if (await hasStudioConfig(basePath)) {
    return basePath
  }

  const parentDir = path.resolve(basePath, '..')
  if (parentDir === basePath || iterations > 30) {
    // Reached root (or max depth), give up
    return false
  }

  return resolveProjectRoot(parentDir, iterations + 1)
}

function fileExists(filePath: string) {
  return fs.access(filePath).then(
    () => true,
    () => false
  )
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

function rejectionHasStack(
  reason: Record<string, unknown> | null | undefined
): reason is {stack: string} {
  return Boolean(reason && 'stack' in reason && typeof reason.stack === 'string')
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
        : `[WARN] Running in ${chalk.red('UNKNOWN')} "${sanityEnv}" environment mode\n`
    )
  )
}
