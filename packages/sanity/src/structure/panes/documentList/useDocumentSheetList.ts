import {type SanityDocument} from '@sanity/migrate'
import {useMemo} from 'react'
import {getPublishedId, type SchemaType, useEditStateList, useUnique} from 'sanity'
import {type DocumentListPaneNode} from 'sanity/structure'

import {EMPTY_RECORD} from './constants'
import {applyOrderingFunctions} from './helpers'
import {useShallowUnique} from './PaneContainer'
import {type SortOrder} from './types'
import {useDocumentList} from './useDocumentList'

interface DocumentSheetListOptions {
  schemaType: SchemaType
  paneOptions: DocumentListPaneNode['options']
  sortOrder?: SortOrder
}
export function useDocumentSheetList({
  schemaType,
  sortOrder: sortOrderRaw,
  paneOptions,
}: DocumentSheetListOptions) {
  const typeName = schemaType.name

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schemaType as any)
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)

  const params = useShallowUnique(paneOptions.params || EMPTY_RECORD)

  const {
    error,
    hasMaxItems,
    isLazyLoading,
    isSearchReady,
    onListChange,
    onRetry,
    isLoading,
    items,
  } = useDocumentList({
    apiVersion: paneOptions.apiVersion,
    filter: paneOptions.filter,
    params,
    searchQuery: '',
    sortOrder,
  })
  const list = useMemo(() => items.map((i) => getPublishedId(i._id)), [items])

  const editStateList = useEditStateList(list, typeName)

  const data: SanityDocument[] = useMemo(() => {
    if (!editStateList) return []
    return editStateList?.map((editState) => {
      if (editState.draft) {
        return {
          ...editState.draft,
          _options: {
            ready: editState.ready,
          },
        }
      }
      if (editState.published) {
        return {
          ...editState.published,
          _options: {
            ready: editState.ready,
          },
        }
      }
      return {
        _id: editState.id,
        _type: editState.type,
        _options: {
          ready: editState.ready,
        },
      }
    })
  }, [editStateList])

  return {data, isLoading, onListChange, isLazyLoading, error, hasMaxItems, onRetry, isSearchReady}
}
