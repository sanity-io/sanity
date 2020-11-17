import {of} from 'rxjs'
import {LoadableState, useLoadable} from '../../util/useLoadable'
import {observePaths} from '../../preview'

export function useDocumentValues<T = Record<string, unknown>>(
  documentId: string | undefined,
  paths: string[]
): LoadableState<T> {
  return useLoadable(
    documentId ? observePaths(documentId, paths as any[]) : of(undefined)
  ) as LoadableState<T>
}
