/* eslint-disable @typescript-eslint/no-use-before-define */
import type {SanityDocument} from '@sanity/types'
import {defer, of as observableOf, Observable} from 'rxjs'
import {concatMap, map} from 'rxjs/operators'
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
): Observable<ListenerEvent> {
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
    )
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
