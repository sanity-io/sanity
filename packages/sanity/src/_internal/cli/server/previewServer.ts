import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import {InlineConfig, preview} from 'vite'
import {debug as serverDebug} from './debug'
import {sanityBasePathRedirectPlugin} from './vite/plugin-sanity-basepath-redirect'

const debug = serverDebug.extend('preview')

export interface PreviewServer {
  urls: {local: string[]; network: string[]}
  close(): Promise<void>
}

export interface PreviewServerOptions {
  root: string
  cwd: string

  httpPort: number
  httpHost?: string

  vite?: (config: InlineConfig) => InlineConfig
}

export async function startPreviewServer(options: PreviewServerOptions): Promise<PreviewServer> {
  const {httpPort, httpHost, root} = options
  const startTime = Date.now()

  const indexPath = path.join(root, 'index.html')
  let basePath: string | undefined
  try {
    const index = await fs.readFile(indexPath, 'utf8')
    basePath = tryResolveBasePathFromIndex(index)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }

    const error = new Error(
      `Could not find a production build in the '${root}' directory.\nTry building your studio app with 'sanity build' before starting the preview server.`
    )
    error.name = 'BUILD_NOT_FOUND'
    throw error
  }

  const previewConfig: InlineConfig = {
    root,
    base: basePath || '/',
    plugins: [sanityBasePathRedirectPlugin(basePath)],
    configFile: false,
    preview: {
      port: httpPort,
      host: httpHost,
      strictPort: true,
    },
    // Needed for vite to not serve `root/dist`
    build: {
      outDir: root,
    },
  }

  debug('Creating vite server')
  const server = await preview(previewConfig)
  const warn = server.config.logger.warn
  const info = server.config.logger.info
  const url = server.resolvedUrls.local[0]

  if (typeof basePath === 'undefined') {
    warn('Could not determine base path from index.html, using "/" as default')
  } else if (basePath && basePath !== '/') {
    info(`Using resolved base path from static build: ${chalk.cyan(basePath)}`)
  }

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

function tryResolveBasePathFromIndex(index: string): string | undefined {
  // <script ... src="/some-base-path/static/sanity-a3cc3d86.js"></script>
  const basePath = index.match(/<script[^>]+src="(.*?)\/static\/sanity-/)?.[1]

  // We _expect_ to be able to find the base path. If we can't, we should warn.
  // Note that we're checking for `undefined` here, since an empty string is a
  // valid base path.
  if (typeof basePath === 'undefined') {
    return undefined
  }

  // In the case of an empty base path, we still want to return `/` to indicate
  // that we _found_ the basepath - it just happens to be empty. Eg:
  // <script ... src = "/static/sanity-a3cc3d86.js"></script>
  // Which differs from not being able to find the script tag at all, in which
  // case we'll want to show a warning to indicate that it is an abnormality.
  return basePath === '' ? '/' : basePath
}
