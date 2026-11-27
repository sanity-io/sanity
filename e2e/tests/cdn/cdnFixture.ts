import {createReadStream, existsSync} from 'node:fs'
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http'
import {createRequire} from 'node:module'
import {type AddressInfo} from 'node:net'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

// oxlint-disable-next-line no-restricted-imports -- CDN tests use raw Playwright (no studio-test fixtures)
import {test as base} from '@playwright/test'
import {build} from 'esbuild'

const sanityPackageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../packages/sanity',
)
const bundleDir = path.join(sanityPackageDir, 'dist')

const VENDOR_MODULES = [
  'react',
  'react/jsx-runtime',
  'react/compiler-runtime',
  'react-dom',
  'react-dom/client',
  'react-dom/server',
  'styled-components',
]

export const PROJECT_ID = 'ppsg7ml5'

export interface RequestLog {
  readonly redirector: string[]
  readonly bucket: string[]
}

export interface CdnSetup {
  readonly appUrl: string
  readonly redirectorOrigin: string
  readonly bucketOrigin: string
  readonly requests: RequestLog
  /** The `./chunk.mjs` specifiers the built `index` entry preloads. */
  readonly preloadSpecifiers: readonly string[]
}

async function vendorBundle(outDir: string) {
  const requireFromSanity = createRequire(path.join(sanityPackageDir, 'package.json'))
  const entryDir = path.join(outDir, 'entries')
  const entryPoints: Record<string, string> = {}

  for (const name of VENDOR_MODULES) {
    const exported = requireFromSanity(name) as Record<string, unknown>
    const names = Object.keys(exported).filter(
      (key) => key !== 'default' && /^[A-Za-z_$][\w$]*$/.test(key),
    )
    const file = path.join(entryDir, `${name.replaceAll('/', '__')}.js`)
    await mkdir(path.dirname(file), {recursive: true})
    await writeFile(
      file,
      [
        `const m = require(${JSON.stringify(name)})`,
        `export default m && m.__esModule && 'default' in m ? m.default : m`,
        `export const {${names.join(', ')}} = m`,
      ].join('\n'),
    )
    entryPoints[name] = file
  }

  const emptyModule = path.join(entryDir, 'empty.js')
  await writeFile(emptyModule, 'module.exports = {}')

  await build({
    entryPoints,
    nodePaths: [path.join(sanityPackageDir, 'node_modules')],
    alias: {stream: emptyModule, util: emptyModule},
    outdir: path.join(outDir, 'vendor'),
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    define: {'process.env.NODE_ENV': '"production"'},
    logLevel: 'error',
  })
}

async function appBundle(outDir: string) {
  const entry = path.join(outDir, 'app-entry.js')
  await writeFile(
    entry,
    `import {defineConfig, renderStudio} from 'sanity'
renderStudio(
  document.getElementById('root'),
  defineConfig({
    projectId: ${JSON.stringify(PROJECT_ID)},
    dataset: 'test',
    auth: {loginMethod: 'token'},
  }),
)
`,
  )
  await build({
    entryPoints: [entry],
    outfile: path.join(outDir, 'app.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    external: ['sanity', 'sanity/*'],
    logLevel: 'error',
  })
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve())
    server.closeAllConnections()
  })
}

function sendFile(res: ServerResponse, file: string, headers: Record<string, string>) {
  if (!existsSync(file)) {
    res.writeHead(404, headers).end()
    return
  }
  res.writeHead(200, {
    ...headers,
    'content-type': file.endsWith('.map') ? 'application/json' : 'text/javascript',
    'cache-control': 'public, max-age=31536000, immutable',
  })
  createReadStream(file).pipe(res)
}

function readPreloadSpecifiers(indexSource: string): string[] {
  const match = indexSource.match(/\[("\.\/[^"\]]+"(?:,"\.\/[^"\]]+")*)\]/)
  if (!match) throw new Error('The built `index` entry holds no preload list')
  return JSON.parse(`[${match[1]}]`)
}

/**
 * Serves an auto-updating studio the way the module CDN does: a host page whose import map points
 * at a redirecting origin that answers every request with a cross-origin 302 to a bucket origin,
 * which serves the built bundle with `Access-Control-Allow-Origin: *` and nothing else (no
 * credentials header). Everything the studio imports resolves against the bucket origin.
 */
async function startCdn() {
  const tmp = await mkdtemp(path.join(tmpdir(), 'sanity-cdn-e2e-'))
  const requests: {redirector: string[]; bucket: string[]} = {redirector: [], bucket: []}

  await Promise.all([vendorBundle(tmp), appBundle(tmp)])

  const preloadSpecifiers = readPreloadSpecifiers(
    await readFile(path.join(bundleDir, 'index.mjs'), 'utf8'),
  )

  const bucket = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url!, 'http://bucket.test').pathname
    requests.bucket.push(pathname)
    const headers = {'access-control-allow-origin': '*'}
    if (pathname.startsWith('/sanity/')) {
      sendFile(res, path.join(bundleDir, pathname.slice('/sanity/'.length)), headers)
    } else if (pathname.startsWith('/vendor/')) {
      sendFile(res, path.join(tmp, pathname), headers)
    } else {
      res.writeHead(404, headers).end()
    }
  })
  const bucketPort = await listen(bucket)
  const bucketOrigin = `http://127.0.0.1:${bucketPort}`

  const redirector = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url!, 'http://redirector.test').pathname
    requests.redirector.push(pathname)
    const target = pathname.startsWith('/sanity/')
      ? `${bucketOrigin}${pathname}.mjs`
      : `${bucketOrigin}${pathname}.js`
    res.writeHead(302, {'location': target, 'access-control-allow-origin': '*'}).end()
  })
  const redirectorPort = await listen(redirector)
  const redirectorOrigin = `http://localhost:${redirectorPort}`

  const imports: Record<string, string> = {
    'sanity': `${redirectorOrigin}/sanity/index`,
    'sanity/': `${redirectorOrigin}/sanity/`,
  }
  for (const name of VENDOR_MODULES) imports[name] = `${redirectorOrigin}/vendor/${name}`

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script type="importmap">${JSON.stringify({imports})}</script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`
  const app = createServer((req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url!, 'http://app.test').pathname
    if (pathname === '/app.js') {
      sendFile(res, path.join(tmp, 'app.js'), {})
    } else {
      res.writeHead(200, {'content-type': 'text/html'}).end(html)
    }
  })
  const appPort = await listen(app)

  const setup: CdnSetup = {
    appUrl: `http://127.0.0.1:${appPort}`,
    redirectorOrigin,
    bucketOrigin,
    requests,
    preloadSpecifiers,
  }

  return {
    setup,
    async stop() {
      await Promise.all([close(app), close(redirector), close(bucket)])
      await rm(tmp, {recursive: true, force: true})
    },
  }
}

export const test = base.extend<object, {cdn: CdnSetup}>({
  cdn: [
    // oxlint-disable-next-line no-empty-pattern -- Playwright requires a destructured first argument
    async ({}, use) => {
      if (!existsSync(path.join(bundleDir, 'index.mjs'))) {
        throw new Error(
          'The auto-updating bundle is not built: run `pnpm --filter sanity build:bundle` first',
        )
      }
      const cdn = await startCdn()
      await use(cdn.setup)
      await cdn.stop()
    },
    {scope: 'worker'},
  ],
})

export {expect} from '@playwright/test'
