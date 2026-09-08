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

  // Consumers routinely pass `paths` as an inline literal. Keying the memo on
  // the array reference would rebuild the observable on every render, which
  // react-rx v5 turns into a self-sustaining render loop (each new identity's
  // deferred pass re-renders, minting another identity — see
  // __tests__/useDocumentValuesRenderLoop.repro.test.tsx). Key on contents.
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
