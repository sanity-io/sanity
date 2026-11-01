import {
  type LiveEvent,
  type RawQueryResponse,
  type SanityClient,
  type SyncTag,
} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {dequal} from 'dequal/lite'
import {
  type ActorRefFromLogic,
  assign,
  fromObservable,
  fromPromise,
  raise,
  setup,
  type SnapshotFrom,
} from 'xstate'

import {getPayloadBytes} from '../util/payloadSize'
import {fetchWithNetwork, type QueryNetwork} from '../util/queryNetwork'
import {getLiveRefetchTags} from '../util/syncTags'
import {
  type FetchHistoryEntry,
  type FetchReason,
  type HistoryResult,
  type QueryRequest,
  type ResultChange,
  type VisionResponseMeta,
} from './types'

export const MAX_HISTORY_ENTRIES = 100
/**
 * Results kept on history entries besides the latest one, which is on screen anyway. Automatic
 * refetching adds a result with every relevant change, so only the most recent ones stay
 */
export const MAX_KEPT_RESULTS = 10
/** Results larger than this (as compact JSON) are neither compared nor kept once superseded */
export const MAX_COMPARED_RESULT_BYTES = 1_000_000

export interface QueryRunnerContext {
  tabId: string
  /** The request of the latest fetch; live refetches replay it */
  request: QueryRequest | undefined
  /** The request the shown `result` and `meta` belong to */
  settledRequest: QueryRequest | undefined
  /**
   * Sync tags of the last successful response, kept while later fetches of the same request
   * fail so live events keep matching and retry it
   */
  syncTags: SyncTag[] | undefined
  /** URL of the request `syncTags` were computed for */
  syncTagsUrl: string | undefined
  reason: FetchReason
  startedAt: number
  /** URL of the latest request, available as soon as a fetch starts */
  url: string | undefined
  result: unknown
  error: Error | undefined
  meta: VisionResponseMeta | undefined
  history: FetchHistoryEntry[]
  liveClient: SanityClient | undefined
  liveError: Error | undefined
}

export type QueryRunnerEvent =
  | {type: 'fetch'; request: QueryRequest; reason: FetchReason}
  | {type: 'cancel'}
  | {type: 'clear'}
  | {type: 'live.enable'; client: SanityClient}
  | {type: 'live.disable'}

export interface QueryRunnerInput {
  tabId: string
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function appendHistory(
  history: FetchHistoryEntry[],
  entry: FetchHistoryEntry,
): FetchHistoryEntry[] {
  let kept = 0
  return [entry, ...history].slice(0, MAX_HISTORY_ENTRIES).map((item, index) => {
    if (index === 0 || item.result === undefined) return item
    if (kept < MAX_KEPT_RESULTS && item.result.bytes <= MAX_COMPARED_RESULT_BYTES) {
      kept++
      return item
    }
    return {...item, result: undefined}
  })
}

function compareWithPrevious(
  history: FetchHistoryEntry[],
  next: HistoryResult,
): ResultChange | undefined {
  const previous = history.find((entry) => entry.status === 'ok')
  if (previous === undefined) return undefined
  // The latest successful result is only dropped for its size, so a missing one is too large too
  if (
    previous.result === undefined ||
    previous.result.bytes > MAX_COMPARED_RESULT_BYTES ||
    next.bytes > MAX_COMPARED_RESULT_BYTES
  ) {
    return 'too-large'
  }
  return dequal(previous.result.value, next.value) ? 'unchanged' : 'changed'
}

/**
 * Runs the GROQ queries of one tab and keeps the response, the fetch history and the live
 * (sync tag) subscription. The `request` region owns the fetch lifecycle; a new `fetch` event
 * while one is in flight aborts it through the promise actor's signal and starts over. The `live`
 * region subscribes to the Live Content API while enabled and raises a `fetch` whenever an event
 * carries a sync tag from the last response.
 */
export const queryRunnerMachine = setup({
  types: {} as {
    context: QueryRunnerContext
    events: QueryRunnerEvent
    input: QueryRunnerInput
  },
  actors: {
    runQuery: fromPromise<
      {response: RawQueryResponse<unknown>; network: QueryNetwork | undefined},
      {request: QueryRequest; lastLiveEventId: string | undefined}
    >(({input, signal}) =>
      fetchWithNetwork(input.request.client, input.request.query, input.request.params, {
        filterResponse: false,
        resultSourceMap: input.request.includeSourceMap || undefined,
        // Per request: the client ignores a configured `useCdn` while it signs in with a cookie
        useCdn: input.request.useCdn,
        // The live event that triggered the refetch, so the CDN does not answer from its cache
        lastLiveEventId: input.lastLiveEventId,
        tag: 'vision',
        signal,
      }),
    ),
    liveEvents: fromObservable<LiveEvent, {client: SanityClient}>(({input}) =>
      input.client.live.events({includeDrafts: true, tag: 'vision'}),
    ),
  },
  guards: {
    hasResponse: ({context}) => context.settledRequest !== undefined,
  },
  actions: {
    storeRequest: assign({
      request: ({context, event}) => (event.type === 'fetch' ? event.request : context.request),
      reason: ({context, event}) => (event.type === 'fetch' ? event.reason : context.reason),
    }),
    markStarted: assign({
      startedAt: () => Date.now(),
      url: ({context}) => context.request?.url,
      error: undefined,
    }),
    // A cancelled fetch leaves the previous response on screen, so the request goes back to it
    restoreSettledRequest: assign({
      request: ({context}) => context.settledRequest,
      url: ({context}) => context.settledRequest?.url,
      error: undefined,
    }),
    clearResponse: assign({
      request: undefined,
      settledRequest: undefined,
      syncTags: undefined,
      syncTagsUrl: undefined,
      url: undefined,
      result: undefined,
      error: undefined,
      meta: undefined,
    }),
    storeLiveClient: assign({
      liveClient: ({context, event}) =>
        event.type === 'live.enable' ? event.client : context.liveClient,
      liveError: undefined,
    }),
  },
}).createMachine({
  id: 'queryRunner',
  type: 'parallel',
  context: ({input}) => ({
    tabId: input.tabId,
    request: undefined,
    settledRequest: undefined,
    syncTags: undefined,
    syncTagsUrl: undefined,
    reason: {type: 'manual'},
    startedAt: 0,
    url: undefined,
    result: undefined,
    error: undefined,
    meta: undefined,
    history: [],
    liveClient: undefined,
    liveError: undefined,
  }),
  states: {
    request: {
      initial: 'idle',
      on: {
        fetch: {target: '.fetching', actions: 'storeRequest'},
        clear: {target: '.idle', actions: 'clearResponse'},
      },
      states: {
        idle: {},
        fetching: {
          entry: 'markStarted',
          invoke: {
            src: 'runQuery',
            input: ({context}) => ({
              request: context.request as QueryRequest,
              lastLiveEventId:
                context.request?.useCdn && context.reason.type === 'live'
                  ? context.reason.eventId
                  : undefined,
            }),
            onDone: {
              target: 'settled',
              actions: assign(({context, event}) => {
                const {response, network} = event.output
                const e2eMs = Date.now() - context.startedAt
                const meta: VisionResponseMeta = {
                  url: context.request?.url || '',
                  ms: response.ms,
                  e2eMs,
                  payloadBytes: getPayloadBytes(response.result),
                  syncTags: response.syncTags || [],
                  resultSourceMap: response.resultSourceMap,
                  network,
                }
                const historyResult: HistoryResult = {
                  value: response.result,
                  bytes: meta.payloadBytes,
                }
                return {
                  settledRequest: context.request,
                  syncTags: meta.syncTags,
                  syncTagsUrl: context.request?.url,
                  result: response.result,
                  error: undefined,
                  meta,
                  history: appendHistory(context.history, {
                    id: uuid(),
                    requestedAt: new Date(context.startedAt).toISOString(),
                    reason: context.reason,
                    url: meta.url,
                    query: context.request?.query ?? '',
                    params: context.request?.params ?? {},
                    status: 'ok',
                    ms: response.ms,
                    e2eMs,
                    errorMessage: undefined,
                    network,
                    result: historyResult,
                    resultChange: compareWithPrevious(context.history, historyResult),
                  }),
                }
              }),
            },
            onError: {
              target: 'failed',
              actions: assign(({context, event}) => {
                const error = toError(event.error)
                // The previous response is gone from the screen. Its sync tags live on while the
                // failed fetch was for the same request, so relevant content changes still retry
                // it; tags of another request would only retry this one on unrelated changes
                const sameRequest = context.request?.url === context.syncTagsUrl
                return {
                  settledRequest: undefined,
                  result: undefined,
                  meta: undefined,
                  syncTags: sameRequest ? context.syncTags : undefined,
                  syncTagsUrl: sameRequest ? context.syncTagsUrl : undefined,
                  error,
                  history: appendHistory(context.history, {
                    id: uuid(),
                    requestedAt: new Date(context.startedAt).toISOString(),
                    reason: context.reason,
                    url: context.request?.url || '',
                    query: context.request?.query ?? '',
                    params: context.request?.params ?? {},
                    status: 'error',
                    ms: undefined,
                    e2eMs: Date.now() - context.startedAt,
                    errorMessage: error.message,
                    network: undefined,
                    result: undefined,
                    resultChange: undefined,
                  }),
                }
              }),
            },
          },
          on: {
            cancel: [
              {guard: 'hasResponse', target: 'settled', actions: 'restoreSettledRequest'},
              {target: 'idle', actions: 'clearResponse'},
            ],
          },
        },
        settled: {},
        failed: {},
      },
    },
    live: {
      initial: 'off',
      states: {
        off: {
          entry: assign({liveError: undefined}),
          on: {
            'live.enable': {target: 'on', actions: 'storeLiveClient'},
          },
        },
        on: {
          invoke: {
            src: 'liveEvents',
            input: ({context}) => ({client: context.liveClient as SanityClient}),
            onSnapshot: {
              guard: ({context, event}) => {
                if (context.request === undefined) return false
                const matched = getLiveRefetchTags(event.snapshot.context, context.syncTags)
                if (matched === null) return false
                // The tags belong to the response shown; a message matching them says nothing
                // about a different request in flight, which would only be restarted by it. A
                // restart (no tags) replays whatever the current request is
                return matched.length === 0 || context.request.url === context.syncTagsUrl
              },
              actions: raise(({context, event}) => {
                const liveEvent = event.snapshot.context
                const eventId =
                  liveEvent && 'id' in liveEvent && typeof liveEvent.id === 'string'
                    ? liveEvent.id
                    : undefined
                return {
                  type: 'fetch' as const,
                  request: context.request as QueryRequest,
                  reason: {
                    type: 'live' as const,
                    matchedTags: getLiveRefetchTags(liveEvent, context.syncTags) || [],
                    ...(eventId === undefined ? {} : {eventId}),
                  },
                }
              }),
            },
            onError: {
              target: 'failed',
              actions: assign({liveError: ({event}) => toError(event.error)}),
            },
          },
          on: {
            'live.disable': {target: 'off'},
            // A new client (for instance after switching dataset) needs a new subscription
            'live.enable': {target: 'on', reenter: true, actions: 'storeLiveClient'},
          },
        },
        failed: {
          on: {
            'live.disable': {target: 'off'},
            'live.enable': {target: 'on', actions: 'storeLiveClient'},
          },
        },
      },
    },
  },
})

export type QueryRunnerRef = ActorRefFromLogic<typeof queryRunnerMachine>
export type QueryRunnerSnapshot = SnapshotFrom<typeof queryRunnerMachine>

export type RequestStatus = 'idle' | 'fetching' | 'settled' | 'failed'

export function selectRequestStatus(snapshot: QueryRunnerSnapshot): RequestStatus {
  if (snapshot.matches({request: 'fetching'})) return 'fetching'
  if (snapshot.matches({request: 'failed'})) return 'failed'
  if (snapshot.matches({request: 'settled'})) return 'settled'
  return 'idle'
}

export function selectIsFetching(snapshot: QueryRunnerSnapshot): boolean {
  return snapshot.matches({request: 'fetching'})
}
