import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../store/_legacy/datastores'
import {type ObserveDocumentAPIConfig} from './createObserveDocument'

const INITIAL_STATE = {loading: true, document: null}

/**
 * @internal
 * @beta
 *
 * Observes a document by its ID and returns the document and loading state
 * it will listen to the document changes.
 */
export function useObserveDocument<T extends SanityDocument>(
  documentId: string,
  apiConfig?: ObserveDocumentAPIConfig,
): {
  document: T | null
  loading: boolean
} {
  const documentPreviewStore = useDocumentPreviewStore()
  const observable = useMemo(
    () =>
      documentPreviewStore
        .unstable_observeDocument(documentId, apiConfig)
        .pipe(map((document) => ({loading: false, document: document as T}))),
    [documentId, documentPreviewStore, apiConfig],
  )
  return useObservable(observable, INITIAL_STATE)
}
