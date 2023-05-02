import path from 'path'
import fs from 'fs/promises'
import type {Plugin} from 'vite'
import {generateWebManifest} from '../webManifest'

const mimeTypes: Record<string, string | undefined> = {
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

/**
 * Fallback favicons plugin for Sanity.
 *
 * If a favicon is not found in the static folder, this plugin will serve the default
 * Sanity favicons from the npm bundle. If a custom `favicon.ico` is found in the static
 * folder, it will also be served for a root `/favicon.ico` request.
 *
 * @param options - Options for the plugin
 * @returns A Vite plugin
 * @internal
 */
export function sanityFaviconsPlugin({
  defaultFaviconsPath,
  customFaviconsPath,
  staticUrlPath,
}: {
  defaultFaviconsPath: string
  customFaviconsPath: string
  staticUrlPath: string
}): Plugin {
  const cache: {favicons?: string[]} = {}

  async function getFavicons(): Promise<string[]> {
    if (cache.favicons) {
      return cache.favicons
    }

    cache.favicons = await fs.readdir(defaultFaviconsPath)
    return cache.favicons
  }

  async function hasCustomFavicon(): Promise<boolean> {
    try {
      await fs.access(path.join(customFaviconsPath, 'favicon.ico'))
      return true
    } catch (err) {
      return false
    }
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
            ((req as any)._parsedUrl as URL) || new URL(req.url || '/', 'http://localhost:3333')

          const pathName = parsedUrl.pathname || ''
          const fileName = path.basename(pathName || '')
          const icons = await getFavicons()
          const isIconRequest =
            pathName.startsWith('/favicon.ico') ||
            (icons.includes(fileName) && pathName.includes(staticUrlPath))

          if (!isIconRequest) {
            next()
            return
          }

          const faviconPath =
            fileName === 'favicon.ico' && (await hasCustomFavicon())
              ? path.join(customFaviconsPath, 'favicon.ico')
              : path.join(defaultFaviconsPath, fileName)

          const mimeType = mimeTypes[path.extname(fileName)] || 'application/octet-stream'
          res.writeHead(200, 'OK', {'content-type': mimeType})
          res.write(await fs.readFile(faviconPath))
          res.end()
        })
      }
    },
  }
}
