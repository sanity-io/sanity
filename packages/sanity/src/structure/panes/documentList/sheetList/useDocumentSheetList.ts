import {useMemo} from 'react'
import {getDraftId, getPublishedId, useSearchState} from 'sanity'

import {type DocumentSheetTableRow} from './types'
import {useDocumentSheetListStore} from './useDocumentSheetListStore'

interface DocumentSheetListOptions {
  /**The schemaType.name  */
  typeName: string
}

export function useDocumentSheetList({typeName}: DocumentSheetListOptions): {
  data: DocumentSheetTableRow[]
  isLoading: boolean
} {
  const {state} = useSearchState()

  const items = useMemo(() => {
    const map = new Map()
    state.result.hits.forEach((h) => map.set(getPublishedId(h.hit._id), h.hit))
    return map
  }, [state.result.hits])

  // The store is listening to all the documents that match with the _type filter.
  const {
    data,
    isLoading,
    documents: allDocuments,
  } = useDocumentSheetListStore({
    filter: `_type == "${typeName}"`,
  })

  // Only return the documents that match with the serverSide filter items.
  const documents: DocumentSheetTableRow[] = useMemo(() => {
    return data
      .filter((doc) => items.has(getPublishedId(doc._id)))
      .map((doc) => {
        const draftId = getDraftId(doc._id)
        const publishedId = getPublishedId(doc._id)
        const draft = allDocuments[draftId]
        const published = allDocuments[publishedId]
        return {
          ...doc,
          __metadata: {
            idPair: {
              draftId,
              publishedId,
            },
            snapshots: {
              draft,
              published,
            },
          },
        }
      })
  }, [data, items, allDocuments])

  return {data: documents, isLoading}
}
