/* eslint-disable @typescript-eslint/no-use-before-define */
import type {SanityDocument} from '@sanity/types'
import {defer, of as observableOf, Observable, timer} from 'rxjs'
import {concatMap, map, mapTo, mergeMap, tap} from 'rxjs/operators'
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

export type {MutationEvent}

export type ListenerEvent = MutationEvent | ReconnectEvent | InitialSnapshotEvent

export function getPairListener(
  client: SanityClient,
  idPair: IdPair,
  options: PairListenerOptions = {}
) {
  const {publishedId, draftId} = idPair
  return defer(
    () =>
      client.observable.listen(
        `*[_id == $publishedId || _id == $draftId]`,
        {
          publishedId,
          draftId,
        },
        {
          includeResult: false,
          events: ['welcome', 'mutation', 'reconnect'],
          effectFormat: 'mendoza',
          tag: options.tag || 'document.pair-listener',
        }
      ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent>
  ).pipe(
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
    concatMap((msg) => {
      if (
        msg.type === 'mutation' &&
        (msg.transition === 'update' || msg.transition === 'appear') &&
        !msg.documentId.startsWith('drafts') &&
        msg.transactionId.startsWith('publish')
      ) {
        console.log('[repro] Published createOrReplace received, delaying emit by 10s')
        return timer(1000 * 10)
          .pipe(mapTo(msg))
          .pipe(tap(() => console.log('releasing publish event')))
      }
      return observableOf(msg)
    })
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
