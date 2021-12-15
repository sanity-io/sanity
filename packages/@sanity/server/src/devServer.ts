import {promisify} from 'util'
import chalk from 'chalk'
import express from 'express'
import {createServer} from 'vite'
import {getViteConfig} from './getViteConfig'
import {renderDocument} from './renderDocument'
import {debug} from './debug'

export interface DevServerOptions {
  cwd: string
  basePath: string
  staticPath: string

  httpPort: number
  httpHost: string
  projectName?: string
}

export interface DevServer {
  close(): Promise<void>
}

export async function startDevServer(options: DevServerOptions): Promise<DevServer> {
  const {cwd, httpPort, httpHost, basePath: base, staticPath} = options
  const startTime = performance.now()

  debug('Resolving vite config')
  const viteConfig = await getViteConfig({
    basePath: base || '/',
    cwd,
    mode: 'development',
  })

  const basePath = viteConfig.base
  const staticBasePath = `${basePath}static`

  debug('Creating vite server')
  const vite = await createServer(viteConfig)
  const info = vite.config.logger.info
  const app = express()

  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  // Allow serving static files
  app.use(staticBasePath, express.static(staticPath))

  // Use index.html as fallback (single-page app routing)
  app.use('*', async (req, res) => {
    const url = req.originalUrl

    // Static requests for files that does not exist should give 404
    if (url.startsWith(staticBasePath)) {
      res.status(404).send('File not found')
      return
    }

    // If the user has defined a base path, make sure we redirect to it
    if (!url.startsWith(basePath) && url === '/') {
      res.redirect(302, basePath)
      return
    }

    try {
      const template = await renderDocument({studioRootPath: cwd})
      const html = await vite.transformIndexHtml(url, template)
      res.status(200).type('html').end(html)
    } catch (e) {
      // If an error is caught, let Vite fix the stracktrace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })

  return new Promise((resolve, reject) => {
    debug('Starting HTTP server')
    const server = app
      .listen(httpPort, httpHost, () => {
        debug('Dev server listening')
        const startupDuration = performance.now() - startTime
        info(
          `Sanity Studio ` +
            `using ${chalk.cyan(`vite@${require('vite/package.json').version}`)} ` +
            `ready in ${chalk.cyan(`${Math.ceil(startupDuration)}ms`)} ` +
            `and running at ${chalk.cyan(`http://${httpHost}:${httpPort}`)}`
        )

        const closeApp = promisify(server.close.bind(server))
        const close = () => Promise.all([vite.close(), closeApp()]).then(() => undefined)

        resolve({close})
      })
      .on('error', (err) => {
        debug(`Failed to start server: ${err.message}`)
        reject(err)
      })
  })
}
