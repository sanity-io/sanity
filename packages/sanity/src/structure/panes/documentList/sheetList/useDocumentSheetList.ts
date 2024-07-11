import {useMemo} from 'react'
import {getPublishedId, useSearchState} from 'sanity'

import {useDocumentSheetListStore} from './useDocumentSheetListStore'

interface DocumentSheetListOptions {
  /** The schemaType.name  */
  typeName: string
}

export function useDocumentSheetList({typeName}: DocumentSheetListOptions) {
  const {state} = useSearchState()

  const items = useMemo(() => {
    const map = new Map()
    state.result.hits.forEach((h) => map.set(getPublishedId(h.hit._id), h.hit))
    return map
  }, [state.result.hits])

  // The store is listening to all the documents that match with the _type filter.
  const {data, isLoading} = useDocumentSheetListStore({
    filter: `_type == "${typeName}"`,
  })

  // Only return the documents that match with the serverSide filter items.
  const documents = useMemo(() => {
    return data.filter((doc) => items.has(getPublishedId(doc._id)))
  }, [data, items])

  return {data: documents, isLoading}
}
