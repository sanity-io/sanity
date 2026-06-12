import {once} from 'node:events'
import {type IncomingMessage, type ServerResponse} from 'node:http'
import {connect, constants as h2constants} from 'node:http2'
import {createServer} from 'node:https'
import {type AddressInfo, isIP, type Socket} from 'node:net'
import {connect as tlsConnect} from 'node:tls'
import {fileURLToPath} from 'node:url'

import {getCertificate} from '@vitejs/plugin-basic-ssl'
import {afterEach, beforeAll, describe, expect, test} from 'vitest'

import {createDebugProxy, type DebugProxyServer} from './createDebugProxy'
import {createSSEProxy} from './proxy'
import {dropMutations} from './scenarios'

// A self-signed cert reused for both the mock upstream and the proxy's TLS
// listener. `insecureUpstream` lets the proxy talk to the upstream over it.
let pem: string

beforeAll(async () => {
  pem = await getCertificate(
    fileURLToPath(new URL('../.certs', import.meta.url)),
    'debug-proxy-test',
    ['*.localhost'],
  )
})

type UpstreamHandler = (req: IncomingMessage, res: ServerResponse) => void

/** Start a mock upstream HTTPS server, return its `host:port` authority. */
async function startUpstream(handler: UpstreamHandler): Promise<{
  apiHost: string
  server: ReturnType<typeof createServer>
  close: () => Promise<void>
}> {
  const server = createServer({key: pem, cert: pem}, handler)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const {port} = server.address() as AddressInfo
  return {
    apiHost: `127.0.0.1:${port}`,
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections()
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}

const cleanups: Array<() => Promise<void>> = []
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((fn) => fn()))
})

async function startProxy(
  config: Parameters<typeof createDebugProxy>[0],
): Promise<DebugProxyServer> {
  const proxy = createDebugProxy(config)
  await proxy.listen()
  cleanups.push(() => proxy.close())
  return proxy
}

// The mock upstream listens on 127.0.0.1:<port>, which can't carry a project
// subdomain, so tests use a bare `localhost` authority (no subdomain → the
// proxy targets apiHost directly). projectId-derivation is covered by its own
// test against a fixed authority.
const DEFAULT_AUTHORITY = 'localhost'

/** Fetch over h2 against the TLS proxy, ignoring the self-signed cert. */
function h2Request(
  port: number,
  path: string,
  authority = DEFAULT_AUTHORITY,
): Promise<{status: number; protocol: string; body: string}> {
  return new Promise((resolve, reject) => {
    const client = connect(`https://127.0.0.1:${port}`, {
      rejectUnauthorized: false,
      // SNI can't carry an IP literal, so only set it for hostnames
      ...(isIP(authority.replace(/:\d+$/, '')) ? {} : {servername: authority}),
    })
    client.on('error', reject)
    const req = client.request({
      [h2constants.HTTP2_HEADER_PATH]: path,
      [h2constants.HTTP2_HEADER_AUTHORITY]: authority,
    })
    let status = 0
    let body = ''
    req.on('response', (headers) => {
      status = Number(headers[h2constants.HTTP2_HEADER_STATUS])
    })
    req.setEncoding('utf8')
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      client.close()
      resolve({status, protocol: 'h2', body})
    })
    req.on('error', reject)
    req.end()
  })
}

describe('createDebugProxy (h2)', () => {
  test('proxies a request over HTTP/2 and forwards the body', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(200, {'content-type': 'application/json'})
      res.end(JSON.stringify({url: req.url, host: req.headers.host}))
    })
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
    })
    const port = (proxy.server.address() as AddressInfo).port

    const res = await h2Request(port, '/v1/data/query/test')
    expect(res.status).toBe(200)
    expect(res.protocol).toBe('h2')
    const parsed = JSON.parse(res.body)
    // host should be rewritten to the upstream
    expect(parsed.host).toBe(upstream.apiHost)
    expect(parsed.url).toBe('/v1/data/query/test')
  })

  test('injects the bearer token on upstream requests', async () => {
    let seenAuth: string | undefined
    const upstream = await startUpstream((req, res) => {
      seenAuth = req.headers.authorization
      res.writeHead(200).end('ok')
    })
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      token: 'sekret',
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
    })
    const port = (proxy.server.address() as AddressInfo).port
    await h2Request(port, '/v1/ping')
    expect(seenAuth).toBe('Bearer sekret')
  })

  test('rejects an invalid project ID in the host', async () => {
    const upstream = await startUpstream((req, res) => res.writeHead(200).end('ok'))
    cleanups.push(upstream.close)
    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
    })
    const port = (proxy.server.address() as AddressInfo).port
    // An underscore isn't a valid project-ID character, so it must be rejected
    // rather than interpolated into the upstream host.
    const res = await h2Request(port, '/v1/ping', 'evil_host.localhost')
    expect(res.status).toBe(400)
  })

  test('forwards double-slash paths without treating them as protocol-relative', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(200, {'content-type': 'application/json'})
      res.end(JSON.stringify({url: req.url, host: req.headers.host}))
    })
    cleanups.push(upstream.close)
    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
    })
    const port = (proxy.server.address() as AddressInfo).port
    // `new URL('//v2025-02-19/…', base)` would resolve to host "v2025-02-19";
    // the proxy must keep the host and pass the path through verbatim
    const res = await h2Request(port, '//v2025-02-19/users/me')
    expect(res.status).toBe(200)
    const parsed = JSON.parse(res.body)
    expect(parsed.host).toBe(upstream.apiHost)
    expect(parsed.url).toBe('//v2025-02-19/users/me')
  })

  test('treats IP-literal hosts as having no project subdomain', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(200, {'content-type': 'application/json'})
      res.end(JSON.stringify({host: req.headers.host}))
    })
    cleanups.push(upstream.close)
    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
    })
    const port = (proxy.server.address() as AddressInfo).port
    // Accessing the proxy by IP must not misread "127" as a projectId
    const res = await h2Request(port, '/v1/ping', `127.0.0.1:${port}`)
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body).host).toBe(upstream.apiHost)
  })
})

describe('createSSEProxy', () => {
  test('round-trips SSE events and applies the operator', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(200, {'content-type': 'text/event-stream'})
      res.write('event: welcome\ndata: {}\n\n')
      res.write('event: mutation\ndata: {"a":1}\n\n')
      res.end()
    })
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
      routes: [
        {
          match: (req) => req.url?.includes('/listen') ?? false,
          // drop every mutation
          handler: createSSEProxy((events$) => events$.pipe(dropMutations(1))),
        },
      ],
    })
    const port = (proxy.server.address() as AddressInfo).port
    const res = await h2Request(port, '/v1/data/listen/test')
    expect(res.body).toContain('event: welcome')
    expect(res.body).not.toContain('event: mutation')
  })

  test('preserves multi-byte UTF-8 split across chunk boundaries', async () => {
    // "Bjørge" — the ø is 2 bytes (0xC3 0xB8); split mid-character.
    const payload = 'event: mutation\ndata: {"name":"Bjørge"}\n\n'
    const bytes = Buffer.from(payload, 'utf8')
    const oIndex = payload.indexOf('ø')
    const splitAt = Buffer.byteLength(payload.slice(0, oIndex)) + 1 // mid-ø

    const upstream = await startUpstream((req, res) => {
      res.writeHead(200, {'content-type': 'text/event-stream'})
      res.write(bytes.subarray(0, splitAt))
      res.write(bytes.subarray(splitAt))
      res.end()
    })
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
      // a transforming SSE handler that passes everything through unchanged
      routes: [{match: () => true, handler: createSSEProxy()}],
    })
    const port = (proxy.server.address() as AddressInfo).port
    const res = await h2Request(port, '/v1/data/listen/test')
    expect(res.body).toContain('Bjørge')
    expect(res.body).not.toContain('�')
  })

  test('strips content-encoding when transforming the body', async () => {
    const upstream = await startUpstream((req, res) => {
      // Claim gzip even though we send plain text — a transforming proxy must
      // not forward this stale header (or the upstream content-length, which
      // no longer matches the rewritten body).
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'content-encoding': 'gzip',
      })
      res.end('event: mutation\ndata: {}\n\n')
    })
    cleanups.push(upstream.close)

    let responseHeaders: Record<string, unknown> = {}
    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
      routes: [{match: () => true, handler: createSSEProxy()}],
    })
    const port = (proxy.server.address() as AddressInfo).port

    await new Promise<void>((resolve, reject) => {
      const client = connect(`https://127.0.0.1:${port}`, {rejectUnauthorized: false})
      const req = client.request({
        [h2constants.HTTP2_HEADER_PATH]: '/v1/data/listen/test',
        [h2constants.HTTP2_HEADER_AUTHORITY]: DEFAULT_AUTHORITY,
      })
      req.on('response', (headers) => (responseHeaders = headers))
      req.resume() // drain the body so 'end' fires
      req.on('end', () => {
        client.close()
        resolve()
      })
      req.on('error', reject)
      req.end()
    })
    expect(responseHeaders['content-encoding']).toBeUndefined()
  })

  test('passes non-SSE responses through untouched (e.g. JSON errors)', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(401, {'content-type': 'application/json'})
      res.end('{"error":"unauthorized"}')
    })
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
      // The SSE handler must not feed a JSON error body to the SSE parser
      // (which would swallow it)
      routes: [{match: () => true, handler: createSSEProxy()}],
    })
    const port = (proxy.server.address() as AddressInfo).port
    const res = await h2Request(port, '/v1/data/listen/test')
    expect(res.status).toBe(401)
    expect(res.body).toBe('{"error":"unauthorized"}')
  })
})

/**
 * Open an SSE stream against the proxy and resolve once the first chunk
 * arrives (i.e. the connection is live). Errors after that are swallowed —
 * tearing the connection down is the point of the test using this.
 */
function openLiveStream(port: number, path: string): Promise<void> {
  const ignoreLateErrors = () => {
    // expected when close() destroys the connection
  }
  return new Promise<void>((resolve, reject) => {
    const client = connect(`https://127.0.0.1:${port}`, {rejectUnauthorized: false})
    client.on('error', () => reject(new Error('client error before first chunk')))
    const req = client.request({
      [h2constants.HTTP2_HEADER_PATH]: path,
      [h2constants.HTTP2_HEADER_AUTHORITY]: DEFAULT_AUTHORITY,
    })
    req.on('error', ignoreLateErrors)
    req.once('data', () => {
      client.removeAllListeners('error')
      client.on('error', ignoreLateErrors)
      resolve()
    })
    req.end()
  })
}

/**
 * Perform a raw WebSocket-style upgrade against the proxy, send a payload
 * once the 101 handshake completes, and resolve with the full transcript
 * (handshake response + whatever the upstream echoed back).
 */
function upgradeAndSend(port: number, payload: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const socket = tlsConnect(
      {port, host: '127.0.0.1', rejectUnauthorized: false, ALPNProtocols: ['http/1.1']},
      () => {
        socket.write(
          [
            'GET /v1/socket/test HTTP/1.1',
            `host: ${DEFAULT_AUTHORITY}`,
            'connection: Upgrade',
            'upgrade: websocket',
            'sec-websocket-key: dGhlIHNhbXBsZSBub25jZQ==',
            'sec-websocket-version: 13',
            '\r\n',
          ].join('\r\n'),
        )
      },
    )
    let buffer = ''
    let sentPayload = false
    socket.on('data', (chunk) => {
      buffer += chunk.toString()
      if (!sentPayload && buffer.includes('\r\n\r\n')) {
        sentPayload = true
        socket.write(payload)
      }
      if (buffer.includes(payload)) {
        socket.end()
        resolve(buffer)
      }
    })
    socket.on('error', reject)
  })
}

/** Upstream upgrade handler: accept the handshake, then echo all bytes back. */
function acceptAndEcho(req: IncomingMessage, socket: Socket) {
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\nupgrade: websocket\r\nconnection: upgrade\r\n\r\n',
  )
  socket.on('data', (chunk) => socket.write(chunk))
}

describe('websocket upgrades', () => {
  test('tunnels the upgrade handshake and raw bytes to the upstream', async () => {
    const upstream = await startUpstream(() => {
      // regular requests unused in this test
    })
    upstream.server.on('upgrade', acceptAndEcho)
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
    })
    const port = (proxy.server.address() as AddressInfo).port

    const transcript = await upgradeAndSend(port, 'hello-through-tunnel')
    expect(transcript).toContain('101 Switching Protocols')
    expect(transcript).toContain('hello-through-tunnel')
  })
})

describe('close()', () => {
  test('resolves while a live SSE stream is open', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(200, {'content-type': 'text/event-stream'})
      res.write('event: welcome\ndata: {}\n\n')
      // keep the stream open — never end()
    })
    cleanups.push(upstream.close)

    const proxy = createDebugProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
    })
    await proxy.listen()
    const port = (proxy.server.address() as AddressInfo).port

    await openLiveStream(port, '/v1/data/listen/test')

    // Must resolve despite the live stream (the test timeout guards a hang)
    await proxy.close()
  })
})

describe('binding', () => {
  test('binds to loopback by default (not reachable on a LAN address)', async () => {
    const upstream = await startUpstream((req, res) => res.writeHead(200).end('ok'))
    cleanups.push(upstream.close)
    // No tls → plain http server, simplest to probe.
    const proxy = await startProxy({port: 0, apiHost: upstream.apiHost, insecureUpstream: true})
    const address = proxy.server.address() as AddressInfo
    expect(address.address).toBe('127.0.0.1')
  })
})
