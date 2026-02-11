import {
  type CliCommandContext,
  type CliConfig,
  type ReactCompilerConfig,
  type UserViteConfig,
} from '@sanity/cli'
import {type ViteDevServer} from 'vite'

import {debug} from './debug'
import {extendViteConfigWithUserConfig, getViteConfig, type ViteOptions} from './getViteConfig'
import {writeSanityRuntime} from './runtime'

export interface SchemaExtractionOptions {
  enabled: boolean
  outputPath?: string
  workspaceName?: string
}

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

  /**
   * Typegen configuration. When enabled, types are generated on startup
   * and when query files or schema.json change.
   */
  typegen?: CliConfig['typegen'] & {enabled?: boolean}

  /**
   * Telemetry logger for tracking plugin usage
   */
  telemetryLogger?: CliCommandContext['telemetry']

  /** Schema extraction options */
  schemaExtraction?: ViteOptions['schemaExtraction']
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
    typegen,
    telemetryLogger,
    schemaExtraction,
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
    typegen,
    telemetryLogger,
    schemaExtraction,
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
