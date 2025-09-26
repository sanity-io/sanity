import {filter, map, type Observable, startWith} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {type DocumentPreviewStore, getPublishedId, type SanityDocument} from 'sanity'

const INITIAL_STATE = {
  list: [],
  loading: true,
}
export function getIncomingReferences({
  documentId,
  documentPreviewStore,
  types,
  filterQuery,
}: {
  documentId: string
  documentPreviewStore: DocumentPreviewStore
  types: string[]
  filterQuery?: string
}): Observable<{
  list: {
    type: string
    documents: SanityDocument[]
  }[]
  loading: boolean
}> {
  const publishedId = getPublishedId(documentId)
  //  If only one type is defined, use type == $type, otherwise use _type in $types
  const typeFilter = types.length > 1 ? `_type in $types` : `_type == $type`
  const typesParam = types.length > 1 ? {types} : {type: types[0]}
  return documentPreviewStore
    .unstable_observeDocumentIdSet(
      `references("${publishedId}") && ${typeFilter} ${filterQuery ? `&& ${filterQuery}` : ''}`,
      typesParam,
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
      map((documents) => {
        return types.map((type) => ({
          type,
          documents: documents.filter((doc) => doc._type === type),
        }))
      }),
      map((list) => ({list, loading: false})),
      startWith(INITIAL_STATE),
    )
}
