import {useMemo} from 'react'
import {Observable, of} from 'rxjs'
import {LoadableState, useLoadable} from '../../util/useLoadable'
import {useDatastores} from '../useDatastores'

export function useDocumentValues<T = Record<string, unknown>>(
  documentId: string,
  paths: string[]
): LoadableState<T | undefined> {
  const {documentPreviewStore} = useDatastores()

  const documentValues$ = useMemo(
    () =>
      documentId
        ? (documentPreviewStore.observePaths(documentId, paths) as Observable<T>)
        : of(undefined),
    [documentId, documentPreviewStore, paths]
  )

  return useLoadable(documentValues$)
}
