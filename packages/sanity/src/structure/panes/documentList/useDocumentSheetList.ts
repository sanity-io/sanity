import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import {combineLatest} from 'rxjs'
import {type EditStateFor, getPublishedId, useDocumentStore, useSearchState} from 'sanity'

interface DocumentSheetListOptions {
  /**The schemaType.name  */
  typeName: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEditStateList(publishedDocIds: string[], docTypeName: string): EditStateFor[] {
  const documentStore = useDocumentStore()
  return useMemoObservable(() => {
    return combineLatest(
      publishedDocIds.map((publishedDocId) =>
        documentStore.pair.editState(publishedDocId, docTypeName),
      ),
    )
  }, [documentStore.pair, publishedDocIds, docTypeName]) as EditStateFor[]
}

export function useDocumentSheetList({typeName}: DocumentSheetListOptions) {
  const {state} = useSearchState()

  const items = useMemo(() => {
    return state.result.hits.map((h) => getPublishedId(h.hit._id))
  }, [state.result.hits])

  const docs = useEditStateList(items, typeName)
  const tableData: SanityDocument[] = useMemo(() => {
    return (docs || []).map((d) => {
      if (d.draft) {
        return d.draft
      }
      if (d.published) {
        return d.published
      }
      return {
        _type: d.type,
        _id: d.id,
        _loading: !d.ready,
        _rev: '', // fake a SanityDocument type
        _createdAt: '',
        _updatedAt: '',
      }
    })
  }, [docs])

  return {data: tableData, isLoading: false}
}
