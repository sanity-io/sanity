import client from 'part:@sanity/base/client'
import {of as observableOf} from 'rxjs'
import {concatMap} from 'rxjs/operators'

const DOCS_QUERY = `{
 "published": *[_id == $publishedId][0],
 "draft": *[_id == $draftId][0]
}`

function fetchDocumentSnapshots({publishedId, draftId}) {
  return client.observable.fetch(DOCS_QUERY, {
    publishedId,
    draftId
  })
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
  return client.observable
    .listen(
      `*[_id == $publishedId || _id == $draftId]`,
      {
        publishedId,
        draftId
      },
      {includeResult: false, events: ['welcome', 'mutation', 'reconnect']}
    )
    .pipe(
      concatMap(
        event =>
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
