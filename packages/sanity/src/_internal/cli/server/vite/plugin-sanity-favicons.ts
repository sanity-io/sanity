import path from 'path'
import fs from 'fs/promises'
import type {Plugin} from 'vite'
import {generateWebManifest} from '../webManifest'

const mimeTypes: Record<string, string | undefined> = {
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

export function sanityFaviconsPlugin({
  faviconsPath,
  staticUrlPath,
}: {
  faviconsPath: string
  staticUrlPath: string
}): Plugin {
  const cache: {favicons?: string[]} = {}

  async function getFavicons(): Promise<string[]> {
    if (cache.favicons) {
      return cache.favicons
    }

    cache.favicons = await fs.readdir(faviconsPath)
    return cache.favicons
  }

  return {
    name: 'sanity/server/sanity-favicons',
    apply: 'serve',
    configureServer(viteDevServer) {
      const webManifest = JSON.stringify(generateWebManifest(staticUrlPath), null, 2)
      const webManifestPath = `${staticUrlPath}/manifest.webmanifest`

      return () => {
        viteDevServer.middlewares.use(async (req, res, next) => {
          if (req.url?.endsWith(webManifestPath)) {
            res.writeHead(200, 'OK', {'content-type': 'application/manifest+json'})
            res.write(webManifest)
            res.end()
            return
          }

          const parsedUrl =
            (req as any)._parsedUrl || new URL(req.url || '/', 'http://localhost:3333')

          const icons = await getFavicons()
          const fileName = path.basename(parsedUrl.pathname || '')
          if (!icons.includes(fileName)) {
            next()
            return
          }

          const mimeType = mimeTypes[path.extname(fileName)] || 'application/octet-stream'
          res.writeHead(200, 'OK', {'content-type': mimeType})
          res.write(await fs.readFile(path.join(faviconsPath, fileName)))
          res.end()
        })
      }
    },
  }
}
