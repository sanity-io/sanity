import {useMemoObservable} from 'react-rx'
import {useDatastores} from '../datastores'
import type {EditStateFor} from '../datastores/document/document-pair/editState'

export function useEditState(publishedDocId: string, docTypeName: string): EditStateFor {
  const {documentStore} = useDatastores()

  return useMemoObservable(
    () => documentStore.pair.editState(publishedDocId, docTypeName),
    [publishedDocId, docTypeName]
  ) as EditStateFor
}
