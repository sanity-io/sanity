// oxlint-disable no-console
// Serves the Rust studio the way the test studio's Vercel deployment does, on localhost:3333, the
// only local origin the test studio's project allows:
//
//   node scripts/build.mjs && node scripts/serve.mjs
//
// `/rust/*` serves `dist` with `/rust/index.html` as the fallback. Everything else serves the JS
// studio's `sanity build` output (`../test-studio/dist`) when it exists, so both studios share an
// origin, and with it the login token, like they do on the deployment.
import {createReadStream, existsSync, statSync} from 'node:fs'
import {createServer} from 'node:http'
import {dirname, extname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const {values: args} = parseArgs({
  options: {
    port: {type: 'string', default: '3333'},
    rust: {type: 'string', default: join(root, 'dist')},
    studio: {type: 'string', default: join(root, '../test-studio/dist')},
  },
})

const TYPES = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
}

function file(dir, pathname) {
  const path = join(dir, decodeURIComponent(pathname))
  return path.startsWith(dir) && existsSync(path) && statSync(path).isFile() ? path : null
}

const rustDir = resolve(args.rust)
const studioDir = resolve(args.studio)

createServer((request, response) => {
  const {pathname} = new URL(request.url ?? '/', 'http://localhost')
  const rust = pathname === '/rust' || pathname.startsWith('/rust/')
  const path = rust
    ? (file(rustDir, pathname.slice('/rust'.length)) ?? file(rustDir, 'index.html'))
    : (file(studioDir, pathname) ?? file(studioDir, 'index.html'))
  if (!path) {
    response.writeHead(404, {'content-type': 'text/plain'}).end(`Not found: ${pathname}`)
    return
  }
  response.writeHead(200, {
    'cache-control': 'no-cache',
    'content-type': TYPES[extname(path)] ?? 'application/octet-stream',
  })
  createReadStream(path).pipe(response)
}).listen(Number(args.port), () => {
  console.log(`Rust studio: http://localhost:${args.port}/rust/`)
  if (existsSync(studioDir)) console.log(`JS studio:   http://localhost:${args.port}/test`)
})
