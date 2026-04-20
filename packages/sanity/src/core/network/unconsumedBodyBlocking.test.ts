// @vitest-environment node
import {createServer, type Server} from 'node:http'
import {type AddressInfo} from 'node:net'

import {afterAll, beforeAll, describe, expect, it} from 'vitest'

/**
 * Demonstrates that not consuming a fetch() response body holds the underlying
 * TCP connection open, preventing reuse by later requests.
 *
 * Uses a server that streams its response body slowly so the body is still
 * in-flight when the test issues the next request. This makes the blocking
 * unambiguous: undici cannot reuse a connection whose response body hasn't
 * been fully received, so every unconsumed request forces a new TCP connection.
 *
 * In the browser the same principle applies at the HTTP/2 and HTTP/3 stream
 * level — an unconsumed body keeps the stream alive, consumes connection-level
 * flow-control window, and under load causes head-of-line blocking of unrelated
 * requests sharing the same multiplexed connection.
 */
describe('unconsumed fetch body prevents connection reuse', () => {
  const REQUEST_COUNT = 5
  const BODY_STREAM_DURATION_MS = 300

  function createStreamingServer(): Promise<{
    url: string
    connections: () => number
    close: () => Promise<void>
  }> {
    let connectionCount = 0
    const server: Server = createServer((_req, res) => {
      res.writeHead(200, {'content-type': 'text/plain'})
      res.write('start\n')
      const interval = setInterval(() => res.write('.\n'), 50)
      setTimeout(() => {
        clearInterval(interval)
        res.end('done\n')
      }, BODY_STREAM_DURATION_MS)
    })
    server.on('connection', () => {
      connectionCount++
    })
    return new Promise((resolve) =>
      server.listen(0, '127.0.0.1', () => {
        const {port} = server.address() as AddressInfo
        resolve({
          url: `http://127.0.0.1:${port}/ping`,
          connections: () => connectionCount,
          close: () => new Promise<void>((r) => server.close(() => r())),
        })
      }),
    )
  }

  let unconsumed: Awaited<ReturnType<typeof createStreamingServer>>
  let consumed: Awaited<ReturnType<typeof createStreamingServer>>

  beforeAll(async () => {
    // Each scenario gets its own server (and therefore its own origin + pool).
    ;[unconsumed, consumed] = await Promise.all([createStreamingServer(), createStreamingServer()])

    // --- unconsumed: only read headers, ignore body ---
    for (let i = 0; i < REQUEST_COUNT; i++) {
      // eslint-disable-next-line no-unconsumed-fetch/no-unconsumed-fetch -- intentional: this test demonstrates the leak
      const res = await fetch(unconsumed.url)
      res.headers.get('content-type')
    }

    // --- consumed: fully read body with text() ---
    for (let i = 0; i < REQUEST_COUNT; i++) {
      const res = await fetch(consumed.url)
      await res.text()
    }
  })

  afterAll(async () => {
    await Promise.all([unconsumed.close(), consumed.close()])
  })

  it('opens one TCP connection per request when body is not consumed', () => {
    // Each sequential fetch() must open a new TCP connection because the
    // previous connection is still occupied by its unfinished response body.
    expect(unconsumed.connections()).toBe(REQUEST_COUNT)
  })

  it('reuses connections when body is fully consumed', () => {
    // text() waits for the complete body, then returns the connection to
    // the pool. The next request reuses the existing connection.
    expect(consumed.connections()).toBeLessThan(unconsumed.connections())
  })
})
