import type {CliConfig} from '@sanity/cli'
import {ensureTrailingSlash} from './ensureTrailingSlash'

export function gracefulServerDeath(
  command: 'start' | 'dev' | 'preview',
  httpHost: string | undefined,
  httpPort: number,
  err: Error & {code?: string},
): void {
  if (err.code === 'EADDRINUSE') {
    throw new Error(
      `Port number is already in use, configure \`server.port\` in \`sanity.cli.js\` or pass \`--port <somePort>\` to \`sanity ${command}\``,
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

/**
 * Resolves the shared configuration for the dev/preview server using:
 *
 * - CLI flags
 * - Environment variables
 * - User build config
 * - Default configuration
 */
export function getSharedServerConfig({
  flags,
  workDir,
  cliConfig,
}: {
  flags: {host?: string; port?: string}
  workDir: string
  cliConfig?: CliConfig
}): {
  cwd: string
  httpPort: number
  httpHost: string
  basePath: string
  vite: CliConfig['vite']
} {
  // Order of preference: CLI flags, environment variables, user build config, default config
  const env = process.env // eslint-disable-line no-process-env

  const httpHost =
    flags.host || env.SANITY_STUDIO_SERVER_HOSTNAME || cliConfig?.server?.hostname || 'localhost'

  const httpPort = toInt(
    flags.port || env.SANITY_STUDIO_SERVER_PORT || cliConfig?.server?.port,
    3333,
  )

  const basePath = ensureTrailingSlash(
    env.SANITY_STUDIO_BASEPATH ?? (cliConfig?.project?.basePath || '/'),
  )

  return {
    cwd: workDir,
    httpPort,
    httpHost,
    basePath,
    vite: cliConfig?.vite,
  }
}

function toInt(value: string | number | undefined, defaultValue: number): number {
  if (typeof value === 'undefined') {
    return defaultValue
  }

  const intVal = parseInt(`${value}`, 10)
  return Number.isFinite(intVal) ? intVal : defaultValue
}
