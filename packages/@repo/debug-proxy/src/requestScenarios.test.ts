import {once} from 'node:events'
import {type IncomingMessage, type ServerResponse} from 'node:http'
import {connect, constants as h2constants} from 'node:http2'
import {createServer} from 'node:https'
import {type AddressInfo} from 'node:net'
import {fileURLToPath} from 'node:url'

import {getCertificate} from '@vitejs/plugin-basic-ssl'
import {afterEach, beforeAll, describe, expect, test} from 'vitest'

import {createDebugProxy, type DebugProxyServer} from './createDebugProxy'
import {createRequestProxy} from './proxy'
import {intermittentServiceErrors} from './requestScenarios'

let pem: string

beforeAll(async () => {
  pem = await getCertificate(
    fileURLToPath(new URL('../.certs', import.meta.url)),
    'debug-proxy-test',
    ['*.localhost'],
  )
})

type UpstreamHandler = (req: IncomingMessage, res: ServerResponse) => void

async function startUpstream(handler: UpstreamHandler): Promise<{
  apiHost: string
  close: () => Promise<void>
}> {
  const server = createServer({key: pem, cert: pem}, handler)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const {port} = server.address() as AddressInfo
  return {
    apiHost: `127.0.0.1:${port}`,
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

function h2Request(
  port: number,
  path: string,
  method = 'GET',
): Promise<{status: number; body: string}> {
  return new Promise((resolve, reject) => {
    const client = connect(`https://127.0.0.1:${port}`, {rejectUnauthorized: false})
    client.on('error', reject)
    const req = client.request({
      [h2constants.HTTP2_HEADER_PATH]: path,
      [h2constants.HTTP2_HEADER_AUTHORITY]: 'localhost',
      [h2constants.HTTP2_HEADER_METHOD]: method,
    })
    let status = 0
    let body = ''
    req.on('response', (headers) => (status = Number(headers[h2constants.HTTP2_HEADER_STATUS])))
    req.setEncoding('utf8')
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      client.close()
      resolve({status, body})
    })
    req.on('error', reject)
    req.end()
  })
}

describe('intermittentServiceErrors', () => {
  test('faults a request with a 5xx without reaching upstream when probability is 1', async () => {
    let upstreamHit = false
    const upstream = await startUpstream((req, res) => {
      upstreamHit = true
      res.writeHead(200).end('ok')
    })
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
      defaultHandler: intermittentServiceErrors(1)(
        // a handler that, if reached, would proxy upstream — it must not be
        (_req, _res) => {
          throw new Error('handler should not run when the request faults')
        },
      ),
    })
    const port = (proxy.server.address() as AddressInfo).port

    const res = await h2Request(port, '/v1/data/query/test')
    expect(res.status).toBeGreaterThanOrEqual(500)
    expect(res.status).toBeLessThan(600)
    expect([500, 502, 503, 504]).toContain(res.status)
    expect(JSON.parse(res.body).error.type).toBe('serverError')
    expect(upstreamHit).toBe(false)
  })

  test('forwards the request unchanged when probability is 0', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(200, {'content-type': 'application/json'})
      res.end(JSON.stringify({ok: true}))
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
    expect(JSON.parse(res.body).ok).toBe(true)
  })

  test('never faults a CORS preflight (OPTIONS), so the real request can proceed', async () => {
    const upstream = await startUpstream((req, res) => {
      res.writeHead(204).end()
    })
    cleanups.push(upstream.close)

    const proxy = await startProxy({
      port: 0,
      apiHost: upstream.apiHost,
      tls: {key: pem, cert: pem},
      insecureUpstream: true,
      // Wrap a real pass-through handler: OPTIONS must skip the fault and reach
      // upstream (a 204), even though probability is 1.
      defaultHandler: intermittentServiceErrors(1)(createRequestProxy()),
    })
    const port = (proxy.server.address() as AddressInfo).port

    const res = await h2Request(port, '/v1/data/query/test', 'OPTIONS')
    // OPTIONS is forwarded to the (pass-through) handler, not faulted
    expect(res.status).toBeLessThan(500)
  })
})
