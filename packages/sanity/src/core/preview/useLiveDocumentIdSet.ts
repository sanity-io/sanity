import {type QueryParams} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {scan} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../store/_legacy/datastores'
import {type DocumentPreviewStore} from './documentPreviewStore'
import {type DocumentIdSetObserverState} from './liveDocumentIdSet'

const INITIAL_STATE = {status: 'loading' as const, documentIds: []}

export type LiveDocumentSetState =
  | {status: 'loading'; documentIds: string[]}
  | DocumentIdSetObserverState

type Options = {
  // how to insert new document ids. Defaults to `sorted`
  insert?: 'sorted' | 'prepend' | 'append'
  apiVersion?: string
}

/**
 * @internal
 * @beta
 * Returns document ids that matches the provided GROQ-filter, and loading state
 * The document ids are returned in ascending order and will update in real-time
 * Whenever a document appears or disappears from the set, a new array with the updated set of IDs will be returned.
 * This provides a lightweight way of subscribing to a list of ids for simple cases where you just want the documents ids
 * that matches a particular filter.
 */
export function useLiveDocumentIdSet(filter: string, params?: QueryParams, options: Options = {}) {
  const documentPreviewStore = useDocumentPreviewStore()
  const observable = useMemoObservable(documentPreviewStore, options, filter, params)
  return useObservable(observable, INITIAL_STATE)
}

function useMemoObservable(
  documentPreviewStore: DocumentPreviewStore,
  options: Options,
  filter: string,
  params?: QueryParams,
) {
  return useMemo(
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
}
