import {useMemo} from 'react'
import {type Observable, of} from 'rxjs'

import {type LoadableState, useLoadable} from '../../../util/useLoadable'
import {useShallowUnique} from '../../../util/useShallowUnique'
import {useDocumentPreviewStore} from '../../datastores'

/** @internal */
export function useDocumentValues<T = Record<string, unknown>>(
  documentId: string,
  paths: string[],
): LoadableState<T | undefined> {
  const documentPreviewStore = useDocumentPreviewStore()

  const stablePaths = useShallowUnique(paths)

  const documentValues$ = useMemo(
    () =>
      documentId
        ? (documentPreviewStore.observePaths(
            {_type: 'reference', _ref: documentId},
            stablePaths,
          ) as Observable<T>)
        : of(undefined),
    [documentId, documentPreviewStore, stablePaths],
  )

  return useLoadable(documentValues$)
}
