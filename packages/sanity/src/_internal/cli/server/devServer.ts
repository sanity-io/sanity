import {type ReactCompilerConfig, type UserViteConfig} from '@sanity/cli'
import chalk from 'chalk'

import {debug} from './debug'
import {extendViteConfigWithUserConfig, getViteConfig} from './getViteConfig'
import {writeSanityRuntime} from './runtime'

export interface DevServerOptions {
  cwd: string
  basePath: string
  staticPath: string

  httpPort: number
  httpHost?: string
  projectName?: string

  reactStrictMode: boolean
  reactCompiler: ReactCompilerConfig | undefined
  vite?: UserViteConfig
  appLocation?: string
  isApp?: boolean
  skipStartLog?: boolean
}

export interface DevServer {
  close(): Promise<void>
}

export async function startDevServer(options: DevServerOptions): Promise<DevServer> {
  const {
    cwd,
    httpPort,
    httpHost,
    basePath,
    reactStrictMode,
    vite: extendViteConfig,
    reactCompiler,
    appLocation,
    isApp,
    skipStartLog,
  } = options

  const startTime = Date.now()
  debug('Writing Sanity runtime files')
  await writeSanityRuntime({cwd, reactStrictMode, watch: true, basePath, appLocation, isApp})

  debug('Resolving vite config')
  const mode = 'development'

  let viteConfig = await getViteConfig({
    basePath,
    mode: 'development',
    server: {port: httpPort, host: httpHost},
    cwd,
    reactCompiler,
    isApp,
  })

  // Extend Vite configuration with user-provided config
  if (extendViteConfig) {
    viteConfig = await extendViteConfigWithUserConfig(
      {command: 'serve', mode},
      viteConfig,
      extendViteConfig,
    )
  }

  debug('Creating vite server')
  const {createServer} = await import('vite')
  const server = await createServer(viteConfig)
  const info = server.config.logger.info

  debug('Listening on specified port')
  await server.listen()

  if (!skipStartLog) {
    const startupDuration = Date.now() - startTime
    const url = `http://${httpHost || 'localhost'}:${httpPort || '3333'}${basePath}`
    const appType = isApp ? 'Sanity application' : 'Sanity Studio'
    info(
      `${appType} ` +
        `using ${chalk.cyan(`vite@${require('vite/package.json').version}`)} ` +
        `ready in ${chalk.cyan(`${Math.ceil(startupDuration)}ms`)} ` +
        `and running at ${chalk.cyan(url)}`,
    )
  }
  return {close: () => server.close()}
}
