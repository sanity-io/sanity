import {type ProxyResponse, writeResponseHead} from '@repo/debug-proxy'

import {type MutationEventPayload} from './types'

const HEARTBEAT_INTERVAL_MS = 15_000

interface ListenerConnection {
  /** Document ids this listener subscribed to, or null for a catch-all. */
  ids: Set<string> | null
  res: ProxyResponse
  heartbeat: ReturnType<typeof setInterval>
}

/**
 * True once the response is finished or its peer is gone. The h1 and h2
 * response classes disagree on where liveness lives: `Http2ServerResponse`
 * never implements `destroyed` (it is always undefined on the compat class)
 * — the flag sits on its underlying `Http2Stream` instead.
 */
function isGone(res: ProxyResponse): boolean {
  if (res.writableEnded || res.destroyed) return true
  return 'stream' in res && res.stream.destroyed
}

/**
 * Write a raw chunk, dispatching across the h1/h2 response union — their
 * `write` overloads are incompatible when called through the union type
 * (same workaround as debug-proxy's internal writeChunk). Gone streams are
 * skipped: a broadcast or heartbeat can race an abrupt client disconnect,
 * whose 'close' teardown only runs on a later tick, and writing to a
 * destroyed response can surface as an 'error' event.
 */
function writeRaw(res: ProxyResponse, chunk: string): void {
  if (isGone(res)) return
  ;(res as {write: (chunk: string) => boolean}).write(chunk)
}

function writeEvent(res: ProxyResponse, event: string, data: unknown): void {
  writeRaw(res, `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

/**
 * The mock `/data/listen` hub. Each connection immediately receives a
 * `welcome` event (the studio's pair listener treats it as "fetch snapshots
 * now and go editable" — getPairListener.ts), then receives one `mutation`
 * event per affected document for every committed transaction whose ids
 * intersect its subscription.
 *
 * Both studio listeners are served: the document-pair listener (`$ids`
 * param) and the preview store's global catch-all listener (no `$ids`).
 */
export class ListenHub {
  private connections = new Set<ListenerConnection>()
  private welcomeCounter = 0

  connect(res: ProxyResponse, ids: string[] | null, extraHeaders: Record<string, string>): void {
    writeResponseHead(res, 200, undefined, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      ...extraHeaders,
    })

    const connection: ListenerConnection = {
      ids: ids ? new Set(ids) : null,
      res,
      heartbeat: setInterval(() => {
        writeRaw(res, ':\n\n')
      }, HEARTBEAT_INTERVAL_MS),
    }
    connection.heartbeat.unref?.()

    const teardown = () => {
      clearInterval(connection.heartbeat)
      this.connections.delete(connection)
    }
    res.on('close', teardown)
    // A write racing an abrupt disconnect emits 'error' on the response (the
    // h2 compat layer reports write-after-destroy this way, on the *next*
    // tick) — without a listener that's an uncaught 'error' that kills the
    // whole mock process mid-run. Treat it exactly like 'close'.
    res.on('error', teardown)
    this.connections.add(connection)

    this.welcomeCounter += 1
    writeEvent(res, 'welcome', {listenerName: `bench-listener-${this.welcomeCounter}`})
  }

  broadcast(events: MutationEventPayload[]): void {
    for (const event of events) {
      for (const connection of this.connections) {
        if (connection.ids === null || connection.ids.has(event.documentId)) {
          writeEvent(connection.res, 'mutation', event)
        }
      }
    }
  }

  /** Disconnect all listeners (used by /_bench/reset between sessions). */
  closeAll(): void {
    for (const connection of this.connections) {
      clearInterval(connection.heartbeat)
      if (!isGone(connection.res)) {
        connection.res.end()
      }
    }
    this.connections.clear()
  }

  get connectionCount(): number {
    return this.connections.size
  }
}
