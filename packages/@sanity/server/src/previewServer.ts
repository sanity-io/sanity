import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import {InlineConfig, preview} from 'vite'
import {debug} from './debug'
import {getViteConfig} from './getViteConfig'

export interface PreviewServer {
  urls: {local: string[]; network: string[]}
  close(): Promise<void>
}

export interface PreviewServerOptions {
  root: string
  cwd: string
  basePath: string

  httpPort: number
  httpHost?: string

  vite?: (config: InlineConfig) => InlineConfig
}

export async function startPreviewServer(options: PreviewServerOptions): Promise<PreviewServer> {
  const {cwd, httpPort, httpHost, basePath: base, vite: extendViteConfig, root} = options
  const startTime = Date.now()

  // eslint-disable-next-line no-sync
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    throw new Error(
      `Could not find a production build in the '${root}' directory. Try building your app with 'sanity build' before starting the preview server.`
    )
  }

  debug('Resolving vite config')
  let viteConfig = await getViteConfig({
    basePath: base || '/',
    mode: 'development',
    server: {port: httpPort, host: httpHost},
    cwd,
  })

  if (extendViteConfig) {
    viteConfig = extendViteConfig(viteConfig)
  }

  viteConfig.root = root
  viteConfig.preview = {
    port: httpPort,
    host: httpHost,
    strictPort: true,
  }

  debug('Creating vite server')
  const server = await preview(viteConfig)
  const info = server.config.logger.info
  const url = server.resolvedUrls.local[0]

  const startupDuration = Date.now() - startTime

  info(
    `Sanity Studio ` +
      `using ${chalk.cyan(`vite@${require('vite/package.json').version}`)} ` +
      `ready in ${chalk.cyan(`${Math.ceil(startupDuration)}ms`)} ` +
      `and running at ${chalk.cyan(url)} (production preview mode)`
  )

  return {
    urls: server.resolvedUrls,
    close: () =>
      new Promise((resolve, reject) =>
        server.httpServer.close((err) => (err ? reject(err) : resolve()))
      ),
  }
}
