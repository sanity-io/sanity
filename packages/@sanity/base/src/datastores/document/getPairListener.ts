/* eslint-disable @typescript-eslint/no-use-before-define */
import {defer, of as observableOf, Observable} from 'rxjs'
import {concatMap, map} from 'rxjs/operators'
import {
  IdPair,
  MutationEvent,
  ReconnectEvent,
  SanityClient,
  SanityDocument,
  WelcomeEvent,
} from './types'

interface Snapshots {
  draft: SanityDocument | null
  published: SanityDocument | null
}

export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: SanityDocument | null
}

export {MutationEvent}

export type ListenerEvent = MutationEvent | ReconnectEvent | InitialSnapshotEvent

export function getPairListener(client: SanityClient, idPair: IdPair) {
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
        }
      ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent>
  ).pipe(
    concatMap((event) =>
      event.type === 'welcome'
        ? fetchInitialDocumentSnapshots({publishedId, draftId}).pipe(
            concatMap((snapshots) => [
              createSnapshotEvent(draftId, snapshots.draft),
              createSnapshotEvent(publishedId, snapshots.published),
            ])
          )
        : observableOf(event)
    )
  )

  function fetchInitialDocumentSnapshots({publishedId, draftId}): Observable<Snapshots> {
    return client.observable
      .getDocuments<SanityDocument>([draftId, publishedId])
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
