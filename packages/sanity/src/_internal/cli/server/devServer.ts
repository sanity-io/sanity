import chalk from 'chalk'
import {createServer} from 'vite'
import type {UserViteConfig} from '@sanity/cli'
import {extendViteConfigWithUserConfig, getViteConfig} from './getViteConfig'
import {debug} from './debug'
import {writeSanityRuntime} from './runtime'

export interface DevServerOptions {
  cwd: string
  basePath: string
  staticPath: string

  httpPort: number
  httpHost?: string
  projectName?: string

  reactStrictMode: boolean
  vite?: UserViteConfig
}

export interface DevServer {
  close(): Promise<void>
}

export async function startDevServer(options: DevServerOptions): Promise<DevServer> {
  const {cwd, httpPort, httpHost, basePath, reactStrictMode, vite: extendViteConfig} = options

  const startTime = Date.now()
  debug('Writing Sanity runtime files')
  await writeSanityRuntime({cwd, reactStrictMode, watch: true, basePath})

  debug('Resolving vite config')
  const mode = 'development'
  let viteConfig = await getViteConfig({
    basePath,
    mode: 'development',
    server: {port: httpPort, host: httpHost},
    cwd,
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
  const server = await createServer(viteConfig)
  const info = server.config.logger.info

  debug('Listening on specified port')
  await server.listen()

  const startupDuration = Date.now() - startTime
  const url = `http://${httpHost || 'localhost'}:${httpPort || '3333'}${basePath}`
  info(
    `Sanity Studio ` +
      `using ${chalk.cyan(`vite@${require('vite/package.json').version}`)} ` +
      `ready in ${chalk.cyan(`${Math.ceil(startupDuration)}ms`)} ` +
      `and running at ${chalk.cyan(url)}`,
  )

  return {close: () => server.close()}
}
