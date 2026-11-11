import {type ClientConfig} from '@sanity/client'
import once from 'lodash-es/once.js'

type FetchFunction = ReturnType<NonNullable<ClientConfig['resolveFetch']>>
type FetchResponse = Awaited<ReturnType<FetchFunction>>
type FetchInit = Parameters<FetchFunction>[1]

/** @internal */
export interface ListenerCounts {
  open: number
  peak: number
}

const listenerCounts: ListenerCounts = {open: 0, peak: 0}
const listenerCountsByHost = new Map<string, number>()
const listenerCountSubscribers = new Set<(counts: Readonly<ListenerCounts>) => void>()

/**
 * How many listeners the Studio's clients hold open in this tab right now, and the most it has
 * held at once since the page loaded. A listener counts from the moment it is requested, so one
 * queued behind the browser's connection limit counts too.
 *
 * @internal
 */
export function getListenerCounts(): Readonly<ListenerCounts> {
  return {...listenerCounts}
}

/**
 * Whether `host` shares connection capacity with `scope`: either the same host, or a host the
 * browser pools onto `scope`'s connection (`<projectId>.<scope>`, never stripping labels off
 * `host` itself, which would misfire for an unlabelled host equal to `scope`).
 *
 * @internal
 */
export function hostMatchesScope(host: string, scope: string): boolean {
  return host === scope || host.endsWith(`.${scope}`)
}

/**
 * How many listeners this tab holds open to hosts in `scope` right now, summed across every
 * full, unstripped request host that {@link hostMatchesScope} matches to it.
 *
 * @internal
 */
export function getListenerCountForScope(scope: string): number {
  return Array.from(listenerCountsByHost.entries()).reduce(
    (total, [host, count]) => (hostMatchesScope(host, scope) ? total + count : total),
    0,
  )
}

/**
 * Calls `subscriber` whenever a listener opens or closes in this tab. Returns a function that
 * stops the calls.
 *
 * @internal
 */
export function subscribeListenerCounts(
  subscriber: (counts: Readonly<ListenerCounts>) => void,
): () => void {
  listenerCountSubscribers.add(subscriber)
  return () => {
    listenerCountSubscribers.delete(subscriber)
  }
}

function notifyListenerCountSubscribers(): void {
  const counts = getListenerCounts()
  listenerCountSubscribers.forEach((subscriber) => subscriber(counts))
}

/**
 * A `resolveFetch` for the Studio's clients that counts every listener they open, whichever
 * API it uses (`listen`, `live.events`), and passes every other request through untouched.
 *
 * @internal
 */
export function resolveListenerCountingFetch(): FetchFunction {
  return countingFetch
}

function countingFetch(input: string, init?: FetchInit): Promise<FetchResponse> {
  return isEventStreamRequest(init) ? fetchListener(input, init) : globalThis.fetch(input, init)
}

function isEventStreamRequest(init: FetchInit): boolean {
  return new Headers(init?.headers).get('accept')?.includes('text/event-stream') ?? false
}

function requestHost(input: string): string {
  try {
    return new URL(input).host
  } catch {
    return 'unknown'
  }
}

async function fetchListener(input: string, init: FetchInit): Promise<FetchResponse> {
  const release = openListener(requestHost(input))
  init?.signal?.addEventListener('abort', release, {once: true})

  try {
    const response = await globalThis.fetch(input, init)
    if (isOpenEventStream(response)) {
      return withBody(response, releaseOnEnd(response.body, release))
    }
    release()
    return response
  } catch (error) {
    release()
    throw error
  }
}

/**
 * Counts a listener opened outside the Studio's clients, such as a raw `EventSource`, against
 * `host`. Call the returned function once the listener closes; calling it again does nothing.
 *
 * @internal
 */
export function openListener(host: string): () => void {
  listenerCounts.open += 1
  listenerCounts.peak = Math.max(listenerCounts.peak, listenerCounts.open)
  listenerCountsByHost.set(host, (listenerCountsByHost.get(host) ?? 0) + 1)
  notifyListenerCountSubscribers()

  return once(() => {
    listenerCounts.open -= 1
    listenerCountsByHost.set(host, (listenerCountsByHost.get(host) ?? 1) - 1)
    notifyListenerCountSubscribers()
  })
}

function isOpenEventStream(
  response: FetchResponse,
): response is FetchResponse & {body: ReadableStream<Uint8Array>} {
  return (
    response.ok &&
    response.body !== null &&
    (response.headers.get('content-type')?.includes('text/event-stream') ?? false)
  )
}

// The server can end a stream without the client aborting it, so the end of the body is the
// only reliable signal that the connection has closed.
function releaseOnEnd(
  body: ReadableStream<Uint8Array>,
  release: () => void,
): ReadableStream<Uint8Array> {
  const reader = body.getReader()
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read()
        if (chunk.done) {
          release()
          controller.close()
          return
        }
        controller.enqueue(chunk.value)
      } catch (error) {
        release()
        controller.error(error)
      }
    },
    cancel(reason) {
      release()
      return reader.cancel(reason)
    },
  })
}

function withBody(response: FetchResponse, body: ReadableStream<Uint8Array>): FetchResponse {
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    url: response.url,
    redirected: response.redirected,
    body,
    text: () => new Response(body).text(),
    arrayBuffer: () => new Response(body).arrayBuffer(),
  }
}
