import {useMemo} from 'react'
import {Observable, of} from 'rxjs'
import {LoadableState, useLoadable} from '../../util/useLoadable'
import {observePaths} from '../../preview'

export function useDocumentValues<T = Record<string, unknown>>(
  documentId: string,
  paths: string[]
): LoadableState<T | undefined> {
  return useLoadable(
    useMemo(
      () => (documentId ? (observePaths(documentId, paths) as Observable<T>) : of(undefined)),
      [documentId, paths]
    )
  )
}
