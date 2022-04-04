import {useMemoObservable} from 'react-rx'
import {useDocumentStore} from '../datastores'
import type {EditStateFor} from '../datastores/document/document-pair/editState'

export function useEditState(publishedDocId: string, docTypeName: string): EditStateFor {
  const documentStore = useDocumentStore()

  return useMemoObservable(
    () => documentStore.pair.editState(publishedDocId, docTypeName),
    [publishedDocId, docTypeName]
  ) as EditStateFor
}
