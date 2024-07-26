import {type QueryParams} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {scan} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../store/_legacy/datastores'
import {type DocumentIdSetObserverState} from './liveDocumentIdSet'

const INITIAL_STATE = {status: 'loading' as const, documentIds: []}

export type LiveDocumentSetState =
  | {status: 'loading'; documentIds: string[]}
  | DocumentIdSetObserverState

/**
 * @internal
 * @beta
 *
 * Observes a document by its ID and returns the document and loading state
 * it will listen to the document changes.
 */
export function useLiveDocumentIdSet(
  filter: string,
  params?: QueryParams,
  options: {
    // how to insert new document ids. Defaults to `sorted`
    insert?: 'sorted' | 'prepend' | 'append'
  } = {},
) {
  const documentPreviewStore = useDocumentPreviewStore()
  const observable = useMemo(
    () =>
      documentPreviewStore.unstable_observeDocumentIdSet(filter, params, options).pipe(
        scan(
          (currentState: LiveDocumentSetState, nextState) => ({
            ...currentState,
            ...nextState,
          }),
          INITIAL_STATE,
        ),
      ),
    [documentPreviewStore, filter, params, options],
  )
  return useObservable(observable, INITIAL_STATE)
}
