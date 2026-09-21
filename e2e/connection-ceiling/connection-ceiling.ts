import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtemp, readFile} from 'node:fs/promises'
import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http'
import {
  createSecureServer,
  type Http2SecureServer,
  type Http2ServerRequest,
  type Http2ServerResponse,
} from 'node:http2'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {chromium, type Browser, type Page} from '@playwright/test'

const PING_MS = 3_000
const HTTP1_CAP = 6
const HTTP2_CAP = 100

interface Probe {
  status?: number
  error?: string
  ms: number
}

interface CeilingWindow extends Window {
  __ceilingSources?: EventSource[]
}

const EVENT_HEADERS = {
  'content-type': 'text/event-stream',
  'cache-control': 'no-cache',
} as const

function handleHttp1(stats: {open: number}, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  if (url.pathname === '/events') {
    stats.open += 1
    res.on('close', () => {
      stats.open -= 1
    })
    res.writeHead(200, EVENT_HEADERS)
    res.write(': hello\n\n')
    return
  }
  res.writeHead(200, {'content-type': 'text/plain'})
  res.end(url.pathname === '/ping' ? 'ok' : 'ceiling')
}

function handleHttp2(stats: {open: number}, req: Http2ServerRequest, res: Http2ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  if (url.pathname === '/events') {
    stats.open += 1
    res.on('close', () => {
      stats.open -= 1
    })
    res.writeHead(200, EVENT_HEADERS)
    res.write(': hello\n\n')
    return
  }
  res.writeHead(200, {'content-type': 'text/plain'})
  res.end(url.pathname === '/ping' ? 'ok' : 'ceiling')
}

function listen(server: Server | Http2SecureServer, protocol: 'http' | 'https'): Promise<string> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('expected a tcp port'))
        return
      }
      resolve(`${protocol}://127.0.0.1:${address.port}/`)
    })
  })
}

function closeServer(server: Server | Http2SecureServer): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve())
  })
}

function pollEqual(read: () => number, expected: number, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const started = Date.now()
    const timer = setInterval(() => {
      if (read() === expected) {
        clearInterval(timer)
        resolve()
        return
      }
      if (Date.now() - started < timeoutMs) return
      clearInterval(timer)
      reject(
        new assert.AssertionError({
          message: `open streams ${read()} !== ${expected}`,
          actual: read(),
          expected,
        }),
      )
    }, 50)
  })
}

async function holdEventSources(page: Page, total: number) {
  await page.evaluate((count) => {
    const view = window as CeilingWindow
    const existing = view.__ceilingSources ?? []
    for (let i = existing.length; i < count; i++) {
      existing.push(new EventSource(`/events?i=${i}`))
    }
    view.__ceilingSources = existing
  }, total)
}

async function releaseOneEventSource(page: Page) {
  await page.evaluate(() => {
    const view = window as CeilingWindow
    view.__ceilingSources?.pop()?.close()
  })
}

async function ping(page: Page): Promise<Probe> {
  return page.evaluate(async (timeoutMs) => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const started = performance.now()
    try {
      const res = await fetch(`/ping?t=${Date.now()}`, {signal: ctrl.signal})
      return {status: res.status, ms: Math.round(performance.now() - started)}
    } catch (error) {
      return {
        error: error instanceof Error ? error.name : 'Error',
        ms: Math.round(performance.now() - started),
      }
    } finally {
      clearTimeout(timer)
    }
  }, PING_MS)
}

async function withBrowser(run: (browser: Browser) => Promise<void>) {
  const browser = await chromium.launch({args: ['--disable-dev-shm-usage']})
  try {
    await run(browser)
  } finally {
    await browser.close()
  }
}

async function startHttp2(maxConcurrentStreams: number, stats: {open: number}) {
  const dir = await mkdtemp(join(tmpdir(), 'connection-ceiling-'))
  const made = spawnSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      join(dir, 'key.pem'),
      '-out',
      join(dir, 'cert.pem'),
      '-days',
      '1',
      '-nodes',
      '-subj',
      '/CN=127.0.0.1',
    ],
    {encoding: 'utf8'},
  )
  if (made.status !== 0) throw new Error(made.stderr || 'openssl failed')
  const server = createSecureServer(
    {
      key: await readFile(join(dir, 'key.pem')),
      cert: await readFile(join(dir, 'cert.pem')),
      allowHTTP1: false,
      settings: {maxConcurrentStreams},
    },
    (req, res) => handleHttp2(stats, req, res),
  )
  return {server, origin: await listen(server, 'https')}
}

async function assertCeiling(options: {
  origin: string
  secure: boolean
  cap: number
  belowCap: number
  stats: {open: number}
}) {
  await withBrowser(async (browser) => {
    const context = await browser.newContext({ignoreHTTPSErrors: options.secure})
    const holder = await context.newPage()
    const other = await context.newPage()
    await holder.goto(options.origin)
    await other.goto(options.origin)

    await holdEventSources(holder, options.belowCap)
    await pollEqual(() => options.stats.open, options.belowCap, 15_000)
    const below = await ping(other)
    assert.equal(below.status, 200)
    assert.ok(below.ms < 1_000, `ping below the cap took ${below.ms}ms`)

    await holdEventSources(holder, options.cap)
    await pollEqual(() => options.stats.open, options.cap, 15_000)
    const stalled = await ping(other)
    assert.equal(stalled.error, 'AbortError')
    assert.ok(stalled.ms > 2_000, `stalled ping returned in ${stalled.ms}ms`)

    await releaseOneEventSource(holder)
    await pollEqual(() => options.stats.open, options.cap - 1, 10_000)
    const recovered = await ping(other)
    assert.equal(recovered.status, 200)
    assert.ok(recovered.ms < 1_000, `recovered ping took ${recovered.ms}ms`)
  })
}

const http1Stats = {open: 0}
const http1 = createServer((req, res) => handleHttp1(http1Stats, req, res))
const http1Origin = await listen(http1, 'http')
try {
  await assertCeiling({
    origin: http1Origin,
    secure: false,
    cap: HTTP1_CAP,
    belowCap: HTTP1_CAP - 1,
    stats: http1Stats,
  })
  console.log('http/1.1 cap', HTTP1_CAP)
} finally {
  await closeServer(http1)
}

const http2Stats = {open: 0}
const http2 = await startHttp2(HTTP2_CAP, http2Stats)
try {
  await assertCeiling({
    origin: http2.origin,
    secure: true,
    cap: HTTP2_CAP,
    belowCap: HTTP2_CAP - 10,
    stats: http2Stats,
  })
  console.log('http/2 cap', HTTP2_CAP)
} finally {
  await closeServer(http2.server)
}
