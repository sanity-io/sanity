import {existsSync, readFileSync, statSync} from 'node:fs'
import {createServer, type Server} from 'node:http'
import path from 'node:path'
import {brotliCompressSync, constants, gzipSync} from 'node:zlib'

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

export interface StaticServer {
  close(): Promise<void>
  /** Serve a different build from the same origin (the project's CORS list is origin-bound). */
  setRoot(root: string): void
  url: string
}

/** Serves a built studio over plain HTTP, falling back to `index.html` for client-side routes. */
export function startStaticServer(port: number): Promise<StaticServer> {
  let root = ''
  const server: Server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
    let file = path.join(root, path.normalize(pathname))
    if (!file.startsWith(root)) {
      res.writeHead(403).end()
      return
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      file = path.extname(pathname) ? '' : path.join(root, 'index.html')
    }
    if (!file || !existsSync(file)) {
      res.writeHead(404).end()
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
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () =>
      resolve({
        close: () => new Promise((done) => server.close(() => done())),
        setRoot: (next) => {
          root = path.resolve(next)
        },
        url: `http://localhost:${port}`,
      }),
    )
  })
}
