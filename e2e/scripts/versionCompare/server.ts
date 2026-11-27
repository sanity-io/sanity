import {existsSync, readFileSync, statSync} from 'node:fs'
import {createServer, type IncomingHttpHeaders} from 'node:http'
import {createSecureServer} from 'node:http2'
import path from 'node:path'
import {brotliCompressSync, constants, gzipSync} from 'node:zlib'

import {getStudioTls, STUDIO_HOST, type StudioTls} from './tls'

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

const COMPRESSIBLE = new Set(['.css', '.html', '.js', '.json', '.mjs', '.svg'])
const compressed = new Map<string, Buffer>()

/** Compressed like a CDN would (brotli, then gzip), once per file: the point is the bytes sent. */
function encode(file: string, encoding: 'br' | 'gzip'): Buffer {
  const key = `${encoding}:${file}:${statSync(file).mtimeMs}`
  let body = compressed.get(key)
  if (!body) {
    const raw = readFileSync(file)
    body =
      encoding === 'br'
        ? brotliCompressSync(raw, {params: {[constants.BROTLI_PARAM_QUALITY]: 11}})
        : gzipSync(raw, {level: 9})
    compressed.set(key, body)
  }
  return body
}

/** What the HTTP/1.1 and HTTP/2 compatibility APIs have in common. */
interface ServerRequest {
  headers: IncomingHttpHeaders
  url?: string
}

interface ServerResponse {
  end(): unknown
  end(body: Uint8Array): unknown
  writeHead(status: number, headers?: Record<string, string | number>): unknown
}

export type HttpVersion = '1.1' | '2'

export interface StaticServer {
  /** Chromium launch arguments the browser needs to reach this server and trust its certificate. */
  browserArgs: string[]
  close(): Promise<void>
  /** Serve a different build from the same origin (the project's CORS list is origin-bound). */
  setRoot(root: string): void
  url: string
}

export interface StaticServerOptions {
  /** `2` serves HTTP/2 over TLS like a CDN does; `1.1` is plain HTTP, six connections per host. */
  httpVersion: HttpVersion
  port: number
  /** Where the HTTP/2 certificate is cached. */
  certDir: string
}

/**
 * Serves a built studio, falling back to `index.html` for client-side routes.
 *
 * Browsers speak HTTP/2 only over TLS, and the project's CORS list only admits `https://*.sanity.dev`
 * on the default port, so the HTTP/2 server is reached as `https://<STUDIO_HOST>`: the browser maps
 * that host to the local port, and trusts the certificate by its public key.
 */
export async function startStaticServer(options: StaticServerOptions): Promise<StaticServer> {
  const {certDir, httpVersion, port} = options
  let root = ''
  const listener = (req: ServerRequest, res: ServerResponse) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
    let file = path.join(root, path.normalize(pathname))
    if (!file.startsWith(root)) {
      res.writeHead(403)
      res.end()
      return
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      file = path.extname(pathname) ? '' : path.join(root, 'index.html')
    }
    if (!file || !existsSync(file)) {
      res.writeHead(404)
      res.end()
      return
    }
    const extension = path.extname(file)
    const accepted = String(req.headers['accept-encoding'] ?? '')
    const encoding = !COMPRESSIBLE.has(extension)
      ? null
      : /\bbr\b/.test(accepted)
        ? 'br'
        : /\bgzip\b/.test(accepted)
          ? 'gzip'
          : null
    const body = encoding ? encode(file, encoding) : readFileSync(file)
    res.writeHead(200, {
      'content-length': body.length,
      'content-type': CONTENT_TYPES[extension] ?? 'application/octet-stream',
      ...(encoding ? {'content-encoding': encoding, 'vary': 'accept-encoding'} : {}),
    })
    res.end(body)
  }

  let tls: StudioTls | undefined
  if (httpVersion === '2') tls = await getStudioTls(certDir)
  const server = tls
    ? createSecureServer({allowHTTP1: true, cert: tls.cert, key: tls.key}, listener)
    : createServer(listener)

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () =>
      resolve({
        browserArgs: tls
          ? [
              `--host-resolver-rules=MAP ${STUDIO_HOST} 127.0.0.1:${port}`,
              `--ignore-certificate-errors-spki-list=${tls.spki}`,
            ]
          : [],
        close: () => {
          return new Promise((done) => {
            server.close(() => done())
            if ('closeAllConnections' in server) server.closeAllConnections()
          })
        },
        setRoot: (next) => {
          root = path.resolve(next)
        },
        url: tls ? `https://${STUDIO_HOST}` : `http://localhost:${port}`,
      }),
    )
  })
}
