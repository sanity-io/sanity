/* eslint-disable @typescript-eslint/no-use-before-define */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {groupBy} from 'lodash'
import {defer, EMPTY, merge, type Observable, of as observableOf, of, timeout, timer} from 'rxjs'
import {
  concatMap,
  delay,
  filter,
  map,
  mergeMap,
  scan,
  share,
  startWith,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'

import {
  type IdPair,
  type MutationEvent,
  type PendingMutationsEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from './types'

interface Snapshots {
  draft: SanityDocument | null
  published: SanityDocument | null
}

/** @internal */
export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: SanityDocument | null
}

interface RelayOptions {
  exchangeWaitMin: number
  exchangeWaitMax: number
  exchangeOverLapTime: number
  exchangeTimeout: number
}

/** @internal */
export interface PairListenerOptions {
  tag?: string
  relay: RelayOptions
}

/** @internal */
export type ListenerEvent =
  | MutationEvent
  | ReconnectEvent
  | InitialSnapshotEvent
  | PendingMutationsEvent

const PENDING_START: PendingMutationsEvent = {type: 'pending', phase: 'begin'}
const PENDING_END: PendingMutationsEvent = {type: 'pending', phase: 'end'}

function isMutationEvent(msg: ListenerEvent): msg is MutationEvent {
  return msg.type === 'mutation'
}
function isMultiTransactionEvent(msg: MutationEvent) {
  return msg.transactionTotalEvents > 1
}

function allPendingTransactionEventsReceived(listenerEvents: ListenerEvent[]) {
  const groupedMutations = groupBy(
    listenerEvents.filter((ev): ev is MutationEvent => ev.type === 'mutation'),
    (e) => e.transactionId,
  )
  // Note: we can't assume that the events come in order, so instead of checking the counter attributes we check that we have actually received all
  return Object.values(groupedMutations).every(
    (mutations) => mutations.length === mutations[0].transactionTotalEvents,
  )
}

/** Add some randomness to the exchange delay to avoid thundering herd */
function getExchangeWait(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min))
}

/** @internal */
export function createPairListener(
  client: SanityClient,
  idPair: IdPair,
  options?: PairListenerOptions,
): Observable<ListenerEvent> {
  const {publishedId, draftId} = idPair
  return createRelayPairListener(client, idPair, options).pipe(
    concatMap((event) =>
      event.type === 'welcome'
        ? fetchInitialDocumentSnapshots().pipe(
            concatMap((snapshots) => [
              createSnapshotEvent(draftId, snapshots.draft),
              createSnapshotEvent(publishedId, snapshots.published),
            ]),
          )
        : observableOf(event),
    ),
    scan(
      (acc: {next: ListenerEvent[]; buffer: ListenerEvent[]}, msg) => {
        // we only care about mutation events
        if (!isMutationEvent(msg)) {
          return {next: [msg], buffer: []}
        }

        const isBuffering = acc.buffer.length > 0
        const isMulti = isMultiTransactionEvent(msg)
        if (!isMulti && !isBuffering) {
          // simple case, we have no buffer, and the event is a single-transaction event, so just pass it on
          return {next: [msg], buffer: []}
        }

        if (!isMulti) {
          // we have received a single transaction event while waiting for the rest of events from a multi transaction
          // put it in the buffer
          return {next: [], buffer: acc.buffer.concat(msg)}
        }

        const nextBuffer = acc.buffer.concat(msg)
        if (allPendingTransactionEventsReceived(nextBuffer)) {
          // we have received all pending transactions, emit the buffer, and signal end of buffer
          return {next: nextBuffer.concat(PENDING_END), buffer: []}
        }
        // if we get here, we are still waiting for more multi-transaction messages
        // if nextBuffer only has one element, we know we just started buffering
        return {next: nextBuffer.length === 1 ? [PENDING_START] : [], buffer: nextBuffer}
      },
      {next: [], buffer: []},
    ),
    // note: this flattens the array, and in the case of an empty array, no event will be pushed downstream
    mergeMap((v) => v.next),
  )

  function fetchInitialDocumentSnapshots(): Observable<Snapshots> {
    return client.observable
      .getDocuments<SanityDocument>([draftId, publishedId], {tag: 'document.snapshots'})
      .pipe(
        map(([draft, published]) => ({
          draft,
          published,
        })),
      )
  }
}

type ClientListenerEvent = WelcomeEvent | MutationEvent | ReconnectEvent

function createRelayPairListener(
  client: SanityClient,
  idPair: IdPair,
  options?: PairListenerOptions,
): Observable<ClientListenerEvent> {
  const {publishedId, draftId} = idPair
  const currentLeg = defer(
    () =>
      client.observable.listen(
        `*[_id == $publishedId || _id == $draftId]`,
        {publishedId, draftId},
        {
          includeResult: false,
          events: ['welcome', 'mutation', 'reconnect'],
          effectFormat: 'mendoza',
          tag: options?.tag || 'document.pair-listener',
        },
      ) as Observable<ClientListenerEvent>,
  ).pipe(share())

  if (!options?.relay) {
    return currentLeg
  }

  const {exchangeWaitMin, exchangeWaitMax, exchangeOverLapTime, exchangeTimeout} = options.relay

  // This represents the next leg, and will be started after a certain delay
  const nextLeg = currentLeg.pipe(
    // make sure we are connected to the current leg before scheduling the next one. This prevents build-up in case it takes a while to connect
    filter((ev) => ev.type === 'welcome'),
    // current listener may still get disconnected and reconnect,
    // so in case we receive a new welcome event we should cancel the previously scheduled next leg
    switchMap(() => timer(getExchangeWait(exchangeWaitMin, exchangeWaitMax))),
    take(1),
    mergeMap(() =>
      createRelayPairListener(client, idPair, options).pipe(
        // this will make sure that if it takes too long to connect to the next, we will just ignore it and continue with the current leg
        timeout({
          first: exchangeTimeout,
          with: () => EMPTY,
        }),
      ),
    ),
    share(),
  )

  // this will emit a single event after the first 'welcome' event is emitted from next leg, plus a delay adding a bit of overlap time
  const nextLegReady = nextLeg.pipe(
    filter((e) => e.type === 'welcome'),
    take(1),
    delay(exchangeOverLapTime),
    map(() => true),
    share(),
  )

  // Merge messages from current leg with next leg into a single stream
  return merge(
    currentLeg.pipe(takeUntil(nextLegReady)),
    // ignore the first welcome event from the next leg.
    nextLeg.pipe(filter((e, index) => e.type !== 'welcome' || index > 0)),
  ).pipe(distinctByEventIdUntilChanged(nextLegReady))
}

/**
 * Operator function that takes a stream of listener events
 * and returns a new stream that filters out events sharing the same eventId
 * The argument is a notifier that signals when to stop filtering out duplicate events
 */
function distinctByEventIdUntilChanged(notifier: Observable<unknown>) {
  return (input$: Observable<ClientListenerEvent>) => {
    // This keeps track of the eventIds we have seen
    const seen = new Set<string>()
    return input$.pipe(
      withLatestFrom(
        notifier.pipe(
          map(() => true),
          startWith(false),
        ),
      ),
      mergeMap(([event, untilPassed]): Observable<ClientListenerEvent> => {
        if (event.type !== 'mutation') {
          return of(event)
        }
        if (seen.has(event.eventId)) {
          return EMPTY
        }
        if (untilPassed) {
          seen.clear()
          return of(event)
        }
        seen.add(event.eventId)
        return of(event)
      }),
    )
  }
}

function createSnapshotEvent(
  documentId: string,
  document: null | SanityDocument,
): InitialSnapshotEvent {
  return {
    type: 'snapshot',
    documentId,
    document,
  }
}
