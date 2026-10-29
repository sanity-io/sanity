import {
  defer,
  EMPTY,
  merge,
  type Observable,
  type OperatorFunction,
  Subject,
  throwError,
  timer,
} from 'rxjs'
import {map, mergeMap, scan, switchMap, takeUntil, tap} from 'rxjs/operators'

import {type ListenerEvent} from '../getPairListener'
import {type MutationEvent} from '../types'

const DEFAULT_STALL_TIMEOUT_MS = 30_000
const RECENT_TRANSACTION_TTL_MS = 60_000

/** @internal */
export interface ListenerStallDetails {
  /** The server sent the update for our save, but Studio is still holding it back. */
  echoReceivedFromServer: boolean
  /** Studio is waiting for the rest of a transaction that spans several documents. */
  waitingOnMultiDocumentTransaction: boolean
  /** Saves the server confirmed that never came back over the listener. */
  unconfirmedCommits: number
  /** Time since the listener last received anything for this document pair. */
  msSinceLastListenerEvent?: number
}

/** @internal */
export class ListenerStalledError extends Error {
  details: ListenerStallDetails
  constructor(details: ListenerStallDetails) {
    super('Saved changes were not echoed by the listener in time')
    this.name = 'ListenerStalledError'
    this.details = details
  }
}

type Signal =
  | {kind: 'server'; event: ListenerEvent; at: number}
  | {kind: 'delivered'; event: ListenerEvent; at: number}
  | {kind: 'acknowledged'; transactionId: string; at: number}

interface StallState {
  connected: boolean
  unconfirmed: Array<{transactionId: string; since: number}>
  delivered: Map<string, number>
  receivedFromServer: Map<string, number>
  multiDocumentTransactions: Map<string, {total: number; seen: number}>
  lastListenerEventAt?: number
}

const INITIAL_STATE: StallState = {
  connected: false,
  unconfirmed: [],
  delivered: new Map(),
  receivedFromServer: new Map(),
  multiDocumentTransactions: new Map(),
}

function withoutExpired(entries: Map<string, number>, now: number): Map<string, number> {
  return new Map([...entries].filter(([, seenAt]) => now - seenAt < RECENT_TRANSACTION_TTL_MS))
}

function recordServerMutation(state: StallState, event: MutationEvent, at: number): StallState {
  const multiDocumentTransactions = new Map(state.multiDocumentTransactions)
  if (event.transactionTotalEvents > 1) {
    const progress = multiDocumentTransactions.get(event.transactionId)
    const seen = (progress?.seen ?? 0) + 1
    if (seen >= event.transactionTotalEvents) {
      multiDocumentTransactions.delete(event.transactionId)
    } else {
      multiDocumentTransactions.set(event.transactionId, {
        total: event.transactionTotalEvents,
        seen,
      })
    }
  }
  return {
    ...state,
    multiDocumentTransactions,
    receivedFromServer: withoutExpired(state.receivedFromServer, at).set(event.transactionId, at),
  }
}

function reduceServerEvent(state: StallState, event: ListenerEvent, at: number): StallState {
  const heard = {...state, lastListenerEventAt: at}
  switch (event.type) {
    case 'reconnect':
      return {...heard, connected: false}
    case 'welcome':
    case 'reset':
      // A fresh snapshot is fetched, so every earlier save is accounted for
      return {...INITIAL_STATE, connected: true, lastListenerEventAt: at}
    case 'welcomeback':
      // The server replays what we missed; time spent offline doesn't count
      return {
        ...heard,
        connected: true,
        unconfirmed: heard.unconfirmed.map((entry) => ({...entry, since: at})),
      }
    case 'mutation':
      return recordServerMutation(heard, event, at)
    default:
      return heard
  }
}

function reduceSignal(state: StallState, signal: Signal): StallState {
  switch (signal.kind) {
    case 'server':
      return reduceServerEvent(state, signal.event, signal.at)
    case 'delivered': {
      const {event} = signal
      if (event.type === 'mutation') {
        return {
          ...state,
          unconfirmed: state.unconfirmed.filter(
            (entry) => entry.transactionId !== event.transactionId,
          ),
          delivered: withoutExpired(state.delivered, signal.at).set(event.transactionId, signal.at),
        }
      }
      return state
    }
    case 'acknowledged':
      // The listener can deliver a transaction before its HTTP response arrives
      if (state.delivered.has(signal.transactionId)) return state
      return {
        ...state,
        unconfirmed: state.unconfirmed.concat({
          transactionId: signal.transactionId,
          since: signal.at,
        }),
      }
  }
}

function describeStall(state: StallState, now: number): ListenerStallDetails {
  return {
    echoReceivedFromServer: state.unconfirmed.some((entry) =>
      state.receivedFromServer.has(entry.transactionId),
    ),
    waitingOnMultiDocumentTransaction: state.multiDocumentTransactions.size > 0,
    unconfirmedCommits: state.unconfirmed.length,
    msSinceLastListenerEvent:
      state.lastListenerEventAt === undefined ? undefined : now - state.lastListenerEventAt,
  }
}

/**
 * Errors when a confirmed save isn't echoed by the listener within `timeout` while connected.
 * Our own saves are the only signal that a silent listener is missing updates.
 *
 * @internal
 */
export function watchForListenerStall(options: {
  serverEvents$: Observable<ListenerEvent>
  commitAcknowledged$: Observable<string>
  timeout?: number
}): OperatorFunction<ListenerEvent, ListenerEvent> {
  const {serverEvents$, commitAcknowledged$, timeout = DEFAULT_STALL_TIMEOUT_MS} = options

  return (deliveredEvents$) =>
    defer(() => {
      // Not `share()`: a source that emits on subscribe would skip the later subscriber
      const delivered$ = new Subject<ListenerEvent>()
      const deliveryEnded$ = new Subject<void>()
      const stall$ = merge(
        serverEvents$.pipe(map((event): Signal => ({kind: 'server', event, at: Date.now()}))),
        delivered$.pipe(map((event): Signal => ({kind: 'delivered', event, at: Date.now()}))),
        commitAcknowledged$.pipe(
          map((transactionId): Signal => ({kind: 'acknowledged', transactionId, at: Date.now()})),
        ),
      ).pipe(
        scan(reduceSignal, INITIAL_STATE),
        switchMap((state) => {
          const [oldest] = state.unconfirmed
          if (state.connected && oldest) {
            return timer(Math.max(0, oldest.since + timeout - Date.now())).pipe(
              mergeMap(() =>
                throwError(() => new ListenerStalledError(describeStall(state, Date.now()))),
              ),
            )
          }
          return EMPTY
        }),
        takeUntil(deliveryEnded$),
      )
      return merge(
        stall$,
        deliveredEvents$.pipe(
          tap({
            next: (event) => delivered$.next(event),
            finalize: () => deliveryEnded$.next(),
          }),
        ),
      )
    })
}
