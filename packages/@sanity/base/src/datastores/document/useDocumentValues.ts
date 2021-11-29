import {useMemo} from 'react'
import type {Observable} from 'rxjs'
import {of} from 'rxjs'
import type {LoadableState} from '../../util/useLoadable'
import {useLoadable} from '../../util/useLoadable'
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
