import {type ReactCompilerConfig, type UserViteConfig} from '@sanity/cli'
import {type ViteDevServer} from 'vite'

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
  entry?: string
  isApp?: boolean
}

export interface DevServer {
  server: ViteDevServer
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
    entry,
    isApp,
  } = options

  debug('Writing Sanity runtime files')
  await writeSanityRuntime({cwd, reactStrictMode, watch: true, basePath, entry, isApp})

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

  debug('Listening on specified port')
  await server.listen()

  return {
    server,
    close: () => server.close(),
  }
}
