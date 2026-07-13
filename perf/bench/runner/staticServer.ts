import * as fs from 'node:fs'
import * as http from 'node:http'
import * as http2 from 'node:http2'
import path from 'node:path'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'

const gzip = promisify(zlib.gzip)

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.map'])

export interface StaticServer {
  url: string
  close: () => Promise<void>
}

/**
 * Serve a `sanity build` output directory with SPA fallback to index.html
 * and gzip for text assets (transfer size matters under the pageLoad mode's
 * network emulation, and production studios serve compressed responses).
 * HTTP/2 over TLS when a cert is provided — same production-protocol
 * rationale as the mock API (mock-api/tls.ts).
 */
export async function serveStatic(options: {
  dir: string
  port: number
  tls?: {key: string | Buffer; cert: string | Buffer}
}): Promise<StaticServer> {
  const root = path.resolve(options.dir)
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    throw new Error(`Not a studio build output (no index.html): ${root}`)
  }

  // Pre-compress into memory on first request; a studio dist is small enough
  // (tens of MB) that this beats per-request compression noise.
  const cache = new Map<string, {body: Buffer; headers: Record<string, string>}>()

  async function load(
    filePath: string,
    acceptsGzip: boolean,
  ): Promise<{body: Buffer; headers: Record<string, string>}> {
    const key = `${filePath}${acceptsGzip ? ':gz' : ''}`
    const cached = cache.get(key)
    if (cached) {
      return cached
    }
    const ext = path.extname(filePath)
    const raw = await fs.promises.readFile(filePath)
    const compress = acceptsGzip && COMPRESSIBLE.has(ext)
    const body = compress ? await gzip(raw) : raw
    const entry = {
      body,
      headers: {
        'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'content-length': String(body.byteLength),
        // Hashed static assets are immutable (warm loads must hit the HTTP
        // cache, like production CDNs); the HTML entry always revalidates
        'cache-control': filePath.includes(`${path.sep}static${path.sep}`)
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
        ...(compress ? {'content-encoding': 'gzip'} : {}),
      },
    }
    cache.set(key, entry)
    return entry
  }

  const listener = (
    req: http.IncomingMessage | http2.Http2ServerRequest,
    res: http.ServerResponse | http2.Http2ServerResponse,
  ) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const requested = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '')
    let filePath = path.join(root, requested)
    if (
      !filePath.startsWith(root) ||
      !fs.existsSync(filePath) ||
      fs.statSync(filePath).isDirectory()
    ) {
      filePath = path.join(root, 'index.html') // SPA fallback
    }
    const acceptsGzip = String(req.headers['accept-encoding'] ?? '').includes('gzip')
    // The h1/h2 writeHead overloads are incompatible when called through the
    // union type (same workaround as mock-api/sse.ts)
    const writeHead = res.writeHead.bind(res) as (
      status: number,
      headers?: Record<string, string>,
    ) => void
    load(filePath, acceptsGzip).then(
      ({body, headers}) => {
        writeHead(200, headers)
        res.end(body)
      },
      () => {
        writeHead(500)
        res.end('static server error')
      },
    )
  }

  const server = options.tls
    ? http2.createSecureServer({...options.tls, allowHTTP1: true}, listener)
    : http.createServer(listener)

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port, '127.0.0.1', () => resolve())
  })

  return {
    url: `${options.tls ? 'https' : 'http'}://localhost:${options.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
        // h1 servers expose closeAllConnections; h2 sessions end via close()
        ;(server as Partial<http.Server>).closeAllConnections?.()
      }),
  }
}
