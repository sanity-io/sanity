import path from 'path'
import which from 'which'
import preferredPM from 'preferred-pm'
import {isInteractive} from '../util/isInteractive'
import {CliPrompter} from '../types'

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'manual'

/**
 * Attempts to resolve the most optimal package manager to use to install/upgrade
 * packages/dependencies at a given path. It does so by looking for package manager
 * specific lockfiles. If it finds a lockfile belonging to a certain package manager,
 * it prioritizes this one. However, if that package manager is not installed, it will
 * prompt the user for which one they want to use and hint at the most optimal one
 * not being installed.
 *
 * Note that this function also takes local npm binary paths into account - for instance,
 * `yarn` can be installed as a dependency of the project instead of globally, and it
 * will use that is available.
 *
 * The user can also select 'manual' to skip the process and run their preferred package
 * manager manually. Commands using this function must take this `manual` choice into
 * account and act accordingly if chosen.
 *
 * @param workDir - The working directory where a lockfile is most likely to be present
 * @param options - Pass `interactive: false` to fall back to npm if most optimal is
 *                  not available, instead of prompting
 * @returns Object of `chosen` and, if a lockfile is found, the `mostOptimal` choice
 */
export async function getPackageManagerChoice(
  workDir: string,
  options: {interactive: false} | {interactive?: true; prompt: CliPrompter}
): Promise<{chosen: PackageManager; mostOptimal?: PackageManager}> {
  const rootDir = workDir || process.cwd()
  const preferred = (await preferredPM(rootDir))?.name

  if (preferred && (await hasCommand(preferred, rootDir))) {
    // There is an optimal/preferred package manager, and the user has it installed!
    return {chosen: preferred, mostOptimal: preferred}
  }

  const interactive = typeof options.interactive === 'boolean' ? options.interactive : isInteractive
  if (!interactive) {
    // We can't ask the user for their preference, so fall back to whatever is installed
    // Note that the most optimal choice is already picked above if available.
    return {chosen: await getFallback(rootDir), mostOptimal: preferred}
  }

  if (!('prompt' in options)) {
    throw new Error('Must pass `prompt` when in interactive mode')
  }

  // We can ask the user for their preference, hurray!
  const messageSuffix = preferred ? ` (preferred is ${preferred}, but is not installed)` : ''
  const chosen = await options.prompt.single<PackageManager>({
    type: 'list',
    choices: await getAvailablePackageManagers(rootDir),
    default: preferred,
    message: `Package manager to use for installing dependencies?${messageSuffix}`,
  })

  return {chosen, mostOptimal: preferred}
}

async function getFallback(cwd: string): Promise<PackageManager> {
  if (await hasNpmInstalled(cwd)) {
    return 'npm'
  }

  if (await hasYarnInstalled(cwd)) {
    return 'yarn'
  }

  if (await hasPnpmInstalled(cwd)) {
    return 'pnpm'
  }

  return 'manual'
}

async function getAvailablePackageManagers(cwd: string): Promise<PackageManager[]> {
  const [npm, yarn, pnpm] = await Promise.all([
    hasNpmInstalled(cwd),
    hasYarnInstalled(cwd),
    hasPnpmInstalled(cwd),
  ])

  const choices = [npm && 'npm', yarn && 'yarn', pnpm && 'pnpm', 'manual']
  return choices.filter((pm): pm is PackageManager => pm !== false)
}

export function hasNpmInstalled(cwd?: string): Promise<boolean> {
  return hasCommand('npm', cwd)
}

export function hasYarnInstalled(cwd?: string): Promise<boolean> {
  return hasCommand('yarn', cwd)
}

export function hasPnpmInstalled(cwd?: string): Promise<boolean> {
  return hasCommand('pnpm', cwd)
}

export function getNpmRunPath(cwd: string): string {
  let previous
  let cwdPath = path.resolve(cwd)
  const result: string[] = []

  while (previous !== cwdPath) {
    result.push(path.join(cwdPath, 'node_modules', '.bin'))
    previous = cwdPath
    cwdPath = path.resolve(cwdPath, '..')
  }

  result.push(path.resolve(cwd, process.execPath, '..'))

  const pathEnv = process.env[getPathEnvVarKey()]
  return [...result, pathEnv].join(path.delimiter)
}

export function getPartialEnvWithNpmPath(cwd: string): NodeJS.ProcessEnv {
  const key = getPathEnvVarKey()
  return {[key]: getNpmRunPath(cwd)}
}

function getPathEnvVarKey(): string {
  if (process.platform !== 'win32') {
    return 'PATH'
  }

  return (
    Object.keys(process.env)
      .reverse()
      .find((key) => key.toUpperCase() === 'PATH') || 'Path'
  )
}

function getCommandPath(cmd: string, cwd?: string): Promise<string | null> {
  const options = cwd ? {path: getNpmRunPath(cwd)} : {}
  return which(cmd, options).catch(() => null)
}

function hasCommand(cmd: string, cwd?: string): Promise<boolean> {
  return getCommandPath(cmd, cwd).then((cmdPath) => cmdPath !== null)
}
