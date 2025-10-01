import {filter, map, type Observable, startWith} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {type DocumentPreviewStore, getPublishedId, type SanityDocument} from 'sanity'

export const INITIAL_STATE = {
  documents: [],
  loading: true,
}
export function getIncomingReferences({
  documentId,
  documentPreviewStore,
  type,
  filterQuery,
}: {
  documentId: string
  documentPreviewStore: DocumentPreviewStore
  type: string
  filterQuery?: string
}): Observable<{
  documents: SanityDocument[]
  loading: boolean
}> {
  const publishedId = getPublishedId(documentId)

  return documentPreviewStore
    .unstable_observeDocumentIdSet(
      `references("${publishedId}") && _type == $type ${filterQuery ? `&& ${filterQuery}` : ''}`,
      {type: type},
      {insert: 'append'},
    )
    .pipe(
      map((state) => state.documentIds),
      mergeMapArray((id: string) => {
        return documentPreviewStore.unstable_observeDocument(id).pipe(
          filter(Boolean),
          map((doc) => doc),
        )
      }),
      // Remove duplicates due to different versions of the same document.
      // TODO: do we want to do this? Or maybe we show each of the versions?
      map((documents) => {
        const seenPublishedId: string[] = []
        return documents.filter((doc) => {
          const pId = getPublishedId(doc._id)
          if (seenPublishedId.includes(pId)) return false

          seenPublishedId.push(pId)
          return true
        })
      }),

      map((documents) => ({documents, loading: false})),
      startWith(INITIAL_STATE),
    )
}
