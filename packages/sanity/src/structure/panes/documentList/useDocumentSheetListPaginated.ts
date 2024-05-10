import {type SanityDocument} from '@sanity/migrate'
import {useMemo} from 'react'
import {getPublishedId, useEditStateList, useSearchState} from 'sanity'

interface DocumentSheetListOptions {
  /**The schemaType.name  */
  typeName: string
  page: number
  pageSize: number
}
/**
 * This could be improved by doing combined queries.
 * 1) Query to fetch all the documents that we could have in the table, using the [_type ] filter only, with a projection for the fields that will be displayed.
 * 2) Mount the listeners using the useEditStateList, only for the elements displayed in the table, this will keep the documents in sync.
 *
 * By doing this, we could have an initial load in which the table is populated with the documents, and then the listeners are mounted to keep the documents in sync.
 *
 * Check implementation of the useDocumentSheetListStore
 *
 */
export function useDocumentSheetListPaginated({
  typeName,
  page = 1,
  pageSize = 25,
}: DocumentSheetListOptions) {
  const {state} = useSearchState()

  const items = useMemo(
    () => state.result.hits.slice((page - 1) * pageSize, page * pageSize),
    [state.result.hits, page, pageSize],
  )
  const list = useMemo(() => items.map((hit) => getPublishedId(hit.hit._id)), [items])

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

  return {data, isLoading: state.result.loading}
}
