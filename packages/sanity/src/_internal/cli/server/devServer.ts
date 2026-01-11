import {type ReactCompilerConfig, type UserViteConfig} from '@sanity/cli'
import {type InlineConfig, type ViteDevServer} from 'vite'

import {debug} from './debug'
import {extendViteConfigWithUserConfig} from './getViteConfig'
import {sanityStudioPlugin} from './vite/plugin-sanity-studio'

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
    isApp,
  } = options

  // Skip plugin for app mode (non-studio)
  if (isApp) {
    // For apps, use the existing implementation
    // Import and delegate to the original logic
    const {writeSanityRuntime} = await import('./runtime')
    const {getViteConfig} = await import('./getViteConfig')

    debug('Writing Sanity runtime files for app')
    await writeSanityRuntime({
      cwd,
      reactStrictMode,
      watch: true,
      basePath,
      entry: options.entry,
      isApp,
    })

    let viteConfig = await getViteConfig({
      basePath,
      mode: 'development',
      server: {port: httpPort, host: httpHost},
      cwd,
      reactCompiler: options.reactCompiler,
      isApp,
    })

    if (extendViteConfig) {
      viteConfig = await extendViteConfigWithUserConfig(
        {command: 'serve', mode: 'development'},
        viteConfig,
        extendViteConfig,
      )
    }

    const {createServer} = await import('vite')
    const server = await createServer(viteConfig)
    await server.listen()
    return {server, close: () => server.close()}
  }

  debug('Starting dev server with studio plugin')
  const mode = 'development'

  let viteConfig: InlineConfig = {
    root: cwd,
    mode,
    server: {
      port: httpPort,
      host: httpHost,
      strictPort: true,
    },
    plugins: [
      sanityStudioPlugin({
        basePath,
        reactStrictMode,
      }),
    ],
  }

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
