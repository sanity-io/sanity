import * as fs from 'node:fs'
import * as http2 from 'node:http2'
import path from 'node:path'

/** Where the auto-updating bench build fetches `sanity` from (SANITY_MODULES_HOST). */
export const MODULE_HOST_PORT = 4313
export const MODULE_HOST_URL = `https://localhost:${MODULE_HOST_PORT}`

const CDN_PREFIX = '/cdn/'

/**
 * Maps a module CDN URL path to the bundle file it serves: the import map points `sanity` at
 * `/v1/modules/sanity/default/<range>/t<timestamp>` and `sanity/structure` at that URL plus
 * `/structure`, and the stylesheet at `…/index.css`. Undefined for anything else.
 */
export function cdnFileForPath(pathname: string): string | undefined {
  if (pathname.startsWith(CDN_PREFIX)) return decodeURIComponent(pathname.slice(CDN_PREFIX.length))
  const match = /^\/v1\/modules\/sanity\/default\/[^/]+\/t\d+(?:\/(.+))?$/.exec(pathname)
  if (!match) return undefined
  const sub = match[1]
  if (!sub) return 'index.mjs'
  return sub.endsWith('.css') ? sub : `${sub}.mjs`
}

export interface ModuleHost {
  close: () => Promise<void>
}

/**
 * A stand-in for the Sanity module CDN serving a local CDN bundle build. Entry URLs redirect to
 * the bundle file, as the real CDN redirects to a versioned file, so each chunk is fetched (and
 * evaluated) once under one URL however it is reached, and chunk-relative imports resolve
 * against `/cdn/`.
 */
export async function serveModuleHost(options: {
  dir: string
  tls: {key: string | Buffer; cert: string | Buffer}
}): Promise<ModuleHost> {
  const root = path.resolve(options.dir)
  const server = http2.createSecureServer({...options.tls, allowHTTP1: true}, (req, res) => {
    const url = new URL(req.url ?? '/', MODULE_HOST_URL)
    const cors = {'access-control-allow-origin': '*'}
    if (!url.pathname.startsWith(CDN_PREFIX)) {
      const file = cdnFileForPath(url.pathname)
      if (file) {
        res.writeHead(302, {
          ...cors,
          'location': `${CDN_PREFIX}${file}`,
          'cache-control': 'no-cache',
        })
        res.end()
        return
      }
      res.writeHead(404, cors)
      res.end()
      return
    }
    const file = path.join(root, cdnFileForPath(url.pathname) ?? '')
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404, cors)
      res.end()
      return
    }
    const body = fs.readFileSync(file)
    res.writeHead(200, {
      ...cors,
      'content-type': file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript',
      'content-length': String(body.byteLength),
      'cache-control': 'public, max-age=31536000, immutable',
    })
    res.end(body)
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(MODULE_HOST_PORT, resolve)
  })
  return {
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve())
      }),
  }
}
