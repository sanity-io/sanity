import {of} from 'rxjs'
import {observePaths} from '@sanity/preview'
import {LoadableState, useLoadable} from '../../util/useLoadable'

export function useDocumentValues<T = Record<string, unknown>>(
  documentId: string | undefined,
  paths: string[]
): LoadableState<T> {
  return useLoadable(documentId ? observePaths(documentId, paths) : of(undefined))
}
