import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {map} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../store/datastores'
import {useShallowUnique} from '../util/useShallowUnique'
import {type ObserveDocumentAPIConfig} from './createObserveDocument'

const INITIAL_STATE = {loading: true, document: null}

/**
 * @internal
 * @beta
 *
 * Observes a document by its ID and returns the document and loading state
 * it will listen to the document changes.
 */
export function useUnstableObserveDocument<T extends SanityDocument>(
  documentId: string,
  unstableApiConfig?: ObserveDocumentAPIConfig,
): {
  document: T | null
  loading: boolean
} {
  const documentPreviewStore = useDocumentPreviewStore()
  // Keyed on contents: `apiConfig` is naturally passed as an inline object
  // literal, and its reference feeds the observable identity below — a fresh
  // identity per render is loop-capable under react-rx v5.
  const apiConfig = useShallowUnique(unstableApiConfig)
  const observable = useMemo(
    () =>
      documentPreviewStore
        .unstable_observeDocument(documentId, apiConfig)
        .pipe(map((document) => ({loading: false, document: document as T}))),
    [documentId, documentPreviewStore, apiConfig],
  )
  // Kept synchronous: the observable is keyed to the live `documentId`, so a
  // deferred snapshot could briefly hand callers the previous document with
  // `loading: false` under the new id.
  return useSyncObservable(observable, INITIAL_STATE)
}

/**
 * @deprecated Use `useUnstableObserveDocument` instead
 * @internal
 * @beta
 */
export const unstable_useObserveDocument = function useObserveDocument(
  args: Parameters<typeof useUnstableObserveDocument>,
) {
  return useUnstableObserveDocument(...args)
}
