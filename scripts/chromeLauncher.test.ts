import {createHash} from 'node:crypto'
import {once} from 'node:events'
import {mkdirSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync} from 'node:fs'
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http'
import path from 'node:path'
import {type Duplex} from 'node:stream'

import {afterEach, describe, expect, test, vi} from 'vitest'

import {
  findRunningChrome,
  type Launched,
  openInFreshChrome,
  reclaimStaleLock,
  run,
  type RunDeps,
  startRedirect,
  withLaunchLock,
} from './chromeLauncher'

const TOKEN = 's3cret-token'
const TARGET = `http://localhost:3333/test#token=${TOKEN}`
/** Where the launcher keeps its locks (same derivation as `chromeLauncher.ts`). */
const CACHE_DIR = path.resolve(
  import.meta.dirname,
  '..',
  'node_modules',
  '.cache',
  'react-devtools-mcp',
)
const UUID = '42a60490-840a-4d3d-9fa2-b97652f42ab7'
const ENDPOINT = `ws://127.0.0.1:9222/devtools/browser/${UUID}`

interface Listener {
  port: number
  /** `METHOD path` of every HTTP request the listener received, in order. */
  requests: string[]
  /** Every Chrome DevTools Protocol command received over a websocket upgrade. */
  commands: unknown[]
  close: () => Promise<void>
}

const listeners: Listener[] = []

/**
 * Answers one websocket connection the way a CDP target does: completes the handshake, records
 * each text frame as a command and acknowledges it with `{id, result}`.
 */
function serveCdp(request: IncomingMessage, socket: Duplex, commands: unknown[]): void {
  const accept = createHash('sha1')
    .update(`${request.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64')
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  )
  socket.on('data', (frame: Buffer) => {
    const opcode = frame[0] & 0x0f
    if (opcode === 8) {
      // Close: answer in kind and let the TCP connection go
      socket.end(Buffer.from([0x88, 0x00]))
      return
    }
    if (opcode !== 1) {
      return // not a text frame (ping, binary)
    }
    let length = frame[1] & 0x7f
    let offset = 2
    if (length === 126) {
      length = frame.readUInt16BE(2)
      offset = 4
    }
    const mask = frame.subarray(offset, offset + 4)
    offset += 4
    const payload = Buffer.from(frame.subarray(offset, offset + length))
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= mask[i % 4]
    }
    const command: unknown = JSON.parse(payload.toString('utf8'))
    commands.push(command)
    const id =
      typeof command === 'object' && command !== null && 'id' in command ? command.id : null
    const reply = Buffer.from(JSON.stringify({id, result: {frameId: 'F'}}))
    socket.write(Buffer.concat([Buffer.from([0x81, reply.length]), reply]))
  })
}

/** A loopback server standing in for whatever answers on a debugging port. */
async function listen(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
): Promise<Listener> {
  const requests: string[] = []
  const commands: unknown[] = []
  // Upgraded sockets leave the server's connection tracking, so they are closed by hand
  const upgraded = new Set<Duplex>()
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`)
    handler(request, response)
  })
  server.on('upgrade', (request, socket) => {
    upgraded.add(socket)
    socket.on('close', () => upgraded.delete(socket))
    serveCdp(request, socket, commands)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('no address')
  }
  const listener: Listener = {
    port: address.port,
    requests,
    commands,
    close: () =>
      new Promise((resolve) => {
        for (const socket of upgraded) {
          socket.destroy()
        }
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
  listeners.push(listener)
  return listener
}

/** A port nothing listens on: taken and released again. */
async function freePort(): Promise<number> {
  const listener = await listen((_request, response) => response.end())
  await listener.close()
  return listener.port
}

function json(response: ServerResponse, body: unknown): void {
  const payload = JSON.stringify(body)
  response.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': payload.length})
  response.end(payload)
}

/**
 * Answers like Chrome: `/json/version` advertising `endpoint`, `/json/list` with the pages given,
 * and `PUT /json/new`.
 */
function chromeLike(endpoint: string, pages: Array<{url: string; id: string}> = []) {
  return (request: IncomingMessage, response: ServerResponse) => {
    const port = (request.socket.address() as {port: number}).port
    if (request.method === 'GET' && request.url === '/json/version') {
      json(response, {Browser: 'Chrome/148.0.7778.96', webSocketDebuggerUrl: endpoint})
    } else if (request.method === 'GET' && request.url === '/json/list') {
      json(
        response,
        pages.map((page) => ({
          type: 'page',
          id: page.id,
          url: page.url,
          webSocketDebuggerUrl: `ws://127.0.0.1:${port}/devtools/page/${page.id}`,
        })),
      )
    } else if (request.method === 'PUT' && request.url?.startsWith('/json/new')) {
      json(response, {id: 'tab'})
    } else {
      response.writeHead(404).end()
    }
  }
}

afterEach(async () => {
  await Promise.all(listeners.splice(0).map((listener) => listener.close()))
})

describe('startRedirect', () => {
  test('answers the secret path once with a bodiless, uncacheable 302 to the target', async () => {
    const redirect = await startRedirect(TARGET)
    try {
      expect(redirect.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/[0-9a-f]{32}$/)
      expect(redirect.url).not.toContain(TOKEN)

      const first = await fetch(redirect.url, {redirect: 'manual'})
      expect(first.status).toBe(302)
      expect(first.headers.get('location')).toBe(TARGET)
      expect(first.headers.get('cache-control')).toBe('no-store')
      expect(await first.text()).toBe('')
      await redirect.served

      const second = await fetch(redirect.url, {redirect: 'manual'})
      expect(second.status).toBe(404)
      expect(second.headers.get('location')).toBeNull()
    } finally {
      redirect.close()
    }
  })

  test('gives other paths and methods a 404 without spending the redirect', async () => {
    const redirect = await startRedirect(TARGET)
    try {
      const origin = new URL(redirect.url).origin
      const [otherPath, wrongMethod, root] = await Promise.all([
        fetch(`${origin}/${'0'.repeat(32)}`, {redirect: 'manual'}),
        fetch(redirect.url, {method: 'POST', redirect: 'manual'}),
        fetch(`${origin}/`, {redirect: 'manual'}),
      ])
      for (const response of [otherPath, wrongMethod, root]) {
        expect(response.status).toBe(404)
        expect(response.headers.get('location')).toBeNull()
      }

      const real = await fetch(redirect.url, {redirect: 'manual'})
      expect(real.status).toBe(302)
      expect(real.headers.get('location')).toBe(TARGET)
    } finally {
      redirect.close()
    }
  })

  test('stops listening once closed', async () => {
    const redirect = await startRedirect(TARGET)
    redirect.close()
    await expect(fetch(redirect.url, {redirect: 'manual'})).rejects.toThrow()
  })
})

describe('findRunningChrome', () => {
  const recorded = {pid: 4242, port: 0, endpoint: ENDPOINT}
  const alive = () => true
  const dead = () => false
  const timeoutMs = 1_000

  test('is null when nothing listens on the port', async () => {
    const port = await freePort()
    await expect(
      findRunningChrome(port, {
        readState: () => ({...recorded, port}),
        isProcessAlive: alive,
        timeoutMs,
      }),
    ).resolves.toBeNull()
  })

  test('accepts the recorded Chrome while it runs and advertises its target, opening urls as new tabs', async () => {
    const listener = await listen(chromeLike(ENDPOINT))
    const port = listener.port
    const found = await findRunningChrome(port, {
      readState: () => ({...recorded, port}),
      isProcessAlive: alive,
      timeoutMs,
    })
    expect(found?.browserName).toBe('Chrome/148.0.7778.96')
    expect(found?.pid).toBeUndefined()
    expect(found?.stop).toBeUndefined()
    expect(listener.requests).toEqual(['GET /json/version'])

    await found?.open('http://127.0.0.1:41234/a1b2?x=1&y=2#f')
    expect(listener.requests).toEqual([
      'GET /json/version',
      `PUT /json/new?${encodeURIComponent('http://127.0.0.1:41234/a1b2?x=1&y=2#f')}`,
    ])
  })

  test('refuses a listener when no launch was recorded, after a single probe', async () => {
    const listener = await listen(chromeLike(ENDPOINT))
    await expect(
      findRunningChrome(listener.port, {readState: () => null, isProcessAlive: alive, timeoutMs}),
    ).rejects.toThrow(/not the Chrome this launcher started/)
    expect(listener.requests).toEqual(['GET /json/version'])
  })

  test('refuses a replayed target once the recorded Chrome is gone', async () => {
    const listener = await listen(chromeLike(ENDPOINT))
    const port = listener.port
    await expect(
      findRunningChrome(port, {
        readState: () => ({...recorded, port}),
        isProcessAlive: dead,
        timeoutMs,
      }),
    ).rejects.toThrow(/not the Chrome this launcher started/)
    expect(listener.requests).toEqual(['GET /json/version'])
  })

  test('refuses a listener that advertises another browser or none at all', async () => {
    const other = await listen(chromeLike('ws://127.0.0.1:9222/devtools/browser/other'))
    await expect(
      findRunningChrome(other.port, {
        readState: () => ({...recorded, port: other.port}),
        isProcessAlive: alive,
        timeoutMs,
      }),
    ).rejects.toThrow(/not the Chrome this launcher started/)

    const bare = await listen((_request, response) => json(response, {}))
    await expect(
      findRunningChrome(bare.port, {
        readState: () => ({...recorded, port: bare.port}),
        isProcessAlive: alive,
        timeoutMs,
      }),
    ).rejects.toThrow(/not the Chrome this launcher started/)
  })

  test('refuses when the recorded Chrome was launched on a different port', async () => {
    const listener = await listen(chromeLike(ENDPOINT))
    await expect(
      findRunningChrome(listener.port, {
        readState: () => ({...recorded, port: listener.port + 1}),
        isProcessAlive: alive,
        timeoutMs,
      }),
    ).rejects.toThrow(/not the Chrome this launcher started/)
  })
})

describe('openInFreshChrome', () => {
  test('navigates the blank page over the debugging endpoint instead of a command line', async () => {
    const listener = await listen(
      chromeLike(ENDPOINT, [
        {url: 'chrome://newtab/', id: 'NTP'},
        {url: 'about:blank', id: 'BLANK'},
      ]),
    )
    const redirectUrl = 'http://127.0.0.1:41234/a1b2c3'
    await openInFreshChrome(`http://127.0.0.1:${listener.port}`, redirectUrl, 1_000)

    expect(listener.requests).toEqual(['GET /json/list'])
    expect(listener.commands).toEqual([
      {id: 1, method: 'Page.navigate', params: {url: redirectUrl}},
    ])
  })

  test('fails when the Chrome has no blank page to navigate', async () => {
    const listener = await listen(chromeLike(ENDPOINT, [{url: 'http://localhost:3333/', id: 'S'}]))
    await expect(
      openInFreshChrome(`http://127.0.0.1:${listener.port}`, 'http://127.0.0.1:41234/x', 1_000),
    ).rejects.toThrow(/no blank page/)
    expect(listener.commands).toEqual([])
  })
})

describe('withLaunchLock', () => {
  const LOCK_DIR = path.join(CACHE_DIR, 'launch.lock')

  /** A pid no process has: counted down from the top of the usual range until kill(0) fails. */
  function deadPid(): number {
    for (let pid = 4_000_000; pid > 1; pid--) {
      try {
        process.kill(pid, 0)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
          return pid
        }
      }
    }
    throw new Error('no free pid found')
  }

  test('serializes concurrent runs for the same port', async () => {
    const events: string[] = []
    const first = withLaunchLock(async () => {
      events.push('first:start')
      await new Promise((resolve) => setTimeout(resolve, 150))
      events.push('first:end')
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    const second = withLaunchLock(async () => {
      events.push('second:start')
    })
    await Promise.all([first, second])
    expect(events).toEqual(['first:start', 'first:end', 'second:start'])
  })

  test('releases the lock when the run fails', async () => {
    await expect(
      withLaunchLock(async () => {
        throw new Error('launch failed')
      }),
    ).rejects.toThrow('launch failed')
    await expect(withLaunchLock(async () => 'acquired', 200)).resolves.toBe('acquired')
  })

  /** The lock directory as a crashed or running launcher would leave it. */
  function plantLock(owner: number | null, ageMs = 0): void {
    mkdirSync(LOCK_DIR, {recursive: true})
    if (owner !== null) {
      writeFileSync(path.join(LOCK_DIR, 'pid'), String(owner))
    }
    const mtime = new Date(Date.now() - ageMs)
    utimesSync(LOCK_DIR, mtime, mtime)
  }

  afterEach(() => {
    rmSync(LOCK_DIR, {recursive: true, force: true})
  })

  test('takes over a lock whose owner is gone', async () => {
    plantLock(deadPid())
    await expect(withLaunchLock(async () => 'taken over', 500)).resolves.toBe('taken over')
  })

  test('reclaims a dead-owner lock, but puts back a live lock that replaced it in between', () => {
    // A contender that judged the previous directory stale finds a live owner's fresh lock at the
    // path by the time it reclaims: the fresh lock must survive, with its pid, and nothing stale
    // may be left lying around
    plantLock(process.pid)
    reclaimStaleLock(LOCK_DIR)
    expect(readFileSync(path.join(LOCK_DIR, 'pid'), 'utf8')).toBe(String(process.pid))
    expect(readdirSync(CACHE_DIR).filter((name) => name.startsWith('launch.lock'))).toEqual([
      'launch.lock',
    ])

    rmSync(LOCK_DIR, {recursive: true, force: true})
    plantLock(deadPid())
    reclaimStaleLock(LOCK_DIR)
    expect(readdirSync(CACHE_DIR).filter((name) => name.startsWith('launch.lock'))).toEqual([])

    // Nothing to reclaim is not an error either (the other contender was first)
    reclaimStaleLock(LOCK_DIR)
  })

  test('lets exactly one of several contenders reclaim a dead-owner lock at a time', async () => {
    plantLock(deadPid())
    let inside = 0
    let peak = 0
    const contenders = Array.from({length: 6}, (_unused, index) =>
      withLaunchLock(async () => {
        inside++
        peak = Math.max(peak, inside)
        await new Promise((resolve) => setTimeout(resolve, 15))
        inside--
        return index
      }, 5_000),
    )
    await expect(Promise.all(contenders)).resolves.toEqual([0, 1, 2, 3, 4, 5])
    expect(peak).toBe(1)
    expect(readdirSync(CACHE_DIR).filter((name) => name.startsWith('launch.lock'))).toEqual([])
  })

  test('gives up on a lock held by a live owner once its wait is over, however old it is', async () => {
    plantLock(process.pid, 10 * 60_000)
    await expect(withLaunchLock(async () => 'never', 200)).rejects.toThrow(/holds the launch lock/)
  })

  test('judges a lock without a recorded owner by its age', async () => {
    plantLock(null)
    await expect(withLaunchLock(async () => 'never', 200)).rejects.toThrow(/holds the launch lock/)
    rmSync(LOCK_DIR, {recursive: true, force: true})

    plantLock(null, 2 * 60_000)
    await expect(withLaunchLock(async () => 'taken over', 200)).resolves.toBe('taken over')
  })
})

describe('run', () => {
  const env = {STUDIO_AUTH_TOKEN: TOKEN, DISPLAY: ':1'}

  function deps(overrides: Partial<RunDeps>): RunDeps & {logged: string[]} {
    const logged: string[] = []
    return {
      findRunningChrome: vi.fn(async () => null),
      launchChrome: vi.fn(
        async () => ({browserName: 'Chrome/148', pid: 4242, open: async () => {}}) as Launched,
      ),
      withLaunchLock: (fn) => fn(),
      startRedirect,
      startupTimeoutMs: 100,
      log: (line) => logged.push(line),
      warn: (line) => logged.push(`warn: ${line}`),
      logged,
      ...overrides,
    }
  }

  /** Stands in for Chrome: opens the redirect it was handed and records where it led. */
  function chromeThatOpens(seen: {redirectUrl?: string; location?: string | null}): Launched {
    return {
      browserName: 'Chrome/148',
      pid: 4242,
      stop: vi.fn(),
      open: async (url) => {
        seen.redirectUrl = url
        const response = await fetch(url, {redirect: 'manual'})
        seen.location = response.headers.get('location')
      },
    }
  }

  test('creates no redirect, and starts nothing, when the listener on the port is refused', async () => {
    const startRedirectSpy = vi.fn(startRedirect)
    const d = deps({
      findRunningChrome: vi.fn(async () => {
        throw new Error('Something is already listening on http://127.0.0.1:9222, but …')
      }),
      startRedirect: startRedirectSpy,
    })
    await expect(run([], env, d)).rejects.toThrow(/already listening/)
    expect(startRedirectSpy).not.toHaveBeenCalled()
    expect(d.launchChrome).not.toHaveBeenCalled()
  })

  test('creates the redirect only after a fresh Chrome has been authenticated', async () => {
    const order: string[] = []
    const d = deps({
      launchChrome: vi.fn(async () => {
        order.push('launch')
        return chromeThatOpens({})
      }),
      startRedirect: vi.fn(async (target: string) => {
        order.push('redirect')
        return startRedirect(target)
      }),
    })
    await run([], env, d)
    expect(order).toEqual(['launch', 'redirect'])
  })

  test('refuses the url before touching the port when the token may not travel to it', async () => {
    const d = deps({})
    await expect(run(['http://studio.invalid/', '--inject-token'], env, d)).rejects.toThrow(
      /plaintext http/,
    )
    expect(d.findRunningChrome).not.toHaveBeenCalled()
  })

  test('hands a fresh Chrome a redirect that leads to the tokenized url without carrying it', async () => {
    const seen: {redirectUrl?: string; location?: string | null} = {}
    const d = deps({launchChrome: vi.fn(async () => chromeThatOpens(seen))})
    await run([], env, d)

    expect(seen.redirectUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/[0-9a-f]{32}$/)
    expect(seen.redirectUrl).not.toContain(TOKEN)
    expect(seen.location).toBe(TARGET)
    expect(d.logged).toContain('Chrome pid: 4242')
    expect(d.logged).toContain(
      'Opened http://localhost:3333/test (signed in with STUDIO_AUTH_TOKEN)',
    )
    expect(d.logged.join('\n')).not.toContain(TOKEN)
  })

  test('opens the url in the authenticated running Chrome instead of launching', async () => {
    const seen: {url?: string} = {}
    const d = deps({
      findRunningChrome: vi.fn(async () => ({
        browserName: 'Chrome/148',
        open: async (url: string) => {
          seen.url = url
          await fetch(url, {redirect: 'manual'})
        },
      })),
    })
    await run(['--port=9333'], env, d)
    expect(seen.url).not.toContain(TOKEN)
    expect(d.launchChrome).not.toHaveBeenCalled()
    expect(d.logged).toContain(
      'Reused the browser that was already listening on http://127.0.0.1:9333',
    )
  })

  test('stops a fresh Chrome that never fetched the redirect, and closes the redirect', async () => {
    const stop = vi.fn()
    let redirectUrl = ''
    const d = deps({
      launchChrome: vi.fn(async () => ({
        browserName: 'Chrome/148',
        pid: 4242,
        stop,
        open: async (url: string) => {
          redirectUrl = url
        },
      })),
    })
    await expect(run([], env, d)).rejects.toThrow(/did not open the url within 0\.1s/)
    expect(stop).toHaveBeenCalledTimes(1)
    await expect(fetch(redirectUrl, {redirect: 'manual'})).rejects.toThrow()
  })

  test('stops a fresh Chrome that could not open the url', async () => {
    const stop = vi.fn()
    const d = deps({
      launchChrome: vi.fn(async () => ({
        browserName: 'Chrome/148',
        pid: 4242,
        stop,
        open: async () => {
          throw new Error('The Chrome listening on http://127.0.0.1:9222 has no blank page')
        },
      })),
    })
    await expect(run([], env, d)).rejects.toThrow(/no blank page/)
    expect(stop).toHaveBeenCalledTimes(1)
  })

  test('leaves a reused browser alone when it never fetched the redirect', async () => {
    const d = deps({
      findRunningChrome: vi.fn(async () => ({browserName: 'Chrome/148', open: async () => {}})),
    })
    await expect(run([], env, d)).rejects.toThrow(/did not open the url within 0\.1s/)
    expect(d.launchChrome).not.toHaveBeenCalled()
  })
})
