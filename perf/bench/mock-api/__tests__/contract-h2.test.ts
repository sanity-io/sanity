// @vitest-environment node
/**
 * h2+TLS smoke test. The bench production path serves the mock over
 * `http2.createSecureServer` (runner/servers.ts → debug-proxy), so SSE
 * writes and teardown go through the h2 compat layer — not the plain node
 * http the cleartext contract suite exercises. This pins the SSE lifecycle
 * over a real h2 session: welcome-first, broadcast delivery, and — the
 * regression this exists for — that an abrupt client disconnect racing a
 * broadcast does not crash the mock process (write-after-destroy surfaces
 * as an 'error' event on the h2 compat response; see sse.ts).
 */
import * as http2 from 'node:http2'

import {type ProxyResponse} from '@repo/debug-proxy'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {createMockApi, type MockApiServer} from '../createServer'
import {getBenchTls} from '../tls'

const PORT = 43123
const DRAFT_ID = 'drafts.h2-doc'

interface SseEvent {
  event: string
  data: any
}

/** Collect SSE frames from an h2 stream into an inspectable array. */
function collectSse(stream: http2.ClientHttp2Stream): SseEvent[] {
  const events: SseEvent[] = []
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk: string) => {
    buffer += chunk
    let frameEnd = buffer.indexOf('\n\n')
    while (frameEnd !== -1) {
      const frame = buffer.slice(0, frameEnd)
      buffer = buffer.slice(frameEnd + 2)
      const event = /^event: (.*)$/m.exec(frame)?.[1]
      const data = /^data: (.*)$/m.exec(frame)?.[1]
      if (event) events.push({event, data: data === undefined ? undefined : JSON.parse(data)})
      frameEnd = buffer.indexOf('\n\n')
    }
  })
  return events
}

describe('mock Content Lake over h2+TLS (production bench transport)', () => {
  let mock: MockApiServer
  let session: http2.ClientHttp2Session

  beforeAll(async () => {
    const tls = await getBenchTls()
    mock = createMockApi({
      port: PORT,
      projectId: 'benchexp',
      dataset: 'bench',
      tls: {key: tls.key, cert: tls.cert},
    })
    await mock.listen()
    // The cert is self-signed (mock-api/tls.ts) and covers `localhost`, so it
    // validates as its own CA — no NODE_TLS_REJECT_UNAUTHORIZED needed
    session = http2.connect(`https://localhost:${PORT}`, {ca: tls.cert})
  })

  afterAll(async () => {
    session.close()
    await mock.close()
  })

  function request(path: string): Promise<{status: number; body: string}> {
    return new Promise((resolve, reject) => {
      const stream = session.request({':path': path})
      let status = 0
      let body = ''
      stream.setEncoding('utf8')
      stream.on('response', (headers) => {
        status = Number(headers[':status'])
      })
      stream.on('data', (chunk: string) => {
        body += chunk
      })
      stream.on('end', () => resolve({status, body}))
      stream.on('error', reject)
    })
  }

  /** Open the listen endpoint and capture the server-side response object. */
  function openListener(): {
    stream: http2.ClientHttp2Stream
    serverRes: () => ProxyResponse
  } {
    // Capture the h2 compat response hub.connect receives so the test can
    // destroy it server-side, deterministically hitting the window where the
    // stream is destroyed but its 'close' teardown has not run yet
    let captured: ProxyResponse | undefined
    const originalConnect = mock.hub.connect.bind(mock.hub)
    mock.hub.connect = (res, connIds, extraHeaders) => {
      captured = res
      mock.hub.connect = originalConnect
      originalConnect(res, connIds, extraHeaders)
    }
    const ids = encodeURIComponent(JSON.stringify([DRAFT_ID]))
    const stream = session.request({
      ':path': `/v2025-02-19/data/listen/bench?query=*&$ids=${ids}`,
    })
    return {stream, serverRes: () => captured!}
  }

  it('serves the SSE lifecycle over h2 and survives an abrupt client disconnect', async () => {
    const {stream} = openListener()
    const responseHeaders = new Promise<http2.IncomingHttpHeaders>((resolve) =>
      stream.on('response', resolve),
    )
    const events = collectSse(stream)

    const headers = await responseHeaders
    expect(headers[':status']).toBe(200)
    expect(headers['content-type']).toMatch(/^text\/event-stream/)

    // welcome must arrive first (the pair listener gates its snapshot fetch
    // on it — getPairListener.ts)
    await expect.poll(() => events.length).toBeGreaterThan(0)
    expect(events[0].event).toBe('welcome')
    expect(events[0].data.listenerName).toMatch(/^bench-listener-/)

    // A committed transaction reaches the h2 subscriber as a mutation event
    mock.hub.broadcast(
      mock.store.commit([{createIfNotExists: {_id: DRAFT_ID, _type: 'singleString'}}], 'tx-h2-1')
        .events,
    )
    await expect.poll(() => events.find((ev) => ev.event === 'mutation')).toBeTruthy()
    expect(events.find((ev) => ev.event === 'mutation')?.data.documentId).toBe(DRAFT_ID)
    expect(mock.hub.connectionCount).toBe(1)

    // Abrupt client disconnect (RST_STREAM, no graceful end) racing
    // broadcasts: the destroyed compat response must be skipped/torn down,
    // never crash the process (regression test for sse.ts writeRaw guard +
    // 'error' teardown)
    stream.destroy()
    mock.hub.broadcast(
      mock.store.commit([{patch: {id: DRAFT_ID, set: {stringField: 'race 1'}}}], 'tx-h2-2').events,
    )
    await expect.poll(() => mock.hub.connectionCount).toBe(0)
    mock.hub.broadcast(
      mock.store.commit([{patch: {id: DRAFT_ID, set: {stringField: 'race 2'}}}], 'tx-h2-3').events,
    )

    // The server (and this very h2 session) must still be fully functional
    const alive = await request('/v2025-02-19/users/me')
    expect(alive.status).toBe(200)
    expect(JSON.parse(alive.body).id).toBeTruthy()
  })

  it('survives a broadcast into the destroyed-but-not-yet-closed teardown window', async () => {
    const {stream, serverRes} = openListener()
    const events = collectSse(stream)
    await expect.poll(() => events.length).toBeGreaterThan(0)
    expect(events[0].event).toBe('welcome')
    expect(mock.hub.connectionCount).toBe(1)

    // Destroy the server-side h2 stream directly (what an abrupt peer
    // teardown does) and broadcast *synchronously*: the response is already
    // dead but its 'close' event — which removes the connection from the
    // hub — only fires on a later tick, so writeRaw must skip the write
    // (Http2ServerResponse.destroyed is always undefined; the flag lives on
    // res.stream — the exact gap the isGone() helper exists for)
    const res = serverRes()
    ;(res as {stream?: {destroy: () => void}}).stream?.destroy()
    expect(mock.hub.connectionCount).toBe(1)
    mock.hub.broadcast(
      mock.store.commit([{createIfNotExists: {_id: DRAFT_ID, _type: 'singleString'}}], 'tx-h2-4')
        .events,
    )

    // Teardown completes and the mock keeps serving
    await expect.poll(() => mock.hub.connectionCount).toBe(0)
    const alive = await request('/v2025-02-19/users/me')
    expect(alive.status).toBe(200)
  })
})
