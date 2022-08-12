import path from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore The `@sanity/server` may not be built yet.
import {DevServerOptions, startDevServer} from '@sanity/server'
import type {CliConfig, CliCommandArguments, CliCommandContext} from '@sanity/cli'
import {getTimer} from '../../util/timing'
import {checkStudioDependencyVersions} from '../../util/checkStudioDependencyVersions'
import {checkRequiredDependencies} from '../../util/checkRequiredDependencies'

interface StartDevServerCommandFlags {
  host?: string
  port?: string
}

export default async function startSanityDevServer(
  args: CliCommandArguments<StartDevServerCommandFlags>,
  context: CliCommandContext
): Promise<void> {
  const timers = getTimer()
  const flags = args.extOptions
  const {output, workDir, cliConfig} = context

  timers.start('checkStudioDependencyVersions')
  await checkStudioDependencyVersions(workDir)
  timers.end('checkStudioDependencyVersions')

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await checkRequiredDependencies(context)).didInstall) {
    return
  }

  // Try to load CLI configuration from sanity.cli.(js|ts)
  const configSpinner = output.spinner('Checking configuration files...')
  const config = getDevServerConfig({flags, workDir, cliConfig})
  configSpinner.succeed()

  try {
    await startDevServer(config)
  } catch (err) {
    gracefulDeath(config.httpHost, config.httpPort, err)
  }
}

/**
 * Resolves the configuration for the dev server using:
 *
 * - CLI flags
 * - Environment variables
 * - User build config
 * - Default configuration
 */
function getDevServerConfig({
  flags,
  workDir,
  cliConfig,
}: {
  flags: StartDevServerCommandFlags
  workDir: string
  cliConfig?: CliConfig
}): DevServerOptions {
  // Order of preference: CLI flags, environment variables, user build config, default config
  const env = process.env // eslint-disable-line no-process-env

  const httpHost =
    flags.host || env.SANITY_STUDIO_SERVER_HOSTNAME || cliConfig?.server?.hostname || 'localhost'

  const httpPort = toInt(
    flags.port || env.SANITY_STUDIO_SERVER_PORT || cliConfig?.server?.port,
    3333
  )

  const basePath = env.SANITY_STUDIO_BASEPATH || cliConfig?.project?.basePath || '/'

  return {
    cwd: workDir,
    httpPort,
    httpHost,
    basePath,
    staticPath: path.join(workDir, 'static'),
    vite: cliConfig?.vite,
  }
}

function gracefulDeath(
  httpHost: string | undefined,
  httpPort: number,
  err: Error & {code?: string}
) {
  if (err.code === 'EADDRINUSE') {
    throw new Error(
      'Port number is already in use, configure `server.port` in `sanity.cli.js` or pass `--port <somePort>` to `sanity start`'
    )
  }

  if (err.code === 'EACCES') {
    const help =
      httpPort < 1024
        ? 'port numbers below 1024 requires root privileges'
        : `do you have access to listen to the given host (${httpHost || '127.0.0.1'})?`

    throw new Error(`The studio server does not have access to listen to given port - ${help}`)
  }

  throw err
}

function toInt(value: string | number | undefined, defaultValue: number): number {
  if (typeof value === undefined) {
    return defaultValue
  }

  const intVal = parseInt(`${value}`, 10)
  return Number.isFinite(intVal) ? intVal : defaultValue
}
