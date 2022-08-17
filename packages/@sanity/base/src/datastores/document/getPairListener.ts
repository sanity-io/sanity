import type {SanityDocument} from '@sanity/types'
import {
  of as observableOf,
  Observable,
  partition,
  merge,
  ReplaySubject,
  GroupedObservable,
} from 'rxjs'
import {bufferCount, concatAll, concatMap, groupBy, map, share, skip} from 'rxjs/operators'
import type {IdPair, MutationEvent, ReconnectEvent, SanityClient, WelcomeEvent} from './types'

interface Snapshots {
  draft: SanityDocument | null
  published: SanityDocument | null
}

export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: SanityDocument | null
}

export interface PairListenerOptions {
  tag?: string
}

export type PairListenerEvent = MutationEvent | ReconnectEvent | InitialSnapshotEvent

export type ListenableClient = {
  observable: Pick<SanityClient['observable'], 'listen' | 'getDocuments'>
}

export function getPairListener(
  client: ListenableClient,
  idPair: IdPair,
  options: PairListenerOptions = {}
): Observable<PairListenerEvent> {
  const {publishedId, draftId} = idPair
  const events$ = (client.observable.listen(`*[_id == $publishedId || _id == $draftId]`, idPair, {
    includeResult: false,
    events: ['welcome', 'mutation', 'reconnect'],
    effectFormat: 'mendoza',
    tag: options.tag || 'document.pair-listener',
  }) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent>).pipe(
    concatMap((event) =>
      event.type === 'welcome'
        ? fetchInitialDocumentSnapshots().pipe(
            concatMap((snapshots) => [
              createSnapshotEvent(draftId, snapshots.draft),
              createSnapshotEvent(publishedId, snapshots.published),
            ])
          )
        : observableOf(event)
    ),
    share()
  )

  const [mutations$, reconnectAndSnapshots$] = partition(
    events$,
    (event): event is MutationEvent => event.type === 'mutation'
  ) as [Observable<MutationEvent>, Observable<ReconnectEvent | InitialSnapshotEvent>]

  return merge(
    mutations$.pipe(
      map(polyfillCounts),

      // We want to group all the mutation events that were involved in a transaction together,
      // in order to keep a consistent view of draft and published document states. To know
      // whether or not a transaction contained multiple mutations, we need to check the
      // `eventNumber.total` field of the mutation event.
      groupBy(
        // `groupBy` expects a function that returns a key for each event. While it can
        // technically be an object, it uses a Map internally; so we need to be referentially
        // equal to the key we want to group by, thus the hacky string concatenation key.
        createGroupKey,
        // Element selector - we want the full event, so leave the default `null` value.
        null,
        // We want to let `groupBy` know when we're done with a group so it can delete it
        // from its internal map, preventing memory leaks.
        (group$) => group$.pipe(skip(getGroupEventCount(group$) - 1)),
        // We need to use a `ReplaySubject` here instead of the default `Subject`, since we
        // are utilizing a `concatMap` operator below. If we use a `Subject`, any events within
        // a different group will be dropped, since nothing is subscribing to the group.
        () => new ReplaySubject<MutationEvent>()
      ),
      // Wait for all events in a group to be emitted before emitting the group.
      concatMap((group$) => group$.pipe(bufferCount(getGroupEventCount(group$)))),
      // Flatten all the events of the group
      concatAll()
    ),

    // Emit reconnect and snapshot events as-is
    reconnectAndSnapshots$
  )

  function fetchInitialDocumentSnapshots(): Observable<Snapshots> {
    return client.observable
      .getDocuments<SanityDocument>([draftId, publishedId], {tag: 'document.snapshots'})
      .pipe(
        map(([draft, published]) => ({
          draft,
          published,
        }))
      )
  }
}

function createSnapshotEvent(
  documentId: string,
  document: null | SanityDocument
): InitialSnapshotEvent {
  return {
    type: 'snapshot',
    documentId,
    document,
  }
}

function createGroupKey(event: MutationEvent): string {
  return `${event.eventNumber.total}#${event.transactionId}`
}

function getGroupEventCount(group: GroupedObservable<string, unknown>): number {
  return parseInt(group.key.slice(0, group.key.indexOf('#')), 10)
}

function polyfillCounts(evt: MutationEvent): MutationEvent {
  if (!evt.eventNumber && evt.transactionId.startsWith('publish')) {
    evt.eventNumber = {
      current: evt.transition === 'disappear' ? 1 : 2,
      total: 2,
    }
  } else if (!evt.eventNumber) {
    evt.eventNumber = {
      current: 1,
      total: 1,
    }
  }

  return evt
}
