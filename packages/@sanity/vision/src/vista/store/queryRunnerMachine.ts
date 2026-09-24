import {type LiveEvent, type RawQueryResponse, type SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {type ActorRefFromLogic, assign, fromObservable, fromPromise, raise, setup} from 'xstate'

import {getPayloadBytes} from '../util/payloadSize'
import {getLiveRefetchTags} from '../util/syncTags'
import {
  type FetchHistoryEntry,
  type FetchReason,
  type QueryRequest,
  type VistaResponseMeta,
} from './types'

export const MAX_HISTORY_ENTRIES = 100

export interface QueryRunnerContext {
  tabId: string
  /** The request of the latest fetch; live refetches replay it */
  request: QueryRequest | undefined
  reason: FetchReason
  startedAt: number
  /** URL of the latest request, available as soon as a fetch starts */
  url: string | undefined
  result: unknown
  error: Error | undefined
  meta: VistaResponseMeta | undefined
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
  return [entry, ...history].slice(0, MAX_HISTORY_ENTRIES)
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
    runQuery: fromPromise<RawQueryResponse<unknown>, {request: QueryRequest}>(({input, signal}) =>
      input.request.client.fetch(input.request.query, input.request.params, {
        filterResponse: false,
        resultSourceMap: input.request.includeSourceMap || undefined,
        tag: 'vista',
        signal,
      }),
    ),
    liveEvents: fromObservable<LiveEvent, {client: SanityClient}>(({input}) =>
      input.client.live.events({includeDrafts: true, tag: 'vista'}),
    ),
  },
  guards: {
    hasResponse: ({context}) => context.meta !== undefined,
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
    clearResponse: assign({
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
            input: ({context}) => ({request: context.request as QueryRequest}),
            onDone: {
              target: 'settled',
              actions: assign(({context, event}) => {
                const response = event.output
                const e2eMs = Date.now() - context.startedAt
                const meta: VistaResponseMeta = {
                  url: context.request?.url || '',
                  ms: response.ms,
                  e2eMs,
                  payloadBytes: getPayloadBytes(response.result),
                  syncTags: response.syncTags || [],
                  resultSourceMap: response.resultSourceMap,
                }
                return {
                  result: response.result,
                  error: undefined,
                  meta,
                  history: appendHistory(context.history, {
                    id: uuid(),
                    requestedAt: new Date(context.startedAt).toISOString(),
                    reason: context.reason,
                    status: 'ok',
                    ms: response.ms,
                    e2eMs,
                    errorMessage: undefined,
                  }),
                }
              }),
            },
            onError: {
              target: 'failed',
              actions: assign(({context, event}) => {
                const error = toError(event.error)
                return {
                  result: undefined,
                  // The previous response's timings and tags no longer describe what is shown
                  meta: undefined,
                  error,
                  history: appendHistory(context.history, {
                    id: uuid(),
                    requestedAt: new Date(context.startedAt).toISOString(),
                    reason: context.reason,
                    status: 'error',
                    ms: undefined,
                    e2eMs: Date.now() - context.startedAt,
                    errorMessage: error.message,
                  }),
                }
              }),
            },
          },
          on: {
            cancel: [{guard: 'hasResponse', target: 'settled'}, {target: 'idle'}],
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
              guard: ({context, event}) =>
                context.request !== undefined &&
                getLiveRefetchTags(event.snapshot.context, context.meta?.syncTags) !== null,
              actions: raise(({context, event}) => ({
                type: 'fetch' as const,
                request: context.request as QueryRequest,
                reason: {
                  type: 'live' as const,
                  matchedTags:
                    getLiveRefetchTags(event.snapshot.context, context.meta?.syncTags) || [],
                },
              })),
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
