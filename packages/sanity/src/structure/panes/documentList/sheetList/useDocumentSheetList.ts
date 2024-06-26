import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useMemo} from 'react'
import {getDraftId, getPublishedId, useSearchState} from 'sanity'

import {type DocumentSheetTableRow} from './types'
import {useDocumentSheetListStore} from './useDocumentSheetListStore'

export function useDocumentSheetList(schemaType: ObjectSchemaType): {
  data: DocumentSheetTableRow[]
  isLoading: boolean
} {
  const typeName = schemaType.name
  const {state, dispatch} = useSearchState()

  useEffect(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType})
    return () => {
      dispatch({type: 'TERMS_TYPE_REMOVE', schemaType})
    }
  }, [schemaType, dispatch])

  const items = useMemo(() => {
    const map = new Map()
    state.result.hits.forEach((h, resultIndex) =>
      map.set(getPublishedId(h.hit._id), {...h.hit, resultIndex}),
    )
    return map
  }, [state.result.hits])

  const handleDocumentAdded = useCallback(
    (document: SanityDocument) => {
      items.set(getPublishedId(document._id), document)
    },
    [items],
  )
  const handleDocumentDeleted = useCallback(
    (id: string) => {
      items.delete(getPublishedId(id))
    },
    [items],
  )

  // The store is listening to all the documents that match with the _type filter.
  const {
    data,
    isLoading,
    documents: allDocuments,
  } = useDocumentSheetListStore({
    filter: `_type == "${typeName}"`,
    onDocumentDeleted: handleDocumentDeleted,
    onDocumentAdded: handleDocumentAdded,
  })

  // Only return the documents that match with the serverSide filter items.
  const documents: DocumentSheetTableRow[] = useMemo(() => {
    const getSortIndexForId = (document: SanityDocument) =>
      items.get(getPublishedId(document._id))?.resultIndex ?? Number.MAX_SAFE_INTEGER

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
      .sort((a, b) => getSortIndexForId(a) - getSortIndexForId(b))
  }, [data, items, allDocuments])

  return {data: documents, isLoading}
}
