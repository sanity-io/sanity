import path from 'path'
import {DevServerOptions, startDevServer} from '@sanity/server'
import {getTimer, TimeMeasurer} from '../../util/timing'
import type {CliCommandArguments, CliCommandContext} from '../../types'
import checkStudioDependencyVersions from '../../util/checkStudioDependencyVersions'
import {checkRequiredDependencies} from '../../util/checkRequiredDependencies'
import {getBuildConfig} from './getBuildConfig'

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
  const {output, workDir} = context

  // await ensureProjectConfig(context)

  timers.start('checkStudioDependencyVersions')
  await checkStudioDependencyVersions(workDir)
  timers.end('checkStudioDependencyVersions')

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await checkRequiredDependencies(context)).didInstall) {
    return
  }

  // Try to load build configuration from sanity.build.(js|ts)
  const configSpinner = output.spinner('Checking configuration files...')
  const config = await getDevServerConfig({flags, workDir, timers})
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
 *
 * @internal Exported for testing purposes only
 */
export async function getDevServerConfig({
  flags,
  workDir,
  timers,
}: {
  flags: StartDevServerCommandFlags
  workDir: string
  timers: TimeMeasurer
}): Promise<DevServerOptions> {
  timers.start('getBuildConfig')
  const buildConfig = (await getBuildConfig()) || {}
  timers.end('getBuildConfig')

  // Order of preference: CLI flags, environment variables, user build config, default config
  const env = process.env // eslint-disable-line no-process-env

  const httpHost =
    flags.host || env.SANITY_STUDIO_SERVER_HOSTNAME || buildConfig.server?.hostname || '127.0.0.1'

  const httpPort = toInt(
    flags.port || env.SANITY_STUDIO_SERVER_PORT || buildConfig.server?.port,
    3333
  )

  const basePath = env.SANITY_STUDIO_BASEPATH || buildConfig.project?.basePath
  const projectName = buildConfig.project?.name

  return {
    cwd: workDir,
    httpPort,
    httpHost,
    projectName,
    basePath,
    staticPath: path.join(workDir, 'static'),
  }
}

function gracefulDeath(
  httpHost: string | undefined,
  httpPort: number,
  err: Error & {code?: string}
) {
  if (err.code === 'EADDRINUSE') {
    throw new Error(
      'Port number is already in use, configure `server.port` in `sanity.build.js` or pass `--port <somePort>` to `sanity start`'
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
