import client from 'part:@sanity/base/client'
import {defer, forkJoin, of as observableOf} from 'rxjs'
import {concatMap, map} from 'rxjs/operators'

function fetchDocumentSnapshots({publishedId, draftId}) {
  return client.observable
    .getDocuments([draftId, publishedId])
    .pipe(map(([draft, published]) => ({draft, published})))
}

function createSnapshotEvent(documentId, document) {
  return {
    type: 'snapshot',
    documentId: documentId,
    document
  }
}

export function getPairListener(idPair) {
  const {publishedId, draftId} = idPair
  return defer(() =>
    client.observable.listen(
      `*[_id == $publishedId || _id == $draftId]`,
      {
        publishedId,
        draftId
      },
      {includeResult: false, events: ['welcome', 'mutation', 'reconnect']}
    )
  ).pipe(
    concatMap(event =>
      event.type === 'welcome'
        ? fetchDocumentSnapshots({publishedId, draftId}).pipe(
            concatMap(snapshots => [
              createSnapshotEvent(draftId, snapshots.draft),
              createSnapshotEvent(publishedId, snapshots.published)
            ])
          )
        : observableOf(event)
    )
  )
}
