import {type QueryParams} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useDocumentPreviewStore} from '../store'

const INITIAL_VALUE = {loading: true, documents: []}

/**
 * @internal
 * @beta
 *
 * Observes a set of documents matching the filter and returns an array of complete documents
 * A new array will be pushed whenever a document in the set changes
 * Document ids are returned in ascending order
 * Any sorting beyond that must happen client side
 */
export function useLiveDocumentSet(
  groqFilter: string,
  params?: QueryParams,
  options: {
    // how to insert new document ids. Defaults to `sorted`
    insert?: 'sorted' | 'prepend' | 'append'
    apiVersion?: string
  } = {},
): {loading: boolean; documents: SanityDocument[]} {
  const documentPreviewStore = useDocumentPreviewStore()
  const observable = useMemo(() => {
    return documentPreviewStore.unstable_observeDocumentIdSet(groqFilter, params, options).pipe(
      map((state) => (state.documentIds || []) as string[]),
      mergeMapArray((id) =>
        documentPreviewStore.unstable_observeDocument(id, {apiVersion: options.apiVersion}),
      ),
      map((docs) => ({loading: false, documents: docs as SanityDocument[]})),
    )
  }, [documentPreviewStore, groqFilter, params, options])
  return useObservable(observable, INITIAL_VALUE)
}
